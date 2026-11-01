// Pure cleaning-rota logic: every Saturday one room cleans, rooms rotate in a
// fixed order, and the plan changes as little as possible when someone misses
// a turn or covers for another room.

export type SlotStatus = "pending" | "done";

export type Slot = {
  id: string;
  date: string; // YYYY-MM-DD (a Saturday)
  roomId: string;
  status: SlotStatus;
  rescheduled: boolean;
};

export type SlotChange = { slotId: string; date: string; fromRoomId: string; toRoomId: string };

export type RecordPlan =
  | { kind: "own"; slotId: string; changes: [] }
  | { kind: "substitute"; slotId: string; substituteFor: string; changes: SlotChange[] };

const DAY = 24 * 60 * 60 * 1000;

export function parseDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: string, days: number): string {
  return formatDate(new Date(parseDate(d).getTime() + days * DAY));
}

/** The first Saturday strictly after `d`. */
export function nextSaturdayAfter(d: string): string {
  const date = parseDate(d);
  const dow = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const delta = ((6 - dow + 7) % 7) || 7;
  return addDays(d, delta);
}

export function sortSlots(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** The earliest slot that has not been cleaned yet: the room whose turn it is. */
export function currentSlot(slots: Slot[]): Slot | undefined {
  return sortSlots(slots).find((s) => s.status === "pending");
}

export function pendingSlots(slots: Slot[]): Slot[] {
  return sortSlots(slots).filter((s) => s.status === "pending");
}

/**
 * Decide what a cleaning record by `roomId` on `cleanedOn` means.
 *
 * - The room whose turn it is cleans: its slot is done, nothing moves.
 * - A room cleans during its own week, even while an earlier room is still
 *   overdue: its own slot is done, nothing moves (the overdue room stays
 *   highlighted).
 * - Otherwise the room is covering for the room whose turn it is (A):
 *     the cleaner (B) takes A's slot, A moves to the next Saturday, and the
 *     room that held next Saturday takes B's old slot. If B itself held next
 *     Saturday, A and B simply swap. At most 3 rooms change dates.
 */
export function planRecord(slots: Slot[], roomId: string, cleanedOn: string): RecordPlan {
  const pending = pendingSlots(slots);
  const current = pending[0];
  if (!current) throw new Error("Chưa có lịch dọn để ghi nhận");

  if (current.roomId === roomId) {
    return { kind: "own", slotId: current.id, changes: [] };
  }

  const own = pending.find((s) => s.roomId === roomId);
  if (own && cleanedOn >= addDays(own.date, -6)) {
    return { kind: "own", slotId: own.id, changes: [] };
  }
  if (!own) throw new Error("Phòng này chưa có trong lịch dọn");

  const next = pending[1];
  if (!next) throw new Error("Chưa đủ lịch để đổi");

  const changes: SlotChange[] = [
    { slotId: current.id, date: current.date, fromRoomId: current.roomId, toRoomId: roomId },
  ];
  if (next.id === own.id) {
    changes.push({ slotId: next.id, date: next.date, fromRoomId: roomId, toRoomId: current.roomId });
  } else {
    changes.push({ slotId: next.id, date: next.date, fromRoomId: next.roomId, toRoomId: current.roomId });
    changes.push({ slotId: own.id, date: own.date, fromRoomId: roomId, toRoomId: next.roomId });
  }
  return { kind: "substitute", slotId: current.id, substituteFor: current.roomId, changes };
}

/** Apply a plan to a list of slots (returns new slots; used for previews and tests). */
export function applyPlan(slots: Slot[], plan: RecordPlan): Slot[] {
  const byId = new Map(slots.map((s) => [s.id, { ...s }]));
  for (const c of plan.changes) {
    const s = byId.get(c.slotId)!;
    s.roomId = c.toRoomId;
    if (c.slotId !== plan.slotId) s.rescheduled = true;
  }
  const done = byId.get(plan.slotId)!;
  done.status = "done";
  return sortSlots([...byId.values()]);
}

/**
 * New slots needed so that at least `minPending` future turns are planned.
 * Each new Saturday repeats the room that cleaned `roomCount` slots earlier,
 * so the rotation order carries on unchanged.
 */
export function slotsToAdd(
  slots: Slot[],
  roomCount: number,
  minPending: number,
): Omit<Slot, "id">[] {
  const all = sortSlots(slots).map((s) => ({ date: s.date, roomId: s.roomId }));
  if (all.length < roomCount) return [];
  let pending = slots.filter((s) => s.status === "pending").length;
  const added: Omit<Slot, "id">[] = [];
  while (pending < minPending) {
    const last = all[all.length - 1];
    const slot = {
      date: addDays(last.date, 7),
      roomId: all[all.length - roomCount].roomId,
      status: "pending" as const,
      rescheduled: false,
    };
    all.push({ date: slot.date, roomId: slot.roomId });
    added.push(slot);
    pending++;
  }
  return added;
}

/**
 * First plan when there are no slots yet: rooms that cleaned longest ago go
 * first, one per Saturday starting from `firstSaturday`.
 */
export function seedSlots(
  roomIds: string[],
  lastCleaned: Record<string, string | undefined>,
  firstSaturday: string,
): Omit<Slot, "id">[] {
  const order = [...roomIds].sort((a, b) => {
    const da = lastCleaned[a] ?? "";
    const db = lastCleaned[b] ?? "";
    return da < db ? -1 : da > db ? 1 : 0;
  });
  return order.map((roomId, i) => ({
    date: addDays(firstSaturday, 7 * i),
    roomId,
    status: "pending" as const,
    rescheduled: false,
  }));
}
