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

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "on_demand") as TaskType;
  const status = String(formData.get("status") ?? "todo") as TaskStatus;
  const client_id = String(formData.get("client_id") ?? "") || null;
  const task_date = String(formData.get("task_date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) return { error: "Tên task không được trống." };
  if (!task_date) return { error: "Chọn ngày cho task." };

  const isOnDemand = type === "on_demand";
  const hoursRaw = Number(formData.get("hours") ?? 0);
  const hours = isOnDemand ? (Number.isFinite(hoursRaw) ? hoursRaw : 0) : null;
  if (isOnDemand && (hours == null || hours < 0))
    return { error: "Số giờ không hợp lệ." };

  const supabase = await createClient();
  const base = { name, type, status, client_id, task_date, hours, note };

  if (id) {
    // Edit: keep the original rate_snapshot captured at creation.
    const { error } = await supabase.from("tasks").update(base).eq("id", id);
    if (error) return { error: error.message };
  } else {
    // Create: snapshot the current hourly rate so old reports never shift.
    const settings = await getSettings();
    const { error } = await supabase
      .from("tasks")
      .insert({ ...base, rate_snapshot: settings.hourly_rate });
    if (error) return { error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
