"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/auth";
import { getMe, requireAdmin } from "@/lib/data";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/** Admin marks a room's bill as paid / not paid. Either way the room's report is settled. */
export async function setPaid(formData: FormData) {
  await requireAdmin();
  const periodId = String(formData.get("periodId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const paid = formData.get("paid") === "true";
  if (!periodId || !roomId) return;
  const supabase = await createClient();
  await supabase
    .from("period_rooms")
    .update({ paid, paid_at: paid ? new Date().toISOString() : null, payment_reported_at: null })
    .eq("period_id", periodId)
    .eq("room_id", roomId);
  revalidatePath("/", "layout");
}

/**
 * The signed-in person says their own room has paid. Admins confirm their own
 * room directly; a member's report waits for an admin. Members have no write
 * access to period_rooms, so this runs with the server key after these checks.
 */
export async function submitPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getMe();
  const periodId = String(formData.get("periodId") ?? "");
  if (!periodId || !me.roomId) return { error: "Không tìm thấy hóa đơn của phòng bạn" };

  const supabase = await createClient();
  const { data: period } = await supabase.from("periods").select("status").eq("id", periodId).maybeSingle();
  if (period?.status !== "closed") return { error: "Tháng này chưa chốt" };

  const now = new Date().toISOString();
  const update = me.isAdmin ? { paid: true, paid_at: now, payment_reported_at: null } : { payment_reported_at: now };
  try {
    const { error } = await createAdminClient()
      .from("period_rooms")
      .update(update)
      .eq("period_id", periodId)
      .eq("room_id", me.roomId)
      .eq("paid", false);
    if (error) return { error: "Chưa lưu được, bạn thử lại nhé" };
  } catch {
    return { error: "Chưa lưu được, bạn thử lại nhé" };
  }
  revalidatePath("/", "layout");
  return {};
}

/** A member withdraws their own room's report, for example after tapping by mistake. */
export async function cancelPaymentReport(formData: FormData) {
  const me = await getMe();
  const periodId = String(formData.get("periodId") ?? "");
  if (!periodId || !me.roomId) return;
  await createAdminClient()
    .from("period_rooms")
    .update({ payment_reported_at: null })
    .eq("period_id", periodId)
    .eq("room_id", me.roomId)
    .eq("paid", false);
  revalidatePath("/", "layout");
}
