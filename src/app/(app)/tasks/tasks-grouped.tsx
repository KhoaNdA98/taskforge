"use client";

import { useState, useCallback, useTransition } from "react";
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
import { ChevronRight, Layers } from "lucide-react";
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
import { updateTaskPosition, deleteTask } from "./actions";

/* ── Types ───────────────────────────────────────────────────────────── */
type GroupBy = "status" | "client" | "type" | "none";

interface Group {
  id: string;           // unique key (status value, client id, type value, "none")
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

/* ── Build groups from tasks ─────────────────────────────────────────── */
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

/* ── Droppable group container ───────────────────────────────────────── */
function DroppableGroup({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] rounded-xl transition-colors duration-150 ${isOver ? "ring-1 ring-accent/40 bg-accent-soft/30" : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Collapsible group ───────────────────────────────────────────────── */
function GroupSection({
  group,
  groupBy,
  clients,
  currency,
  taskIds,
  onEdit,
  onDelete,
}: {
  group: Group;
  groupBy: GroupBy;
  clients: Client[];
  currency: string;
  taskIds: string[];
  onEdit: (t: TaskWithClient) => void;
  onDelete: (t: TaskWithClient) => void;
}) {
  const [open, setOpen] = useState(true);

  const hours  = group.tasks.filter(t => t.type === "on_demand").reduce((s, t) => s + Number(t.hours  ?? 0), 0);
  const amount = group.tasks.filter(t => t.type === "on_demand").reduce((s, t) => s + Number(t.amount),    0);

  const dotColor: Record<string, string> = {
    accent: "bg-accent",
    teal:   "bg-teal",
    amber:  "bg-amber",
    muted:  "bg-fg-2",
    rose:   "bg-rose",
  };

  return (
    <div className="mb-4">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="tf-ring mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-panel-2"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="text-muted"
        >
          <ChevronRight size={15} />
        </motion.span>

        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor[group.tone] ?? "bg-fg-2"}`} />
        <span className="font-medium text-fg text-sm">{group.label}</span>
        <span className="ml-1 font-mono text-xs text-muted">{group.tasks.length}</span>

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
            animate={{ height: "auto", opacity: 1, transition: { ...gentle, opacity: { duration: 0.2 } } }}
            exit={{   height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <DroppableGroup id={group.id}>
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 pb-2 pl-6">
                  {group.tasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted">
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

/* ── Main grouped component ──────────────────────────────────────────── */
export function TasksGrouped({
  tasks: initialTasks,
  clients,
  currency,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
}) {
  const router      = useRouter();
  const toast       = useToast();
  const { confirm } = useConfirm();

  const [groupBy,   setGroupBy]   = useState<GroupBy>("status");
  const [tasks,     setTasks]     = useState<TaskWithClient[]>(initialTasks);
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [editTask,  setEditTask]  = useState<TaskWithClient | null>(null);
  const [, startTransition]       = useTransition();

  // Keep local state in sync when server re-fetches
  // (tasks prop changes after router.refresh())
  const [prevInitial, setPrevInitial] = useState(initialTasks);
  if (initialTasks !== prevInitial) {
    setPrevInitial(initialTasks);
    setTasks(initialTasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor,  { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groups = buildGroups(tasks, groupBy, clients);
  const activeTask = tasks.find(t => t.id === activeId);

  /* Find which group a task belongs to */
  function findGroupId(taskId: string): string | null {
    return groups.find(g => g.tasks.some(t => t.id === taskId))?.id ?? null;
  }

  /* Move a task to a different position / group in local state */
  function moveTask(
    taskId: string,
    overTaskId: string | null,
    targetGroupId: string,
  ) {
    setTasks(prev => {
      const task     = prev.find(t => t.id === taskId);
      if (!task) return prev;

      // Apply group field change optimistically
      const gUpdate = groupFieldUpdate(groupBy, targetGroupId);
      const updated: TaskWithClient = {
        ...task,
        ...(gUpdate?.field === "status"    ? { status:    gUpdate.value as TaskStatus } : {}),
        ...(gUpdate?.field === "type"      ? { type:      gUpdate.value as TaskType   } : {}),
        ...(gUpdate?.field === "client_id" ? { client_id: gUpdate.value               } : {}),
      };

      // Remove task from old position
      const without = prev.filter(t => t.id !== taskId);

      if (!overTaskId || overTaskId === targetGroupId) {
        // Drop at end of group
        return [...without, updated];
      }

      // Insert before overTaskId
      const idx = without.findIndex(t => t.id === overTaskId);
      if (idx === -1) return [...without, updated];
      const next = [...without];
      next.splice(idx, 0, updated);
      return next;
    });
  }

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  const onDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeGroupId = findGroupId(active.id as string);
    const overIsGroup   = groups.some(g => g.id === over.id);
    const targetGroupId = overIsGroup
      ? (over.id as string)
      : (findGroupId(over.id as string) ?? activeGroupId ?? "");

    if (!targetGroupId) return;
    moveTask(
      active.id as string,
      overIsGroup ? null : (over.id as string),
      targetGroupId,
    );
  }, [groups, groupBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const taskId        = active.id as string;
    const overIsGroup   = groups.some(g => g.id === over.id);
    const targetGroupId = overIsGroup
      ? (over.id as string)
      : (findGroupId(over.id as string) ?? "");

    // Compute new position from neighbors in the final sorted state
    const targetGroup = groups.find(g => g.id === targetGroupId);
    if (!targetGroup) return;

    const taskList = targetGroup.tasks;
    const idx      = taskList.findIndex(t => t.id === taskId);
    const prevPos  = taskList[idx - 1]?.position ?? null;
    const nextPos  = taskList[idx + 1]?.position ?? null;
    const position = midpoint(
      prevPos != null ? Number(prevPos) : null,
      nextPos != null ? Number(nextPos) : null,
    );

    const gUpdate  = groupFieldUpdate(groupBy, targetGroupId);

    startTransition(async () => {
      const { error } = await updateTaskPosition(taskId, position, gUpdate);
      if (error) {
        toast.error(`Reorder failed: ${error}`);
        setTasks(initialTasks); // rollback
      }
    });
  }, [groups, groupBy, initialTasks, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDelete = useCallback(async (task: TaskWithClient) => {
    const ok = await confirm({ title: TASK.deleteConfirm(task.name), detail: TASK.deleteConfirmDetail });
    if (!ok) return;
    startTransition(async () => {
      setTasks(prev => prev.filter(t => t.id !== task.id));
      await deleteTask(task.id);
      toast.success("Task deleted.");
    });
  }, [confirm, toast]);

  const groupByOptions: { v: GroupBy; label: string }[] = [
    { v: "status",  label: FILTER.groupByStatus },
    { v: "client",  label: FILTER.groupByClient },
    { v: "type",    label: FILTER.groupByType   },
    { v: "none",    label: FILTER.groupByNone   },
  ];

  const allTaskIds = groups.flatMap(g => g.tasks.map(t => t.id));

  return (
    <>
      {/* Group-by selector */}
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">{FILTER.groupBy}</span>
        <div className="flex rounded-xl border border-border bg-panel-2 p-1 gap-0.5">
          {groupByOptions.map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setGroupBy(v)}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                groupBy === v ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {groupBy === v && (
                <motion.span
                  layoutId="groupby-pill"
                  className="absolute inset-0 rounded-lg bg-panel-3 shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <div className="ml-1 text-muted"><Layers size={14} /></div>
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
              onEdit={setEditTask}
              onDelete={onDelete}
            />
          ))}
        </div>

        {/* Floating drag overlay */}
        <DragOverlay dropAnimation={{
          duration: 220,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
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
