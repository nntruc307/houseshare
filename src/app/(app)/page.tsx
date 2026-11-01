import Link from "next/link";
import { BillLines, PaidBadge } from "@/components/bill-card";
import { CleaningPlan } from "@/components/cleaning-plan";
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
            <div className="flex-1">
              <p className="text-xs text-muted">{monthLabel(view.month)}</p>
              <p className="text-2xl font-bold tabular-nums">{vnd(bill.total)} đ</p>
            </div>
            <PaidBadge paid={periodRoom.paid} />
          </div>
          <BillLines bill={bill} periodRoom={periodRoom} />
          {!periodRoom.paid && settings && settings.bank_code && settings.bank_account ? (
            <div className="mt-4 flex flex-col items-center gap-2 border-t border-line pt-4">
              <p className="text-sm font-semibold">Quét mã để chuyển khoản</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vietQrUrl({
                  bankCode: settings.bank_code,
                  account: settings.bank_account,
                  accountName: settings.bank_account_name,
                  amount: bill.total,
                  memo: transferMemo(myRoom.code, view.month),
                })}
                alt={`Mã QR chuyển ${vnd(bill.total)} đồng, nội dung ${transferMemo(myRoom.code, view.month)}`}
                width={240}
                height={240}
                className="h-auto w-60 rounded-xl border border-line"
              />
              <p className="text-center text-xs text-muted">
                {settings.bank_account_name} · {settings.bank_account}
                <br />
                Nội dung: {transferMemo(myRoom.code, view.month)}
              </p>
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
