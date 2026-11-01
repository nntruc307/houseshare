import { describe, expect, it } from "vitest";
import {
  applyPlan,
  currentSlot,
  nextSaturdayAfter,
  planRecord,
  seedSlots,
  slotsToAdd,
  type Slot,
} from "./cleaning";

// Rotation after the last Excel entry (301 cleaned on 31/10/2026).
const plan: Slot[] = [
  { id: "s1", date: "2026-11-07", roomId: "201", status: "pending", rescheduled: false },
  { id: "s2", date: "2026-11-14", roomId: "202", status: "pending", rescheduled: false },
  { id: "s3", date: "2026-11-21", roomId: "102", status: "pending", rescheduled: false },
  { id: "s4", date: "2026-11-28", roomId: "101", status: "pending", rescheduled: false },
  { id: "s5", date: "2026-12-05", roomId: "301", status: "pending", rescheduled: false },
];

const rooms = (slots: Slot[]) => slots.map((s) => `${s.date.slice(5)}:${s.roomId}:${s.status[0]}`);

describe("dates", () => {
  it("finds the next Saturday", () => {
    expect(nextSaturdayAfter("2026-10-31")).toBe("2026-11-07"); // from a Saturday
    expect(nextSaturdayAfter("2026-11-01")).toBe("2026-11-07"); // from a Sunday
    expect(nextSaturdayAfter("2026-11-06")).toBe("2026-11-07");
  });
});

describe("planRecord", () => {
  it("marks the room whose turn it is, nothing moves", () => {
    const p = planRecord(plan, "201", "2026-11-07");
    expect(p).toEqual({ kind: "own", slotId: "s1", changes: [] });
    expect(rooms(applyPlan(plan, p))).toEqual([
      "11-07:201:d", "11-14:202:p", "11-21:102:p", "11-28:101:p", "12-05:301:p",
    ]);
  });

  it("a late record still counts for the overdue room", () => {
    const p = planRecord(plan, "201", "2026-11-10");
    expect(p.slotId).toBe("s1");
    expect(p.changes).toHaveLength(0);
  });

  it("covering room: missed room moves to next Saturday, at most 3 rooms change", () => {
    const p = planRecord(plan, "102", "2026-11-07");
    expect(p.kind).toBe("substitute");
    const after = applyPlan(plan, p);
    expect(rooms(after)).toEqual([
      "11-07:102:d", "11-14:201:p", "11-21:202:p", "11-28:101:p", "12-05:301:p",
    ]);
    expect(after.filter((s) => s.rescheduled).map((s) => s.id)).toEqual(["s2", "s3"]);
  });

  it("covering room that was next anyway: the two rooms swap", () => {
    const after = applyPlan(plan, planRecord(plan, "202", "2026-11-07"));
    expect(rooms(after)).toEqual([
      "11-07:202:d", "11-14:201:p", "11-21:102:p", "11-28:101:p", "12-05:301:p",
    ]);
  });

  it("the user's example: 201 covers for 101, 101 cleans the following Saturday", () => {
    const slots: Slot[] = [
      { id: "a", date: "2026-11-07", roomId: "101", status: "pending", rescheduled: false },
      { id: "b", date: "2026-11-14", roomId: "301", status: "pending", rescheduled: false },
      { id: "c", date: "2026-11-21", roomId: "201", status: "pending", rescheduled: false },
      { id: "d", date: "2026-11-28", roomId: "202", status: "pending", rescheduled: false },
      { id: "e", date: "2026-12-05", roomId: "102", status: "pending", rescheduled: false },
    ];
    const after = applyPlan(slots, planRecord(slots, "201", "2026-11-07"));
    expect(rooms(after)).toEqual([
      "11-07:201:d", "11-14:101:p", "11-21:301:p", "11-28:202:p", "12-05:102:p",
    ]);
  });

  it("a room cleaning in its own week does not move an overdue room", () => {
    const p = planRecord(plan, "202", "2026-11-14");
    expect(p).toEqual({ kind: "own", slotId: "s2", changes: [] });
    const after = applyPlan(plan, p);
    expect(currentSlot(after)?.roomId).toBe("201"); // still highlighted
  });
});

describe("slotsToAdd", () => {
  it("continues the rotation order", () => {
    const done = plan.map((s, i) => (i < 2 ? { ...s, status: "done" as const } : s));
    const added = slotsToAdd(done, 5, 5);
    expect(added.map((s) => `${s.date}:${s.roomId}`)).toEqual([
      "2026-12-12:201", "2026-12-19:202",
    ]);
  });
});

describe("seedSlots", () => {
  it("starts with the room that cleaned longest ago", () => {
    const seeded = seedSlots(
      ["101", "102", "201", "202", "301"],
      { "301": "2026-10-31", "101": "2026-10-26", "102": "2026-10-18", "202": "2026-10-10", "201": "2026-10-04" },
      "2026-11-07",
    );
    expect(seeded.map((s) => `${s.date}:${s.roomId}`)).toEqual([
      "2026-11-07:201", "2026-11-14:202", "2026-11-21:102", "2026-11-28:101", "2026-12-05:301",
    ]);
  });
});
