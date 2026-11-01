"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/app/actions/auth";
import { calculateBills, type ExpenseKind } from "@/lib/billing";
import { getRooms, requireAdmin } from "@/lib/data";
import { normalizeMonth } from "@/lib/month-view";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  month: string;
  mainKwh: number | null;
  electricityAmount: number | null;
  rooms: {
    roomId: string;
    readings: { meterId: string; oldValue: number | null; newValue: number | null }[];
  }[];
  expenses: { kind: ExpenseKind; name: string; amount: number | null }[];
};

const KINDS: ExpenseKind[] = ["wifi", "water", "trash", "other"];

function parse(raw: string): Payload | null {
  try {
    const p = JSON.parse(raw) as Payload;
    if (!normalizeMonth(p.month) || !Array.isArray(p.rooms) || !Array.isArray(p.expenses)) return null;
    return p;
  } catch {
    return null;
  }
}

export async function saveMonth(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const intent = String(formData.get("intent") ?? "save");
  const supabase = await createClient();

  if (intent === "reopen") {
    const month = normalizeMonth(String(formData.get("month") ?? ""));
    if (!month) return { error: "Tháng không hợp lệ" };
    const { error } = await supabase
      .from("periods")
      .update({ status: "draft", closed_at: null })
      .eq("month", month);
    if (error) return { error: "Không mở lại được tháng" };
    revalidatePath("/", "layout");
    return { ok: "Đã mở lại, bạn có thể sửa số liệu" };
  }

  const p = parse(String(formData.get("payload") ?? ""));
  if (!p) return { error: "Dữ liệu không hợp lệ" };
  const month = normalizeMonth(p.month)!;

  const { data: existing } = await supabase
    .from("periods")
    .select("id, status")
    .eq("month", month)
    .maybeSingle();
  if (existing?.status === "closed") return { error: "Tháng này đã chốt. Bấm “Mở lại để sửa” trước." };

  // Name, rent and head count are set in the Rooms tab only. The newest month copies
  // them; an older month that was reopened keeps its own.
  const { data: later } = await supabase.from("periods").select("id").gt("month", month).limit(1);
  const follows = (later ?? []).length === 0;
  const roomById = new Map((await getRooms()).map((r) => [r.id, r]));
  const savedById = new Map<string, { room_name: string | null; rent: number; people: number }>();
  if (!follows && existing) {
    const { data: saved } = await supabase
      .from("period_rooms")
      .select("room_id, room_name, rent, people")
      .eq("period_id", existing.id);
    for (const r of saved ?? []) savedById.set(r.room_id, r);
  }
  const rooms = p.rooms
    .filter((r) => roomById.has(r.roomId))
    .map((r) => {
      const room = roomById.get(r.roomId)!;
      const kept = savedById.get(r.roomId);
      return kept
        ? { ...r, name: kept.room_name || room.name, rent: kept.rent, people: kept.people }
        : { ...r, name: room.name, rent: room.default_rent, people: room.default_people };
    });

  const close = intent === "close";
  if (close) {
    const summary = calculateBills({
      mainKwh: p.mainKwh ?? 0,
      electricityAmount: p.electricityAmount ?? 0,
      rooms: rooms.map((r) => ({
        roomId: r.roomId,
        rent: r.rent,
        people: r.people,
        readings: r.readings.map((x) => ({ oldValue: x.oldValue, newValue: x.newValue })),
      })),
      expenses: [],
    });
    if (summary.missingReadings) return { error: "Còn công tơ chưa nhập số mới" };
    if (!p.mainKwh || !p.electricityAmount) return { error: "Nhập số điện tổng và tiền điện trước khi chốt" };
  }

  const { data: period, error: periodError } = await supabase
    .from("periods")
    .upsert(
      {
        month,
        main_kwh: p.mainKwh ?? 0,
        electricity_amount: Math.round(p.electricityAmount ?? 0),
        status: close ? "closed" : "draft",
        closed_at: close ? new Date().toISOString() : null,
      },
      { onConflict: "month" },
    )
    .select("id")
    .single();
  if (periodError || !period) return { error: "Không lưu được tháng" };

  const roomRows = rooms.map((r) => ({
    period_id: period.id,
    room_id: r.roomId,
    room_name: r.name,
    rent: Math.max(0, Math.round(r.rent || 0)),
    people: Math.max(0, Math.round(r.people || 0)),
  }));
  const readingRows = rooms.flatMap((r) =>
    r.readings.map((x) => ({
      period_id: period.id,
      meter_id: x.meterId,
      old_value: x.oldValue,
      new_value: x.newValue,
    })),
  );
  const expenseRows = p.expenses
    .filter((e) => KINDS.includes(e.kind) && e.amount != null && e.amount > 0)
    .map((e, i) => ({
      period_id: period.id,
      kind: e.kind,
      name: e.name.trim() || "Khác",
      amount: Math.round(e.amount ?? 0),
      sort: i,
    }));

  const results = await Promise.all([
    supabase.from("period_rooms").upsert(roomRows, { onConflict: "period_id,room_id" }),
    supabase.from("meter_readings").upsert(readingRows, { onConflict: "period_id,meter_id" }),
    supabase.from("period_expenses").delete().eq("period_id", period.id),
  ]);
  if (results.some((r) => r.error)) return { error: "Lưu chưa trọn vẹn, thử lại nhé" };
  if (expenseRows.length > 0) {
    const { error } = await supabase.from("period_expenses").insert(expenseRows);
    if (error) return { error: "Không lưu được các khoản chi" };
  }

  revalidatePath("/", "layout");
  if (close) redirect(`/bills?month=${month.slice(0, 7)}`);
  return { ok: "Đã lưu nháp" };
}
