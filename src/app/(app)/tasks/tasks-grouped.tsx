"use client";

import { useState, useCallback, useTransition, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { formatMoney, formatHours } from "@/lib/format";
import { TASK, FILTER } from "@/lib/strings";
import { gentle } from "@/lib/motion";
import {
  type TaskWithClient,
  type TaskStatus,
  type TaskType,
  type Client,
  TASK_TYPE_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/types";
import { SortableTaskCard, TaskCardStatic } from "./task-card";
import { TasksForm } from "./tasks-form";
import { updateTaskPosition, deleteTask, quickAddTask } from "./actions";

/* ── Types ───────────────────────────────────────────────────────────── */
type GroupBy = "status" | "client" | "type" | "none";

interface Group {
  id: string;
  label: string;
  tasks: TaskWithClient[];
  tone: "accent" | "teal" | "amber" | "muted" | "rose";
}

/* ── Position helpers ────────────────────────────────────────────────── */
function midpoint(a: number | null | undefined, b: number | null | undefined): number {
  const now = Date.now();
  if (a == null && b == null) return now;
  if (a == null) return (b ?? now) - 1000;
  if (b == null) return a + 1000;
  return (a + b) / 2;
}

/* ── Build groups ────────────────────────────────────────────────────── */
function buildGroups(tasks: TaskWithClient[], groupBy: GroupBy, clients: Client[]): Group[] {
  if (groupBy === "none") {
    return [{ id: "all", label: "All tasks", tasks, tone: "muted" }];
  }
  if (groupBy === "status") {
    const order: TaskStatus[] = ["todo", "doing", "done"];
    const tones = { todo: "muted", doing: "amber", done: "teal" } as const;
    return order.map(s => ({
      id: s,
      label: TASK_STATUS_LABEL[s],
      tasks: tasks.filter(t => t.status === s),
      tone: tones[s],
    }));
  }
  if (groupBy === "type") {
    const order: TaskType[] = ["on_demand", "maintain"];
    const tones = { on_demand: "teal", maintain: "accent" } as const;
    return order.map(ty => ({
      id: ty,
      label: TASK_TYPE_LABEL[ty],
      tasks: tasks.filter(t => t.type === ty),
      tone: tones[ty],
    }));
  }
  if (groupBy === "client") {
    const groups: Group[] = clients.map(c => ({
      id: c.id,
      label: c.name,
      tasks: tasks.filter(t => t.client_id === c.id),
      tone: "accent" as const,
    }));
    const unassigned = tasks.filter(t => !t.client_id);
    if (unassigned.length > 0 || groups.length === 0) {
      groups.push({ id: "__none__", label: "Unassigned", tasks: unassigned, tone: "muted" });
    }
    return groups.filter(g => g.tasks.length > 0 || clients.find(c => c.id === g.id));
  }
  return [];
}

/* ── Group field derivation ──────────────────────────────────────────── */
function groupFieldUpdate(
  groupBy: GroupBy,
  newGroupId: string,
): { field: "status" | "client_id" | "type"; value: string | null } | undefined {
  if (groupBy === "status") return { field: "status",    value: newGroupId as TaskStatus };
  if (groupBy === "type")   return { field: "type",      value: newGroupId as TaskType   };
  if (groupBy === "client") return { field: "client_id", value: newGroupId === "__none__" ? null : newGroupId };
  return undefined;
}

function groupOverrides(
  groupBy: GroupBy,
  groupId: string,
): { client_id?: string | null; status?: TaskStatus; type?: TaskType } {
  if (groupBy === "status") return { status: groupId as TaskStatus };
  if (groupBy === "type")   return { type: groupId as TaskType };
  if (groupBy === "client") return { client_id: groupId === "__none__" ? null : groupId };
  return {};
}

/* ── Quick-add input ─────────────────────────────────────────────────── */
function GroupQuickAdd({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [active, setActive] = useState(false);
  const [name,   setName]   = useState("");
  const [pending, start]    = useTransition();
  const inputRef            = useRef<HTMLInputElement>(null);

  function activate() { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) { setActive(false); return; }
    start(async () => {
      await onAdd(trimmed);
      setName("");
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter")  submit();
    if (e.key === "Escape") { setActive(false); setName(""); }
  }

  return (
    <div className="px-2 pb-1">
      {active ? (
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => { name.trim() ? submit() : setActive(false); }}
          placeholder="Task name… Enter to add, Esc to cancel"
          disabled={pending}
          className="w-full rounded-lg border border-accent/40 bg-panel px-3 py-[7px] text-sm text-fg outline-none ring-2 ring-accent/20 placeholder:text-muted"
        />
      ) : (
        <button
          onClick={activate}
          className="tf-ring flex items-center gap-1.5 rounded-lg px-2 py-[7px] text-xs font-medium text-muted transition-colors hover:text-fg"
        >
          <Plus size={13} /> Add task
        </button>
      )}
    </div>
  );
}

/* ── Droppable container ─────────────────────────────────────────────── */
function DroppableGroup({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[32px] rounded-lg transition-colors duration-150 ${isOver ? "ring-1 ring-accent/30 bg-accent-soft/10" : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Dot colors ──────────────────────────────────────────────────────── */
const dotColor: Record<string, string> = {
  accent: "bg-accent",
  teal:   "bg-teal",
  amber:  "bg-amber",
  muted:  "bg-fg-2/40",
  rose:   "bg-rose",
};

/* ── Collapsible group ───────────────────────────────────────────────── */
function GroupSection({
  group,
  groupBy,
  clients,
  currency,
  taskIds,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onQuickAdd,
}: {
  group: Group;
  groupBy: GroupBy;
  clients: Client[];
  currency: string;
  taskIds: string[];
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onEdit: (t: TaskWithClient) => void;
  onDelete: (t: TaskWithClient) => void;
  onQuickAdd: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);

  const hours  = group.tasks.filter(t => t.type === "on_demand").reduce((s, t) => s + Number(t.hours  ?? 0), 0);
  const amount = group.tasks.filter(t => t.type === "on_demand").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="mb-2">
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="tf-ring mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-panel-2/60"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="text-muted/50"
        >
          <ChevronRight size={13} />
        </motion.span>

        <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${dotColor[group.tone] ?? "bg-fg-2/40"}`} />
        <span className="text-xs font-medium text-fg-2">{group.label}</span>
        <span className="font-mono text-xs text-muted">{group.tasks.length}</span>

        <div className="ml-auto flex items-center gap-3 font-mono text-xs text-muted">
          {hours > 0  && <span>{formatHours(hours)}</span>}
          {amount > 0 && <span className="text-teal">{formatMoney(amount, currency)}</span>}
        </div>
      </button>

      {/* Tasks */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { ...gentle, opacity: { duration: 0.15 } } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            {/* Quick-add at top */}
            <GroupQuickAdd onAdd={onQuickAdd} />

            <DroppableGroup id={group.id}>
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col">
                  {group.tasks.length === 0 ? (
                    <p className="mx-2 rounded-lg border border-dashed border-border py-5 text-center text-xs text-muted">
                      Drop tasks here
                    </p>
                  ) : (
                    group.tasks.map(task => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        clients={clients}
                        currency={currency}
                        groupBy={groupBy}
                        selected={selectedIds?.has(task.id) ?? false}
                        onToggleSelect={onToggleSelect ? () => onToggleSelect(task.id) : undefined}
                        onEdit={() => onEdit(task)}
                        onDelete={() => onDelete(task)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DroppableGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export function TasksGrouped({
  tasks: initialTasks,
  clients,
  currency,
  initialGroupBy = "status",
  onGroupByChange,
  selectedIds,
  onToggleSelect,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  initialGroupBy?: GroupBy;
  onGroupByChange?: (g: GroupBy) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const router      = useRouter();
  const toast       = useToast();
  const { confirm } = useConfirm();

  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy);
  const handleGroupByChange = (g: GroupBy) => { setGroupBy(g); onGroupByChange?.(g); };

  const [tasks,    setTasks]    = useState<TaskWithClient[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<TaskWithClient | null>(null);
  const [, startTransition]     = useTransition();

  // Sync local state when server re-fetches
  const [prevInitial, setPrevInitial] = useState(initialTasks);
  if (initialTasks !== prevInitial) {
    setPrevInitial(initialTasks);
    setTasks(initialTasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor,  { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groups     = buildGroups(tasks, groupBy, clients);
  const activeTask = tasks.find(t => t.id === activeId);

  // Refs so callbacks stay stable during rapid drag events
  const groupsRef  = useRef(groups);
  groupsRef.current = groups;
  const groupByRef = useRef(groupBy);
  groupByRef.current = groupBy;

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  const onDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over) return;
    const gs          = groupsRef.current;
    const gb          = groupByRef.current;
    const findGroup   = (id: string) => gs.find(g => g.tasks.some(t => t.id === id))?.id ?? null;
    const activeGroupId = findGroup(active.id as string);
    const overIsGroup   = gs.some(g => g.id === over.id);
    const targetGroupId = overIsGroup
      ? (over.id as string)
      : (findGroup(over.id as string) ?? activeGroupId ?? "");

    if (!targetGroupId) return;
    const overTaskId = overIsGroup ? null : (over.id as string);

    setTasks(prev => {
      const task = prev.find(t => t.id === active.id);
      if (!task) return prev;
      const gUpdate = groupFieldUpdate(gb, targetGroupId);
      const updated: TaskWithClient = {
        ...task,
        ...(gUpdate?.field === "status"    ? { status:    gUpdate.value as TaskStatus } : {}),
        ...(gUpdate?.field === "type"      ? { type:      gUpdate.value as TaskType   } : {}),
        ...(gUpdate?.field === "client_id" ? { client_id: gUpdate.value               } : {}),
      };
      const without = prev.filter(t => t.id !== (active.id as string));
      if (!overTaskId || overTaskId === targetGroupId) return [...without, updated];
      const idx = without.findIndex(t => t.id === overTaskId);
      if (idx === -1) return [...without, updated];
      const next = [...without];
      next.splice(idx, 0, updated);
      return next;
    });
  }, []); // stable — reads from refs

  const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const taskId      = active.id as string;
    const gs          = groupsRef.current;
    const gb          = groupByRef.current;
    const overIsGroup = gs.some(g => g.id === over.id);
    const findGroup   = (id: string) => gs.find(g => g.tasks.some(t => t.id === id))?.id ?? null;
    const targetGroupId = overIsGroup
      ? (over.id as string)
      : (findGroup(over.id as string) ?? "");

    const targetGroup = gs.find(g => g.id === targetGroupId);
    if (!targetGroup) return;

    const taskList = targetGroup.tasks;
    const idx      = taskList.findIndex(t => t.id === taskId);
    const prevPos  = taskList[idx - 1]?.position ?? null;
    const nextPos  = taskList[idx + 1]?.position ?? null;
    const position = midpoint(
      prevPos != null ? Number(prevPos) : null,
      nextPos != null ? Number(nextPos) : null,
    );
    const gUpdate = groupFieldUpdate(gb, targetGroupId);

    startTransition(async () => {
      const { error } = await updateTaskPosition(taskId, position, gUpdate);
      if (error) {
        toast.error(`Reorder failed: ${error}`);
        setTasks(initialTasks);
      }
    });
  }, [initialTasks, toast]);

  const onDelete = useCallback(async (task: TaskWithClient) => {
    const ok = await confirm({ title: TASK.deleteConfirm(task.name), detail: TASK.deleteConfirmDetail });
    if (!ok) return;
    startTransition(async () => {
      setTasks(prev => prev.filter(t => t.id !== task.id));
      await deleteTask(task.id);
      toast.success("Task deleted.");
    });
  }, [confirm, toast]);

  const onQuickAdd = useCallback(async (groupId: string, name: string) => {
    const { error } = await quickAddTask(name, groupOverrides(groupBy, groupId));
    if (error) { toast.error(`Failed: ${error}`); return; }
    router.refresh();
  }, [groupBy, router, toast]);

  const groupByOptions: { v: GroupBy; label: string }[] = [
    { v: "status", label: FILTER.groupByStatus },
    { v: "client", label: FILTER.groupByClient },
    { v: "type",   label: FILTER.groupByType   },
    { v: "none",   label: FILTER.groupByNone   },
  ];

  return (
    <>
      {/* Group-by selector */}
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{FILTER.groupBy}</span>
        <div className="flex rounded-lg border border-border bg-panel-2 p-0.5 gap-0.5">
          {groupByOptions.map(({ v, label }) => (
            <button
              key={v}
              onClick={() => handleGroupByChange(v)}
              className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                groupBy === v ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {groupBy === v && (
                <motion.span
                  layoutId="groupby-pill"
                  className="absolute inset-0 rounded-md bg-panel-3 shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Drag context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div>
          {groups.map(group => (
            <GroupSection
              key={group.id}
              group={group}
              groupBy={groupBy}
              clients={clients}
              currency={currency}
              taskIds={group.tasks.map(t => t.id)}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onEdit={setEditTask}
              onDelete={onDelete}
              onQuickAdd={(name) => onQuickAdd(group.id, name)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {activeTask && (
            <TaskCardStatic
              task={activeTask}
              clients={clients}
              currency={currency}
              groupBy={groupBy}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title={TASK.editTask}>
        {editTask && (
          <TasksForm
            task={editTask}
            clients={clients}
            onDone={() => { setEditTask(null); router.refresh(); }}
          />
        )}
      </Modal>
    </>
  );
}
