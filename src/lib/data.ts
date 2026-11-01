import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "./supabase/server";
import type { BillInput, ExpenseKind } from "./billing";
import {
  nextSaturdayAfter,
  seedSlots,
  slotsToAdd,
  type Slot,
} from "./cleaning";
import { todayVN } from "./format";

export type Me = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  roomId: string | null;
};

export type Room = {
  id: string;
  code: string;
  name: string;
  color: string;
  default_rent: number;
  default_people: number; // set by hand; not everyone living here has an account
  sort: number;
  meters: { id: string; label: string; sort: number; active: boolean }[];
};

export type Period = {
  id: string;
  month: string;
  main_kwh: number;
  electricity_amount: number;
  status: "draft" | "closed";
  closed_at: string | null;
};

export type PeriodRoom = {
  period_id: string;
  room_id: string;
  rent: number;
  people: number;
  room_name: string | null; // name the room had that month; null -> rooms.name
  adjustment: number;
  adjustment_note: string | null;
  paid: boolean;
  paid_at: string | null;
};

export type Reading = {
  period_id: string;
  meter_id: string;
  old_value: number | null;
  new_value: number | null;
};

export type Expense = {
  id: string;
  period_id: string;
  kind: ExpenseKind;
  name: string;
  amount: number;
  sort: number;
};

export type PeriodBundle = {
  period: Period;
  rooms: PeriodRoom[];
  readings: Reading[];
  expenses: Expense[];
};

export type Settings = {
  house_name: string;
  address: string;
  bank_code: string;
  bank_account: string;
  bank_account_name: string;
};

/** The signed-in, active user. Redirects to /login otherwise. */
export const getMe = cache(async (): Promise<Me> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !profile.active) redirect("/login?error=inactive");

  const today = todayVN();
  const { data: memberships } = await supabase
    .from("room_memberships")
    .select("room_id, start_date, end_date")
    .eq("profile_id", userId)
    .lte("start_date", today)
    .order("start_date", { ascending: false });
  const current = (memberships ?? []).find((m) => !m.end_date || m.end_date >= today);

  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    isAdmin: profile.role === "admin",
    roomId: current?.room_id ?? null,
  };
});

export async function requireAdmin(): Promise<Me> {
  const me = await getMe();
  if (!me.isAdmin) redirect("/");
  return me;
}

export const getRooms = cache(async (): Promise<Room[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, code, name, color, default_rent, default_people, sort, meters(id, label, sort, active)")
    .order("sort");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    meters: [...(r.meters ?? [])].sort((a, b) => a.sort - b.sort),
  })) as Room[];
});

export const getSettings = cache(async (): Promise<Settings | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("house_name, address, bank_code, bank_account, bank_account_name")
    .eq("id", 1)
    .maybeSingle();
  return data;
});

