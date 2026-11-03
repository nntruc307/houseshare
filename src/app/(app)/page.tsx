import Link from "next/link";
import { BillLines, PaidBadge } from "@/components/bill-card";
import { CleaningPlan } from "@/components/cleaning-plan";
import { PaymentPanel } from "@/components/payment-panel";
import { Card, Notice, PageTitle, RoomChip, SectionLabel, buttonClass } from "@/components/ui";
import { getCleaningSlots, getMe, getRooms, getSettings } from "@/lib/data";
import { monthLabel, vnd } from "@/lib/format";
import { loadMonthView } from "@/lib/month-view";

export default async function HomePage() {
  const [me, rooms, settings, view, slots] = await Promise.all([
    getMe(),
    getRooms(),
    getSettings(),
    loadMonthView(),
    getRooms().then(getCleaningSlots),
  ]);
  const myRoom = rooms.find((r) => r.id === me.roomId) ?? null;

  const bill = myRoom && view ? view.billByRoom.get(myRoom.id) : undefined;
  const periodRoom = myRoom && view ? view.periodRoomById.get(myRoom.id) : undefined;

  return (
    <>
      <PageTitle title={`Chào ${me.name}`} subtitle={settings?.house_name ?? "Nhà chung"} />

      {!myRoom ? (
        <Notice tone="brand">
          Bạn chưa được xếp vào phòng nào. Nhờ Trực hoặc Vi thêm bạn vào phòng nhé.
        </Notice>
      ) : null}

      {view && myRoom && bill && periodRoom ? (
        <Card>
          <div className="mb-1 flex items-center gap-3">
            <RoomChip code={myRoom.code} color={myRoom.color} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{monthLabel(view.month)}</p>
              <p className="text-xl font-bold whitespace-nowrap tabular-nums">{vnd(bill.total)} đ</p>
            </div>
            <PaidBadge paid={periodRoom.paid} draft={view.draft} reported={Boolean(periodRoom.payment_reported_at)} />
          </div>
          <BillLines bill={bill} periodRoom={periodRoom} compact />
          {view.draft ? (
            <p className="mt-3 rounded-xl bg-hl px-3 py-2 text-sm font-medium">
              Tháng này chưa chốt, số tiền có thể còn thay đổi. Mã QR thanh toán sẽ hiện sau khi chốt.
            </p>
          ) : null}
          {!view.draft && !periodRoom.paid ? (
            <PaymentPanel
              roomCode={myRoom.code}
              month={view.month}
              periodId={view.bundle.period.id}
              reported={Boolean(periodRoom.payment_reported_at)}
              settings={settings}
            />
          ) : null}
        </Card>
      ) : !view ? (
        <Card>
          <p className="text-sm text-muted">Chưa có hóa đơn nào được chốt.</p>
        </Card>
      ) : null}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Lịch dọn vệ sinh</SectionLabel>
          <Link href="/cleaning" className="text-sm font-semibold text-brand">
            Xem tất cả
          </Link>
        </div>
        {slots.length > 0 ? (
          <CleaningPlan slots={slots} rooms={rooms} myRoomId={me.roomId} limit={3} />
        ) : (
          <p className="text-sm text-muted">Chưa có lịch dọn.</p>
        )}
      </Card>

      {view ? (
        <Link href="/bills" className={`${buttonClass.soft} w-full`}>
          Xem hóa đơn cả nhà
        </Link>
      ) : null}
    </>
  );
}
