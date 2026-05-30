"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSettings, requireUser } from "@/lib/dal";
import type { TaskStatus, TaskType } from "@/lib/types";

export type TaskActionState = { error?: string; ok?: boolean };

export async function saveTask(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  await requireUser();

  const id        = String(formData.get("id") ?? "");
  const name      = String(formData.get("name") ?? "").trim();
  const type      = String(formData.get("type")      ?? "on_demand") as TaskType;
  const status    = String(formData.get("status")    ?? "todo")      as TaskStatus;
  const client_id = String(formData.get("client_id") ?? "") || null;
  const task_date = String(formData.get("task_date") ?? "");
  const note      = String(formData.get("note")      ?? "").trim() || null;

  if (!name)      return { error: "Task name is required." };
  if (!task_date) return { error: "Please select a date." };

  const isOnDemand = type === "on_demand";
  const hoursRaw   = Number(formData.get("hours") ?? 0);
  const hours      = isOnDemand ? (Number.isFinite(hoursRaw) ? hoursRaw : 0) : null;

  const supabase = await createClient();
  const base     = { name, type, status, client_id, task_date, hours, note };

  if (id) {
    const { error } = await supabase.from("tasks").update(base).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const settings = await getSettings();
    // Seed position from now so new tasks sort to the top
    const position = Date.now();
    const { error } = await supabase
      .from("tasks")
      .insert({ ...base, rate_snapshot: settings.hourly_rate, position });
    if (error) return { error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Lightweight partial update — used by inline cells in Table view.
 * Does NOT revalidate (caller does optimistic update; only call refresh on error).
 */
export async function updateTaskField(
  id: string,
  updates: Partial<{
    name: string;
    type: TaskType;
    status: TaskStatus;
    client_id: string | null;
    task_date: string;
    hours: number | null;
    note: string | null;
  }>,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

/**
 * Quick-create a task with just a name + optional group overrides.
 * Used by the "+" row in Table view and per-group add in List view.
 */
export async function quickAddTask(
  name: string,
  overrides?: {
    client_id?: string | null;
    status?: TaskStatus;
    type?: TaskType;
  },
): Promise<{ id?: string; error?: string }> {
  await requireUser();
  const settings = await getSettings();
  const supabase = await createClient();
  const position = Date.now();
  const type = overrides?.type ?? "on_demand";
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      name,
      type,
      status: overrides?.status ?? "todo",
      client_id: overrides?.client_id ?? null,
      task_date: new Date().toISOString().slice(0, 10),
      hours: type === "on_demand" ? 0 : null,
      rate_snapshot: settings.hourly_rate,
      position,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { id: data.id };
}

/**
 * Update position (for reorder) and optionally a group field (cross-group drop).
 * No revalidatePath — caller manages optimistic state; dashboard refreshes via tag.
 */
export async function updateTaskPosition(
  id: string,
  position: number,
  groupUpdate?: { field: "status" | "client_id" | "type"; value: string | null },
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  const updates: Record<string, unknown> = { position };
  if (groupUpdate) updates[groupUpdate.field] = groupUpdate.value;
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

export async function deleteTask(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

/** Bulk update status or client for multiple tasks. */
export async function bulkUpdateTasks(
  ids: string[],
  updates: { status?: TaskStatus; client_id?: string | null },
): Promise<{ error?: string }> {
  if (!ids.length) return {};
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(updates).in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return {};
}

/** Bulk delete multiple tasks. */
export async function bulkDeleteTasks(ids: string[]): Promise<{ error?: string }> {
  if (!ids.length) return {};
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return {};
}
