"use client";

import { useActionState, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Input, Textarea, Select, Field } from "@/components/ui";
import { Modal, ModalField } from "@/components/modal";
import { useToast } from "@/components/toast";
import { toDateInput } from "@/lib/format";
import { TASK } from "@/lib/strings";
import { staggerItem, fadeUp } from "@/lib/motion";
import { type Client, type TaskWithClient, type TaskType } from "@/lib/types";
import { saveTask, type TaskActionState } from "./actions";

export function TasksForm({
  task,
  clients,
  onDone,
}: {
  task: TaskWithClient | null;
  clients: Client[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [state, action, pending] = useActionState<TaskActionState, FormData>(saveTask, {});
  const [type, setType]          = useState<TaskType>(task?.type ?? "on_demand");

  useEffect(() => {
    if (state.ok) {
      toast.success(task ? "Task updated." : "Task added.");
      onDone();
    }
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}

      <ModalField>
        <Field label={TASK.fields.name}>
          <Input name="name" defaultValue={task?.name ?? ""} placeholder={TASK.fields.namePlaceholder} required autoFocus />
        </Field>
      </ModalField>

      <ModalField>
        <div className="grid grid-cols-2 gap-3">
          <Field label={TASK.fields.type}>
            <Select name="type" value={type} onChange={e => setType(e.target.value as TaskType)}>
              <option value="on_demand">{TASK.type.on_demand}</option>
              <option value="maintain">{TASK.type.maintain}</option>
            </Select>
          </Field>
          <Field label={TASK.fields.date}>
            <Input name="task_date" type="date"
              defaultValue={task ? toDateInput(task.task_date) : toDateInput()} required />
          </Field>
        </div>
      </ModalField>

      <ModalField>
        <div className="grid grid-cols-2 gap-3">
          <Field label={TASK.fields.client}>
            <Select name="client_id" defaultValue={task?.client_id ?? ""}>
              <option value="">{TASK.fields.unassigned}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label={TASK.fields.status}>
            <Select name="status" defaultValue={task?.status ?? "todo"}>
              <option value="todo">{TASK.status.todo}</option>
              <option value="doing">{TASK.status.doing}</option>
              <option value="done">{TASK.status.done}</option>
            </Select>
          </Field>
        </div>
      </ModalField>

      <AnimatePresence>
        {type === "on_demand" && (
          <motion.div
            key="hours"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto", transition: { type: "spring", stiffness: 300, damping: 26 } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            <Field label={TASK.fields.hours} hint={TASK.fields.hoursHint}>
              <Input name="hours" type="number" min={0} step={0.25}
                defaultValue={task?.hours ?? ""} placeholder={TASK.fields.hoursPlaceholder}
                className="font-mono" />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalField>
        <Field label={TASK.fields.note}>
          <Textarea name="note" defaultValue={task?.note ?? ""} />
        </Field>
      </ModalField>

      <AnimatePresence>
        {state.error && (
          <motion.p {...fadeUp} className="text-sm text-rose">{state.error}</motion.p>
        )}
      </AnimatePresence>

      <ModalField>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? TASK.saving : TASK.saveTask}
          </Button>
        </div>
      </ModalField>
    </form>
  );
}
