"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";

export type ClientActionState = { error?: string; ok?: boolean };

export async function saveClient(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const monthly_retainer = Number(formData.get("monthly_retainer") ?? 0);
  const is_maintain_active = formData.get("is_maintain_active") === "on";
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) return { error: "Tên khách hàng không được trống." };
  if (!Number.isFinite(monthly_retainer) || monthly_retainer < 0)
    return { error: "Phí retainer không hợp lệ." };

  const supabase = await createClient();
  const payload = { name, monthly_retainer, is_maintain_active, note };

  const { error } = id
    ? await supabase.from("clients").update(payload).eq("id", id)
    : await supabase.from("clients").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteClient(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
