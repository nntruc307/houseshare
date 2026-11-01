import { Badge, RoomChip } from "@/components/ui";
import { dayMonth, todayVN } from "@/lib/format";
import { pendingSlots, type Slot } from "@/lib/cleaning";
import type { Room } from "@/lib/data";

/** Upcoming Saturdays. The earliest pending one is highlighted; overdue if its date has passed. */
export function CleaningPlan({
  slots,
  rooms,
  myRoomId,
  limit = 5,
}: {
  slots: Slot[];
  rooms: Room[];
  myRoomId: string | null;
  limit?: number;
}) {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const today = todayVN();
  const pending = pendingSlots(slots).slice(0, limit);
  return (
    <ul className="flex flex-col gap-2">
      {pending.map((slot, i) => {
        const room = byId.get(slot.roomId);
        if (!room) return null;
        const current = i === 0;
        const overdue = current && slot.date < today;
        const mine = slot.roomId === myRoomId;
        return (
          <li
            key={slot.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              current ? "bg-hl ring-2 ring-hl-line" : "bg-bg"
            }`}
          >
            <span className="w-14 text-sm font-bold tabular-nums">{dayMonth(slot.date)}</span>
            <RoomChip code={room.code} color={room.color} size="sm" />
            <span className="flex-1 text-sm font-medium">
              {room.name}
              {mine ? <span className="text-muted"> · phòng bạn</span> : null}
            </span>
            {overdue ? <Badge tone="warn">Quá hạn</Badge> : current ? <Badge tone="hl">Đến lượt</Badge> : null}
            {slot.rescheduled && !current ? <span className="text-xs text-muted">đã dời</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
