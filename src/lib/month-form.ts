import "server-only";
import {
  getPeriodBundle,
  getRooms,
  listPeriods,
  type PeriodBundle,
  type Room,
} from "./data";
import { normalizeMonth } from "./month-view";
import { createClient } from "./supabase/server";
import { todayVN } from "./format";
import type { ExpenseKind } from "./billing";

export type MonthFormState = {
  month: string; // YYYY-MM-01
  status: "new" | "draft" | "closed";
  mainKwh: number | null;
  electricityAmount: number | null;
  rooms: {
    roomId: string;
    code: string;
    name: string;
    color: string;
    rent: number;
    people: number;
    readings: { meterId: string; label: string; oldValue: number | null; newValue: number | null }[];
  }[];
  expenses: { kind: ExpenseKind; name: string; amount: number | null }[];
  prevMonth: string | null;
};

function addMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

const FIXED_EXPENSES: { kind: ExpenseKind; name: string }[] = [
  { kind: "wifi", name: "Wifi" },
  { kind: "water", name: "Nước" },
  { kind: "trash", name: "Rác" },
];

/** Everything the "enter a month" form needs: saved values, or sensible defaults for a new month. */
export async function loadMonthForm(requested?: string | string[]): Promise<{
  state: MonthFormState;
  months: { month: string; status: string }[];
}> {
  const periods = await listPeriods(); // newest first, includes drafts for admins
  const wanted = normalizeMonth(requested);
  const draft = periods.find((p) => p.status === "draft");
  const latest = periods[0];
  const month =
    wanted ??
    draft?.month ??
    (latest ? addMonth(latest.month, 1) : `${todayVN().slice(0, 7)}-01`);

  const rooms = await getRooms();
  const existing = await getPeriodBundle(month);
  const prevPeriod = periods.find((p) => p.month < month);
  const prev = prevPeriod ? await getPeriodBundle(prevPeriod.month) : null;

  const activeCounts = await currentPeople();
  const state = buildState(month, rooms, existing, prev, activeCounts);
  return { state, months: periods.map((p) => ({ month: p.month, status: p.status })) };
}

async function currentPeople(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const today = todayVN();
  const { data } = await supabase
    .from("room_memberships")
    .select("room_id, end_date, profiles!inner(active)")
    .lte("start_date", today);
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.end_date && row.end_date < today) continue;
    counts.set(row.room_id, (counts.get(row.room_id) ?? 0) + 1);
  }
  return counts;
}

function buildState(
  month: string,
  rooms: Room[],
  existing: PeriodBundle | null,
  prev: PeriodBundle | null,
  counts: Map<string, number>,
): MonthFormState {
  const readingOf = (b: PeriodBundle | null, meterId: string) =>
    b?.readings.find((r) => r.meter_id === meterId);

  const roomStates = rooms
    .map((room) => {
      const saved = existing?.rooms.find((r) => r.room_id === room.id);
      const before = prev?.rooms.find((r) => r.room_id === room.id);
      return {
        roomId: room.id,
        code: room.code,
        name: saved?.room_name?.trim() || room.name,
        color: room.color,
        rent: saved?.rent ?? room.default_rent,
        people: saved?.people ?? counts.get(room.id) ?? before?.people ?? 1,
        readings: room.meters
          .filter((m) => m.active)
          .map((m) => {
            const cur = readingOf(existing, m.id);
            const last = readingOf(prev, m.id);
            return {
              meterId: m.id,
              label: m.label,
              oldValue: cur ? cur.old_value : (last?.new_value ?? null),
              newValue: cur ? cur.new_value : null,
            };
          }),
      };
    });

  const savedExpenses = existing?.expenses ?? [];
  const source = existing ? savedExpenses : (prev?.expenses ?? []);
  const expenses = FIXED_EXPENSES.map((f) => {
    const found = source.find((e) => e.kind === f.kind);
    return { kind: f.kind, name: f.name, amount: found?.amount ?? null };
  });
  for (const e of savedExpenses.filter((x) => x.kind === "other")) {
    expenses.push({ kind: "other", name: e.name, amount: e.amount });
  }

  return {
    month,
    status: existing ? existing.period.status : "new",
    mainKwh: existing ? existing.period.main_kwh : null,
    electricityAmount: existing ? existing.period.electricity_amount : null,
    rooms: roomStates,
    expenses,
    prevMonth: prev?.period.month ?? null,
  };
}
