import { getSettings } from "@/lib/dal";
import { Card, PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Cài đặt"
        subtitle="Rate theo giờ và đơn vị tiền dùng để tính tiền task on-demand."
      />
      <Card className="max-w-md p-6">
        <SettingsForm settings={settings} />
      </Card>
    </>
  );
}
