import { MonthChips } from "@/components/month-chips";
import { setPaid } from "@/app/actions/bills";
import { BillLines, PaidBadge } from "@/components/bill-card";
import { PaymentPanel } from "@/components/payment-panel";
import { SubmitButton } from "@/components/submit-button";
import { Card, Notice, PageTitle, RoomChip, SectionLabel, buttonClass } from "@/components/ui";
import { getMe, getSettings } from "@/lib/data";
import { monthLabel, vnd } from "@/lib/format";
import { loadMonthView } from "@/lib/month-view";
import { EXPENSE_LABELS } from "@/lib/palette";

export default async function BillsPage({ searchParams }: PageProps<"/bills">) {
  const { month: requested } = await searchParams;
  const [me, view, settings] = await Promise.all([getMe(), loadMonthView(requested), getSettings()]);
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

      <MonthChips months={view.months} selected={view.month} href="/bills" />

      {view.draft ? (
        <Notice tone="brand">Tháng này chưa chốt nên số tiền chỉ là tạm tính và chưa thu tiền.</Notice>
      ) : null}

      {!view.draft && me.isAdmin ? (
        <div className="grid grid-cols-2 gap-3">
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
      ) : null}

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
                  {view.draft || me.isAdmin || mine ? (
                    <PaidBadge paid={pr.paid} draft={view.draft} reported={Boolean(pr.payment_reported_at)} />
                  ) : null}
                </span>
              </summary>
              <div className="border-t border-line px-4 pt-1 pb-4">
                <BillLines bill={bill} periodRoom={pr} compact={mine && !view.draft && !pr.paid} />
                {mine && !view.draft && !pr.paid ? (
                  <PaymentPanel
                    roomCode={room.code}
                    month={view.month}
                    periodId={bundle.period.id}
                    reported={Boolean(pr.payment_reported_at)}
                    settings={settings}
                  />
                ) : null}
                {me.isAdmin && !view.draft && (!mine || pr.paid || pr.payment_reported_at) ? (
                  <form action={setPaid} className="mt-3">
                    <input type="hidden" name="periodId" value={bundle.period.id} />
                    <input type="hidden" name="roomId" value={room.id} />
                    <input type="hidden" name="paid" value={pr.paid ? "false" : "true"} />
                    <SubmitButton className={`${pr.paid ? buttonClass.outline : buttonClass.ok} w-full`}>
                      {pr.paid
                        ? "Bỏ đánh dấu đã thanh toán"
                        : pr.payment_reported_at
                          ? "Xác nhận đã nhận tiền"
                          : "Đánh dấu đã thanh toán"}
                    </SubmitButton>
                  </form>
                ) : null}
                {me.isAdmin && !view.draft && !pr.paid && pr.payment_reported_at ? (
                  <form action={setPaid} className="mt-2">
                    <input type="hidden" name="periodId" value={bundle.period.id} />
                    <input type="hidden" name="roomId" value={room.id} />
                    <input type="hidden" name="paid" value="false" />
                    <SubmitButton className={`${buttonClass.outline} w-full`}>Chưa nhận được tiền</SubmitButton>
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
