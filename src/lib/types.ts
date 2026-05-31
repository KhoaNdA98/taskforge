export type TaskType   = "maintain" | "on_demand";
export type TaskStatus = "todo" | "doing" | "review" | "done";

export interface Settings {
  user_id: string;
  hourly_rate: number;
  currency: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  monthly_retainer: number;
  is_maintain_active: boolean;
  note: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  name: string;
  type: TaskType;
  client_id: string | null;
  status: TaskStatus;
  task_date: string;
  hours: number | null;
  rate_snapshot: number;
  amount: number;
  position: number | null;
  note: string | null;
  created_at: string;
}

/** A task row joined with its client name (from the `client:clients(name)` select). */
export interface TaskWithClient extends Task {
  client: { name: string } | null;
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  maintain: "Maintain",
  on_demand: "On-demand",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo:   "To do",
  doing:  "In progress",
  review: "In review",
  done:   "Done",
};