/** Months the current user can see, newest first (RLS hides drafts from members). */
export const listPeriods = cache(async (): Promise<Pick<Period, "id" | "month" | "status">[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("periods")
    .select("id, month, status")
    .order("month", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export async function getPeriodBundle(month: string): Promise<PeriodBundle | null> {
  const supabase = await createClient();
  const { data: period } = await supabase
    .from("periods")
    .select("id, month, main_kwh, electricity_amount, status, closed_at")
    .eq("month", month)
    .maybeSingle();
  if (!period) return null;
  const [rooms, readings, expenses] = await Promise.all([
    supabase.from("period_rooms").select("*").eq("period_id", period.id),
    supabase.from("meter_readings").select("*").eq("period_id", period.id),
    supabase.from("period_expenses").select("*").eq("period_id", period.id).order("sort"),
  ]);
  return {
    period: { ...period, main_kwh: Number(period.main_kwh) } as Period,
    rooms: (rooms.data ?? []) as PeriodRoom[],
    readings: (readings.data ?? []).map((r) => ({
      ...r,
      old_value: r.old_value == null ? null : Number(r.old_value),
      new_value: r.new_value == null ? null : Number(r.new_value),
    })) as Reading[],
    expenses: (expenses.data ?? []) as Expense[],
  };
}

/** Rooms that take part in a month, in display order, with their meter readings. */
export function toBillInput(bundle: PeriodBundle, rooms: Room[]): BillInput {
  const byRoom = new Map(bundle.rooms.map((r) => [r.room_id, r]));
  return {
    mainKwh: bundle.period.main_kwh,
    electricityAmount: bundle.period.electricity_amount,
    rooms: rooms
      .filter((room) => byRoom.has(room.id))
      .map((room) => {
        const pr = byRoom.get(room.id)!;
        const meterIds = new Set(room.meters.map((m) => m.id));
        return {
          roomId: room.id,
          rent: pr.rent,
          people: pr.people,
          adjustment: pr.adjustment,
          readings: bundle.readings
            .filter((r) => meterIds.has(r.meter_id))
            .map((r) => ({ oldValue: r.old_value, newValue: r.new_value })),
        };
      }),
    expenses: bundle.expenses.map((e) => ({ id: e.id, kind: e.kind, name: e.name, amount: e.amount })),
  };
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

export type CleaningLog = {
  id: string;
  cleaned_on: string;
  room_id: string;
  slot_id: string | null;
  substitute_for: string | null;
  recorded_by: string | null;
  source: "app" | "admin" | "excel";
  created_at: string;
};

export const PLAN_AHEAD = 5;

function toSlot(row: {
  id: string;
  slot_date: string;
  room_id: string;
  status: string;
  rescheduled: boolean;
}): Slot {
  return {
    id: row.id,
    date: row.slot_date,
    roomId: row.room_id,
    status: row.status as Slot["status"],
    rescheduled: row.rescheduled,
  };
}

/**
 * Loads the rota, creating the first plan (from the cleaning history) or
 * extending it so that the next few Saturdays are always planned.
 */
export async function getCleaningSlots(rooms: Room[]): Promise<Slot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cleaning_slots")
    .select("id, slot_date, room_id, status, rescheduled")
    .order("slot_date");
  if (error) throw error;
  let slots = (data ?? []).map(toSlot);
  const roomIds = rooms.map((r) => r.id);

  const extra = slotsToAdd(slots, roomIds.length, PLAN_AHEAD);
  const needsSeed = slots.length === 0 && roomIds.length > 0;
  if (!needsSeed && extra.length === 0) return slots.sort((a, b) => (a.date < b.date ? -1 : 1));

  // Writing the rota needs the server key. If it is not configured the page
  // still works with the turns already planned.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return slots.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  if (needsSeed) {
    const { data: logs } = await supabase
      .from("cleaning_logs")
      .select("room_id, cleaned_on")
      .order("cleaned_on", { ascending: false })
      .limit(200);
    const lastCleaned: Record<string, string> = {};
    for (const l of logs ?? []) lastCleaned[l.room_id] ??= l.cleaned_on;
    const latest = logs?.[0]?.cleaned_on ?? todayVN();
    const start = nextSaturdayAfter(latest < todayVN() ? addWeeksUntilFuture(latest) : latest);
    const seeded = seedSlots(roomIds, lastCleaned, start);
    const { data: inserted, error: insErr } = await admin
      .from("cleaning_slots")
      .insert(seeded.map((s) => ({ slot_date: s.date, room_id: s.roomId })))
      .select("id, slot_date, room_id, status, rescheduled");
    if (insErr) throw insErr;
    slots = (inserted ?? []).map(toSlot);
  }

  const more = slotsToAdd(slots, roomIds.length, PLAN_AHEAD);
  if (more.length > 0) {
    const { data: inserted, error: insErr } = await admin
      .from("cleaning_slots")
      .insert(more.map((s) => ({ slot_date: s.date, room_id: s.roomId })))
      .select("id, slot_date, room_id, status, rescheduled");
    if (insErr) throw insErr;
    slots = [...slots, ...(inserted ?? []).map(toSlot)];
  }
  return slots.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// If the last cleaning was long ago, start the plan from last Saturday so the
// first turn is not placed weeks in the past.
function addWeeksUntilFuture(date: string): string {
  const today = todayVN();
  let d = date;
  while (nextSaturdayAfter(d) < today) d = nextSaturdayAfter(d);
  return d;
}

export async function getCleaningLogs(limit = 12): Promise<CleaningLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cleaning_logs")
    .select("*")
    .order("cleaned_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CleaningLog[];
}

export async function getProfilesById(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.full_name]));
}
