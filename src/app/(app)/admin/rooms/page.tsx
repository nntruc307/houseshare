import { moveMember, removeMember, updateRent } from "@/app/actions/rooms";
import { AddMemberForm } from "@/components/add-member-form";
import { MoneyField } from "@/components/money-input";
import { ResetPasswordButton } from "@/components/reset-password-button";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, PageTitle, RoomChip, SectionLabel, buttonClass, inputClass } from "@/components/ui";
import { getRooms } from "@/lib/data";
import { todayVN } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRoomsPage() {
  const rooms = await getRooms();
  const supabase = await createClient();
  const today = todayVN();
  const { data: memberships } = await supabase
    .from("room_memberships")
    .select("profile_id, room_id, end_date, profiles!inner(id, full_name, email, role, active)")
    .lte("start_date", today);
  const current = (memberships ?? []).filter((m) => !m.end_date || m.end_date >= today);
  const lite = rooms.map((r) => ({ id: r.id, code: r.code, name: r.name }));

  return (
    <>
      <PageTitle title="Phòng & thành viên" subtitle="Giá phòng mặc định, người ở" />

      {rooms.map((room) => {
        const members = current.filter((m) => m.room_id === room.id);
        return (
          <Card key={room.id}>
            <div className="mb-3 flex items-center gap-3">
              <RoomChip code={room.code} color={room.color} />
              <p className="flex-1 font-bold">{room.name}</p>
              <span className="text-xs text-muted">{members.length} người</span>
            </div>

            <form action={updateRent} className="mb-3 flex items-end gap-2">
              <input type="hidden" name="roomId" value={room.id} />
              <label className="flex flex-1 flex-col gap-1 text-[13px] text-ink/80">
                Giá phòng mặc định
                <MoneyField name="rent" defaultValue={room.default_rent} className={`${inputClass} tabular-nums`} />
              </label>
              <SubmitButton className={buttonClass.soft}>Lưu</SubmitButton>
            </form>

            <ul className="flex flex-col divide-y divide-line">
              {members.map((m) => {
                const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                if (!p) return null;
                return (
                  <li key={m.profile_id} className="flex flex-col gap-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex-1">
                        <span className="block font-semibold">{p.full_name}</span>
                        <span className="block text-xs text-muted">{p.email}</span>
                      </span>
                      {p.role === "admin" ? <Badge tone="solid">Admin</Badge> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={moveMember} className="flex items-center gap-2">
                        <input type="hidden" name="profileId" value={p.id} />
                        <select name="roomId" defaultValue={room.id} className={`${inputClass} h-9 w-auto`} aria-label="Chuyển sang phòng">
                          {lite.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.code}
                            </option>
                          ))}
                        </select>
                        <SubmitButton className={`${buttonClass.outline} min-h-9 px-3 text-xs`} pendingLabel="…">
                          Chuyển phòng
                        </SubmitButton>
                      </form>
                      <ResetPasswordButton profileId={p.id} />
                      {p.role !== "admin" ? (
                        <form action={removeMember}>
                          <input type="hidden" name="profileId" value={p.id} />
                          <SubmitButton className={`${buttonClass.danger} min-h-9 px-3 text-xs`} pendingLabel="…">
                            Dọn đi
                          </SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
              {members.length === 0 ? <li className="py-2 text-sm text-muted">Chưa có ai.</li> : null}
            </ul>
          </Card>
        );
      })}

      <Card>
        <SectionLabel>Thêm thành viên</SectionLabel>
        <div className="mt-3">
          <AddMemberForm rooms={lite} />
        </div>
      </Card>
    </>
  );
}
