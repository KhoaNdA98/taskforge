"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";

export type SettingsState = { error?: string; ok?: boolean };

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const hourly_rate = Number(formData.get("hourly_rate"));
  const currency = String(formData.get("currency") ?? "VND");

  if (!Number.isFinite(hourly_rate) || hourly_rate < 0)
    return { error: "Rate không hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: user.id, hourly_rate, currency });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
