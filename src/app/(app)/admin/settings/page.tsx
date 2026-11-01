import { SettingsForm } from "@/components/settings-form";
import { Card, PageTitle } from "@/components/ui";
import { getSettings } from "@/lib/data";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageTitle title="Cài đặt" subtitle="Thông tin nhà và tài khoản nhận tiền" />
      <Card>
        {settings ? (
          <SettingsForm settings={settings} />
        ) : (
          <p className="text-sm text-muted">Chưa có cài đặt.</p>
        )}
      </Card>
    </>
  );
}
