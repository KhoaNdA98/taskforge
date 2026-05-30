import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/dal";
import { PageHeader } from "@/components/ui";
import { CLIENT } from "@/lib/strings";
import { ClientsView } from "./clients-view";
import type { Client } from "@/lib/types";

export default async function ClientsPage() {
  const settings = await getSettings();
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title={CLIENT.title} subtitle={CLIENT.subtitle} />
      <ClientsView clients={(data ?? []) as Client[]} currency={settings.currency} />
    </>
  );
}
