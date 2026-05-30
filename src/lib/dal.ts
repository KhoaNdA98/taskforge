import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";

/** Returns the current user or redirects to /login. Memoized per request. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
});

/**
 * Loads settings, memoized for the duration of the current request.
 * React cache() ensures this runs at most once per page render even if
 * called from multiple components (layout + page).
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) return data as Settings;

  const { data: created } = await supabase
    .from("settings")
    .insert({ user_id: user.id, hourly_rate: 0, currency: "VND" })
    .select("*")
    .single();

  return created as Settings;
});
