import { AdminTabs } from "@/components/admin-tabs";
import { requireAdmin } from "@/lib/data";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <>
      <AdminTabs />
      {children}
    </>
  );
}
