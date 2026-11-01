import { BottomNav } from "@/components/bottom-nav";
import { getMe } from "@/lib/data";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const me = await getMe();
  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-5 pt-5 pb-28">{children}</main>
      <BottomNav isAdmin={me.isAdmin} />
    </>
  );
}
