import { getSettings } from "@/lib/dal";
import { Card, PageHeader } from "@/components/ui";
import { SETTINGS } from "@/lib/strings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title={SETTINGS.title} subtitle={SETTINGS.subtitle} />
      <Card className="max-w-md p-6">
        <SettingsForm settings={settings} />
      </Card>
    </>
  );
}
