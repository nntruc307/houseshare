import { Badge, RoomChip } from "@/components/ui";
import { dayMonth, todayVN } from "@/lib/format";
import { daysBetween, pendingSlots, type Slot } from "@/lib/cleaning";
import type { Room } from "@/lib/data";

/** "Hôm nay", "Ngày mai", "còn 4 ngày", "Tuần sau", "còn 3 tuần". */
function untilLabel(days: number): string {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Ngày mai";
  if (days < 7) return `còn ${days} ngày`;
  if (days < 14) return "Tuần sau";
  return `còn ${Math.round(days / 7)} tuần`;
}

/**
 * Upcoming Saturdays. The first pending one is a large card (overdue turns are
 * orange with how many days late); the rest are compact rows with a countdown.
 */
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
  const [first, ...rest] = pending;
  const firstRoom = first ? byId.get(first.roomId) : undefined;

  return (
    <div className="flex flex-col gap-2">
      {first && firstRoom ? (
        <CurrentCard
          date={first.date}
          room={firstRoom}
          late={Math.max(0, daysBetween(first.date, today))}
          until={daysBetween(today, first.date)}
          mine={first.roomId === myRoomId}
        />
      ) : null}
      {rest.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {rest.map((slot) => {
            const room = byId.get(slot.roomId);
            if (!room) return null;
            const mine = slot.roomId === myRoomId;
            return (
              <li
                key={slot.id}
                className={`flex items-center gap-3 rounded-xl bg-bg px-3 py-2.5 ${mine ? "ring-2 ring-brand/40" : ""}`}
              >
                <span className="w-24 text-sm tabular-nums">
                  <span className="font-bold">{dayMonth(slot.date)}</span>
                  <span className="block text-xs text-muted">{untilLabel(daysBetween(today, slot.date))}</span>
                </span>
                <RoomChip code={room.code} color={room.color} size="sm" />
                <span className="flex-1 text-sm font-medium">{room.name}</span>
                {mine ? <Badge tone="brand">Phòng bạn</Badge> : null}
                {slot.rescheduled ? (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-hl-line" />
                    đã dời
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CurrentCard({
  date,
  room,
  late,
  until,
  mine,
}: {
  date: string;
  room: Room;
  late: number;
  until: number;
  mine: boolean;
}) {
  const overdue = late > 0;
  return (
    <div
      className={`rounded-2xl p-4 ring-2 ring-hl-line ${overdue ? "bg-warn-soft" : "bg-hl"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wide text-ink/70 uppercase">
          {mine ? "Đến lượt phòng bạn" : "Lượt này"}
        </span>
        {overdue ? (
          <Badge tone="warn">Quá hạn · trễ {late} ngày</Badge>
        ) : (
          <Badge tone="hl">{untilLabel(until)}</Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <RoomChip code={room.code} color={room.color} />
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-tight font-bold">{room.name}</p>
          <p className="text-sm text-ink/70 tabular-nums">Thứ 7, {dayMonth(date)}</p>
        </div>
      </div>
    </div>
  );
}
