import { signOut } from "@/app/actions/auth";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Badge, Card, Notice, PageTitle, SectionLabel, buttonClass } from "@/components/ui";
import { getMe, getRooms } from "@/lib/data";

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { reset } = await searchParams;
  const [me, rooms] = await Promise.all([getMe(), getRooms()]);
  const room = rooms.find((r) => r.id === me.roomId);
  return (
    <>
      <PageTitle title={me.name} subtitle={me.email} />
      {reset ? <Notice tone="brand">Đặt mật khẩu mới cho tài khoản của bạn bên dưới.</Notice> : null}
      <Card className="flex items-center gap-2">
        <span className="text-sm text-muted">Phòng</span>
        <span className="flex-1 font-semibold">{room ? `${room.code} · ${room.name}` : "Chưa xếp phòng"}</span>
        {me.isAdmin ? <Badge tone="solid">Admin</Badge> : null}
      </Card>
      <Card>
        <SectionLabel>Đổi mật khẩu</SectionLabel>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </Card>
      <form action={signOut}>
        <button type="submit" className={`${buttonClass.outline} w-full`}>
          Đăng xuất
        </button>
      </form>
    </>
  );
}
