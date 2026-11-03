import "server-only";
import { calculateBills, type BillSummary, type RoomBill } from "./billing";
import {
  getPeriodBundle,
  getRooms,
  listPeriods,
  toBillInput,
  type PeriodBundle,
  type PeriodRoom,
  type Room,
} from "./data";
import { vnd } from "./format";
import type { LINE_COLORS } from "./palette";

export type MonthView = {
  months: string[]; // every visible month (drafts included), newest first
  month: string;
  draft: boolean; // not closed yet: figures are provisional
  prev: string | null;
  next: string | null;
  bundle: PeriodBundle;
  rooms: Room[]; // only rooms taking part this month, display order
  summary: BillSummary;
  billByRoom: Map<string, RoomBill>;
  periodRoomById: Map<string, PeriodRoom>;
};

export function normalizeMonth(input: string | string[] | undefined): string | null {
  const v = Array.isArray(input) ? input[0] : input;
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})(?:-01)?$/.exec(v);
  return m ? `${m[1]}-${m[2]}-01` : null;
}

/** The month to show (requested or newest closed month) with every number computed. */
export async function loadMonthView(requested?: string | string[]): Promise<MonthView | null> {
  const [periods, allRooms] = await Promise.all([listPeriods(), getRooms()]);
  const months = periods.map((p) => p.month);
  if (months.length === 0) return null;
  const wanted = normalizeMonth(requested);
  // Default: the oldest month that is still a draft (so a new month only shows
  // once the previous one is closed), otherwise the newest closed month.
  const oldestDraft = periods.filter((p) => p.status === "draft").at(-1)?.month;
  const month = wanted && months.includes(wanted) ? wanted : (oldestDraft ?? months[0]);

  const bundle = await getPeriodBundle(month);
  if (!bundle) return null;

  const inMonth = new Set(bundle.rooms.map((r) => r.room_id));
  // Show each room under the name it had that month (names follow tenants, numbers don't).
  const nameOf = new Map(bundle.rooms.map((r) => [r.room_id, r.room_name]));
  const rooms = allRooms
    .filter((r) => inMonth.has(r.id))
    .map((r) => ({ ...r, name: nameOf.get(r.id)?.trim() || r.name }));
  const summary = calculateBills(toBillInput(bundle, rooms));
  const i = months.indexOf(month);
  return {
    months,
    month,
    draft: bundle.period.status === "draft",
    prev: months[i + 1] ?? null,
    next: months[i - 1] ?? null,
    bundle,
    rooms,
    summary,
    billByRoom: new Map(summary.rooms.map((b) => [b.roomId, b])),
    periodRoomById: new Map(bundle.rooms.map((r) => [r.room_id, r])),
  };
}

export type BillLine = {
  key: string;
  dot: keyof typeof LINE_COLORS;
  label: string;
  value: string;
  note?: string;
};

/** One row per charge, as the house wants it: rent, electricity, wifi, water, trash… */
export function billLines(bill: RoomBill, periodRoom: PeriodRoom): BillLine[] {
  const lines: BillLine[] = [
    { key: "rent", dot: "rent", label: "Tiền phòng", value: vnd(bill.rent) },
    {
      key: "electricity",
      dot: "electricity",
      label: `Điện · ${trimNumber(bill.kwh)} kWh`,
      value: vnd(bill.electricity),
    },
  ];
  bill.expenses.forEach((e, i) => {
    lines.push({
      key: `expense-${i}`,
      dot: e.kind,
      label: `${e.name} · ${bill.people} người`,
      value: vnd(e.amount),
    });
  });
  if (bill.adjustment !== 0) {
    lines.push({
      key: "adjustment",
      dot: "adjustment",
      label: "Đã ứng trước (số liệu cũ)",
      value: vnd(bill.adjustment),
      note: periodRoom.adjustment_note ?? undefined,
    });
  }
  return lines;
}

function trimNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
