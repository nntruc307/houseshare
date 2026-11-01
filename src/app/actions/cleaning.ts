"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/auth";
import { planRecord } from "@/lib/cleaning";
import { getCleaningSlots, getMe, getRooms, requireAdmin } from "@/lib/data";
import { todayVN } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/server";

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

const NO_KEY = "Máy chủ chưa được cấu hình khóa quản trị (SUPABASE_SECRET_KEY).";

/** A member records their own room; an admin can record any room. */
export async function recordCleaning(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getMe();
  const roomId = String(formData.get("roomId") ?? "");
  const cleanedOn = String(formData.get("cleanedOn") ?? "");
  if (!roomId) return { error: "Chọn phòng đã dọn" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanedOn)) return { error: "Chọn ngày đã dọn" };
  if (cleanedOn > todayVN()) return { error: "Ngày dọn không thể ở tương lai" };
  if (!me.isAdmin && roomId !== me.roomId) return { error: "Bạn chỉ ghi được cho phòng của mình" };

  const rooms = await getRooms();
  const slots = await getCleaningSlots(rooms);
  let plan;
  try {
    plan = planRecord(slots, roomId, cleanedOn);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không ghi nhận được" };
  }

  const db = admin();
  if (!db) return { error: NO_KEY };
  const { error } = await db.rpc("apply_cleaning_plan", {
    p_slot: plan.slotId,
    p_cleaned_on: cleanedOn,
    p_room: roomId,
    p_substitute_for: plan.kind === "substitute" ? plan.substituteFor : null,
    p_recorded_by: me.id,
    p_source: me.isAdmin && roomId !== me.roomId ? "admin" : "app",
    p_changes: plan.changes.map((c) => ({
      slotId: c.slotId,
      fromRoomId: c.fromRoomId,
      toRoomId: c.toRoomId,
    })),
  });
  if (error) return { error: "Không lưu được, thử lại nhé" };
  revalidatePath("/", "layout");
  return { ok: "Đã ghi nhận" };
}

export async function undoCleaning(formData: FormData) {
  await requireAdmin();
  const logId = String(formData.get("logId") ?? "");
  const db = admin();
  if (!logId || !db) return;
  await db.rpc("undo_cleaning_log", { p_log: logId });
  revalidatePath("/", "layout");
}

export async function swapCleaning(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const a = String(formData.get("a") ?? "");
  const b = String(formData.get("b") ?? "");
  if (!a || !b || a === b) return { error: "Chọn hai lượt khác nhau" };
  const db = admin();
  if (!db) return { error: NO_KEY };
  const { error } = await db.rpc("swap_cleaning_slots", { p_a: a, p_b: b });
  if (error) return { error: "Không đổi được lịch" };
  revalidatePath("/", "layout");
  return { ok: "Đã đổi lịch" };
}
