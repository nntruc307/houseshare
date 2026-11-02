import Link from "next/link";
import { cancelPaymentReport } from "@/app/actions/bills";
import { BillLines, PaidBadge } from "@/components/bill-card";
import { CleaningPlan } from "@/components/cleaning-plan";
import { CopyButton } from "@/components/copy-button";
import { PaymentConfirm } from "@/components/payment-confirm";
import { SaveQrButton } from "@/components/save-qr-button";
import { SubmitButton } from "@/components/submit-button";
import { Card, Notice, PageTitle, RoomChip, SectionLabel, buttonClass } from "@/components/ui";
import { getCleaningSlots, getMe, getRooms, getSettings } from "@/lib/data";
import { monthLabel, vnd } from "@/lib/format";
import { loadMonthView } from "@/lib/month-view";
import { transferMemo, vietQrUrl } from "@/lib/vietqr";

export default async function HomePage() {
  const me = await getMe();
  const [rooms, settings, view] = await Promise.all([getRooms(), getSettings(), loadMonthView()]);
  const slots = await getCleaningSlots(rooms);
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
          {!view.draft && !periodRoom.paid && settings && settings.bank_code && settings.bank_account ? (
            <div className="mt-2 flex flex-col items-center gap-1.5 border-t border-line pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vietQrUrl({
                  bankCode: settings.bank_code,
                  account: settings.bank_account,
                  accountName: settings.bank_account_name,
                  memo: transferMemo(myRoom.code, view.month),
                })}
                alt={`Mã QR chuyển khoản, nội dung ${transferMemo(myRoom.code, view.month)}, tự nhập số tiền`}
                width={240}
                height={240}
                className="h-auto w-60 rounded-xl border border-line"
              />
              <SaveQrButton
                src={`/qr-image?month=${view.month.slice(0, 7)}`}
                fileName={`QR-${myRoom.code}-T${Number(view.month.slice(5, 7))}-${view.month.slice(0, 4)}.png`}
              />
              <dl className="w-full space-y-0.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Ngân hàng</dt>
                  <dd className="text-right font-medium">{settings.bank_code}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Chủ tài khoản</dt>
                  <dd className="text-right font-medium">{settings.bank_account_name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Số tài khoản</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{settings.bank_account}</span>
                    <CopyButton value={settings.bank_account} label="Sao chép số tài khoản" />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Nội dung</dt>
                  <dd className="text-right font-medium">{transferMemo(myRoom.code, view.month)}</dd>
                </div>
              </dl>
            </div>
          ) : null}
          {!view.draft && !periodRoom.paid && periodRoom.payment_reported_at ? (
            <form action={cancelPaymentReport} className="mt-2 flex flex-col gap-2">
              <input type="hidden" name="periodId" value={view.bundle.period.id} />
              <p className="rounded-xl bg-hl px-3 py-2 text-sm font-medium">
                Bạn đã báo thanh toán, đang chờ Trực hoặc Vi xác nhận.
              </p>
              <SubmitButton className={`${buttonClass.outline} w-full`}>Hủy báo thanh toán</SubmitButton>
            </form>
          ) : null}
          {!view.draft && !periodRoom.paid && !periodRoom.payment_reported_at ? (
            <div className="mt-3">
              <PaymentConfirm periodId={view.bundle.period.id} />
            </div>
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
