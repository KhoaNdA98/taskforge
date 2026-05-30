import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";

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
 * Loads settings, cached for 60s per user.
 * Settings rarely change so this avoids a Supabase round trip on every page load.
 * Invalidated on save via revalidatePath("/settings").
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const user = await requireUser();

  const fetchSettings = unstable_cache(
    async (userId: string): Promise<Settings> => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) return data as Settings;

      const { data: created } = await supabase
        .from("settings")
        .insert({ user_id: userId, hourly_rate: 0, currency: "VND" })
        .select("*")
        .single();

      return created as Settings;
    },
    ["settings"],
    { revalidate: 60 },
  );

  return fetchSettings(user.id);
});
