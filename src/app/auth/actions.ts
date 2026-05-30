"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUTH } from "@/lib/strings";

export type AuthState = { error?: string; message?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email    = String(formData.get("email")    ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: AUTH.errors.missingFields };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: AUTH.errors.invalidCredentials };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email    = String(formData.get("email")    ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) return { error: AUTH.errors.weakPassword };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return { message: AUTH.signUpSuccess };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
