"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

/** Admin marks a room's bill as paid / not paid. */
export async function setPaid(formData: FormData) {
  await requireAdmin();
  const periodId = String(formData.get("periodId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const paid = formData.get("paid") === "true";
  if (!periodId || !roomId) return;
  const supabase = await createClient();
  await supabase
    .from("period_rooms")
    .update({ paid, paid_at: paid ? new Date().toISOString() : null })
    .eq("period_id", periodId)
    .eq("room_id", roomId);
  revalidatePath("/", "layout");
}
