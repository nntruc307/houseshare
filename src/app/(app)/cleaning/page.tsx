import { undoCleaning } from "@/app/actions/cleaning";
import { CleaningPlan } from "@/components/cleaning-plan";
import { RecordCleaningForm } from "@/components/record-cleaning-form";
import { SubmitButton } from "@/components/submit-button";
import { SwapForm } from "@/components/swap-form";
import { Badge, Card, Notice, PageTitle, RoomChip, SectionLabel, buttonClass } from "@/components/ui";
import { getCleaningLogs, getCleaningSlots, getMe, getProfilesById, getRooms } from "@/lib/data";
import { fullDate, todayVN } from "@/lib/format";
import { pendingSlots } from "@/lib/cleaning";

export default async function CleaningPage() {
  const logsQuery = getCleaningLogs(12);
  const [me, rooms, slots, logs, names] = await Promise.all([
    getMe(),
    getRooms(),
    getRooms().then(getCleaningSlots),
    logsQuery,
    logsQuery.then((list) =>
      getProfilesById([...new Set(list.map((l) => l.recorded_by).filter((v): v is string => !!v))]),
    ),
  ]);
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const canRecord = me.isAdmin || !!me.roomId;
  const pending = pendingSlots(slots);
  const lite = rooms.map((r) => ({ id: r.id, code: r.code, name: r.name }));

  return (
    <>
      <PageTitle title="Dọn vệ sinh" subtitle="Mỗi thứ Bảy một phòng" />

      <Card>
        <SectionLabel>Kế hoạch sắp tới</SectionLabel>
        <div className="mt-3">
          {pending.length > 0 ? (
            <CleaningPlan slots={slots} rooms={rooms} myRoomId={me.roomId} limit={5} />
          ) : (
            <p className="text-sm text-muted">Chưa có lịch dọn.</p>
          )}
        </div>
      </Card>

      {canRecord && pending.length > 0 ? (
        <Card>
          <SectionLabel>{me.isAdmin ? "Ghi nhận đã dọn (admin)" : "Phòng bạn vừa dọn?"}</SectionLabel>
          <div className="mt-3">
            <RecordCleaningForm
              slots={slots}
              rooms={lite}
              fixedRoomId={me.isAdmin ? null : me.roomId}
              today={todayVN()}
            />
          </div>
        </Card>
      ) : !canRecord ? (
        <Notice tone="brand">Bạn chưa thuộc phòng nào nên chưa ghi nhận được.</Notice>
      ) : null}

      {me.isAdmin && pending.length >= 2 ? (
        <Card>
          <SectionLabel>Đổi chỗ hai lượt</SectionLabel>
          <div className="mt-3">
            <SwapForm
              options={pending.slice(0, 5).map((s) => ({
                id: s.id,
                label: `${s.date.slice(8)}/${s.date.slice(5, 7)} · ${byId.get(s.roomId)?.code ?? "?"}`,
              }))}
            />
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionLabel>Lịch sử gần đây</SectionLabel>
        <ul className="mt-2 flex flex-col divide-y divide-line">
          {logs.map((log) => {
            const room = byId.get(log.room_id);
            const covered = log.substitute_for ? byId.get(log.substitute_for) : null;
            return (
              <li key={log.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-24 font-semibold tabular-nums">{fullDate(log.cleaned_on)}</span>
                {room ? <RoomChip code={room.code} color={room.color} size="sm" /> : null}
                <span className="flex-1 text-muted">
                  {covered ? `dọn thay ${covered.code}` : ""}
                  {log.recorded_by && log.source !== "excel" ? ` · ${names.get(log.recorded_by) ?? ""}` : ""}
                  {log.source === "excel" ? <Badge tone="brand">từ Excel</Badge> : null}
                </span>
                {me.isAdmin && log.source !== "excel" ? (
                  <form action={undoCleaning}>
                    <input type="hidden" name="logId" value={log.id} />
                    <SubmitButton className={`${buttonClass.danger} min-h-9 px-3 text-xs`} pendingLabel="…">
                      Hoàn tác
                    </SubmitButton>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
