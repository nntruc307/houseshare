import Link from "next/link";
import { setPaid } from "@/app/actions/bills";
import { BillLines, PaidBadge } from "@/components/bill-card";
import { SubmitButton } from "@/components/submit-button";
import { Card, Notice, PageTitle, RoomChip, SectionLabel, buttonClass } from "@/components/ui";
import { getMe } from "@/lib/data";
import { monthLabel, vnd } from "@/lib/format";
import { loadMonthView } from "@/lib/month-view";
import { EXPENSE_LABELS } from "@/lib/palette";

export default async function BillsPage({ searchParams }: PageProps<"/bills">) {
  const { month: requested } = await searchParams;
  const me = await getMe();
  const view = await loadMonthView(requested);
  if (!view) {
    return (
      <>
        <PageTitle title="Hóa đơn" />
        <Card>
          <p className="text-sm text-muted">Chưa có tháng nào được chốt.</p>
        </Card>
      </>
    );
  }

  const { summary, bundle } = view;
  const paidCount = bundle.rooms.filter((r) => r.paid).length;
  const outstanding = view.rooms.reduce(
    (sum, room) => (view.periodRoomById.get(room.id)?.paid ? sum : sum + (view.billByRoom.get(room.id)?.total ?? 0)),
    0,
  );

  return (
    <>
      <PageTitle title={monthLabel(view.month)} subtitle={view.draft ? "Hóa đơn cả nhà · bản nháp, chưa chốt" : "Hóa đơn cả nhà"} />

      <nav className="flex gap-2" aria-label="Chọn tháng">
        {view.prev ? (
          <Link href={`/bills?month=${view.prev.slice(0, 7)}`} className={`${buttonClass.outline} flex-1`}>
            ← {monthLabel(view.prev)}
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {view.next ? (
          <Link href={`/bills?month=${view.next.slice(0, 7)}`} className={`${buttonClass.outline} flex-1`}>
            {monthLabel(view.next)} →
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>

      {view.draft ? (
        <Notice tone="brand">Tháng này chưa chốt nên số tiền chỉ là tạm tính và chưa thu tiền.</Notice>
      ) : null}

      <div className={view.draft ? "hidden" : "grid grid-cols-2 gap-3"}>
        <Card>
          <p className="text-xs text-muted">Đã thanh toán</p>
          <p className="text-xl font-bold">
            {paidCount}/{bundle.rooms.length} phòng
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Còn phải thu</p>
          <p className="text-xl font-bold tabular-nums">{vnd(outstanding)} đ</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {view.rooms.map((room) => {
          const bill = view.billByRoom.get(room.id)!;
          const pr = view.periodRoomById.get(room.id)!;
          const mine = room.id === me.roomId;
          return (
            <details key={room.id} open={mine} className="group rounded-2xl bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <RoomChip code={room.code} color={room.color} />
                <span className="flex-1">
                  <span className="block font-bold">
                    {room.name}
                    {mine ? <span className="font-normal text-muted"> · phòng bạn</span> : null}
                  </span>
                  <span className="text-xs text-muted">{bill.people} người</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="font-bold tabular-nums">{vnd(bill.total)} đ</span>
                  <PaidBadge paid={pr.paid} draft={view.draft} />
                </span>
              </summary>
              <div className="border-t border-line px-4 pt-1 pb-4">
                <BillLines bill={bill} periodRoom={pr} />
                {me.isAdmin && !view.draft ? (
                  <form action={setPaid} className="mt-3">
                    <input type="hidden" name="periodId" value={bundle.period.id} />
                    <input type="hidden" name="roomId" value={room.id} />
                    <input type="hidden" name="paid" value={pr.paid ? "false" : "true"} />
                    <SubmitButton className={`${pr.paid ? buttonClass.outline : buttonClass.ok} w-full`}>
                      {pr.paid ? "Bỏ đánh dấu đã thanh toán" : "Đánh dấu đã thanh toán"}
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>

      <Card>
        <SectionLabel>Chi phí chung tháng này</SectionLabel>
        <ul className="mt-2 flex flex-col divide-y divide-line text-[15px]">
          <li className="flex justify-between py-2">
            <span>Điện (tổng hóa đơn)</span>
            <span className="font-semibold tabular-nums">{vnd(bundle.period.electricity_amount)} đ</span>
          </li>
          {bundle.expenses.map((e) => (
            <li key={e.id} className="flex justify-between py-2">
              <span>{e.name || EXPENSE_LABELS[e.kind]}</span>
              <span className="font-semibold tabular-nums">{vnd(e.amount)} đ</span>
            </li>
          ))}
          <li className="flex justify-between py-2 text-xs text-muted">
            <span>Điện chung chia đầu người: {vnd(summary.totalPeople > 0 ? summary.commonAmount / summary.totalPeople : 0)} đ/người</span>
            <span>{summary.totalPeople} người</span>
          </li>
        </ul>
      </Card>
    </>
  );
}
