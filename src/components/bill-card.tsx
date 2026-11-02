import { Badge, Card, Dot, RoomChip } from "@/components/ui";
import { vnd } from "@/lib/format";
import { billLines } from "@/lib/month-view";
import type { RoomBill } from "@/lib/billing";
import type { PeriodRoom, Room } from "@/lib/data";

/** The itemised bill of one room: rent, electricity, wifi, water, trash… */
export function BillLines({
  bill,
  periodRoom,
  compact = false,
}: {
  bill: RoomBill;
  periodRoom: PeriodRoom;
  compact?: boolean;
}) {
  const lines = billLines(bill, periodRoom);
  return (
    <ul className="flex flex-col divide-y divide-line">
      {lines.map((line) => (
        <li key={line.key} className={`flex items-center gap-2.5 ${compact ? "py-1 text-sm" : "py-2.5 text-[15px]"}`}>
          <Dot kind={line.dot} />
          <span className="flex-1">
            {line.label}
            {line.note ? <span className="block text-xs text-muted">{line.note}</span> : null}
          </span>
          <span className="font-semibold tabular-nums">{line.value}</span>
        </li>
      ))}
      <li className={`flex items-center justify-between font-bold ${compact ? "pt-1.5 text-sm" : "pt-3 text-base"}`}>
        <span>Tổng cộng</span>
        <span className={`tabular-nums ${compact ? "text-base" : "text-lg"}`}>{vnd(bill.total)} đ</span>
      </li>
    </ul>
  );
}

export function PaidBadge({
  paid,
  draft = false,
  reported = false,
}: {
  paid: boolean;
  draft?: boolean;
  reported?: boolean;
}) {
  if (draft) return <Badge tone="hl">Bản nháp</Badge>;
  if (!paid && reported) return <Badge tone="brand">Chờ xác nhận</Badge>;
  return paid ? <Badge tone="ok">Đã thanh toán</Badge> : <Badge tone="warn">Chưa thanh toán</Badge>;
}

export function RoomBillCard({
  room,
  bill,
  periodRoom,
  title,
}: {
  room: Room;
  bill: RoomBill;
  periodRoom: PeriodRoom;
  title?: string;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-3">
        <RoomChip code={room.code} color={room.color} />
        <div className="flex-1">
          <p className="font-bold">{title ?? room.name}</p>
          <p className="text-xs text-muted">{bill.people} người</p>
        </div>
        <PaidBadge paid={periodRoom.paid} reported={Boolean(periodRoom.payment_reported_at)} />
      </div>
      <BillLines bill={bill} periodRoom={periodRoom} />
    </Card>
  );
}
