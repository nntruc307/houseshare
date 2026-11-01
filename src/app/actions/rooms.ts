"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/data";
import { todayVN } from "@/lib/format";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const DEFAULT_PASSWORD = "123456";
const NO_KEY = "Máy chủ chưa có SUPABASE_SECRET_KEY nên chưa tạo được tài khoản.";

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Name, rent and head count of a room. They are only edited here: months still in
 * draft follow them right away, closed months keep what they were closed with.
 */
export async function updateRoom(formData: FormData) {
  await requireAdmin();
  const roomId = String(formData.get("roomId") ?? "");
  const rentRaw = String(formData.get("rent") ?? "").replace(/[^\d]/g, "");
  const peopleRaw = String(formData.get("people") ?? "").replace(/[^\d]/g, "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!roomId || rentRaw === "" || peopleRaw === "" || !name) return;
  const rent = Number(rentRaw);
  const people = Math.min(Number(peopleRaw), 50);

  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .update({ name, default_rent: rent, default_people: people })
    .eq("id", roomId);
  if (error) return;

  // Only the newest month, and only while it is a draft, follows these values.
  const { data: newest } = await supabase
    .from("periods")
    .select("id, status")
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (newest?.status === "draft") {
    await supabase
      .from("period_rooms")
      .update({ room_name: name, rent, people })
      .eq("room_id", roomId)
      .eq("period_id", newest.id);
  }
  revalidatePath("/", "layout");
}

export async function addMember(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roomId = String(formData.get("roomId") ?? "");
  if (!name || !email || !roomId) return { error: "Nhập đủ tên, email và phòng" };

  const db = admin();
  if (!db) return { error: NO_KEY };
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
  });
  if (error || !created.user) {
    return { error: error?.message.includes("already") ? "Email này đã có tài khoản" : "Không tạo được tài khoản" };
  }
  const id = created.user.id;
  const { error: profileError } = await db
    .from("profiles")
    .insert({ id, full_name: name, email, role: "member", active: true });
  if (profileError) {
    await db.auth.admin.deleteUser(id);
    return { error: "Không tạo được hồ sơ thành viên" };
  }
  await db.from("room_memberships").insert({ profile_id: id, room_id: roomId, start_date: todayVN() });
  revalidatePath("/", "layout");
  return { ok: `Đã thêm ${name}. Mật khẩu mặc định: ${DEFAULT_PASSWORD}` };
}

export async function moveMember(formData: FormData) {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  if (!profileId || !roomId) return;
  const supabase = await createClient();
  const today = todayVN();
  await supabase
    .from("room_memberships")
    .update({ end_date: today })
    .eq("profile_id", profileId)
    .is("end_date", null);
  await supabase.from("room_memberships").insert({ profile_id: profileId, room_id: roomId, start_date: today });
  revalidatePath("/", "layout");
}

/** Someone moves out: they leave the room and can no longer sign in. */
export async function removeMember(formData: FormData) {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  if (!profileId) return;
  const supabase = await createClient();
  await supabase
    .from("room_memberships")
    .update({ end_date: todayVN() })
    .eq("profile_id", profileId)
    .is("end_date", null);
  await supabase.from("profiles").update({ active: false }).eq("id", profileId);
  revalidatePath("/", "layout");
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const db = admin();
  if (!db) return { error: NO_KEY };
  const { error } = await db.auth.admin.updateUserById(profileId, { password: DEFAULT_PASSWORD });
  return error ? { error: "Không đặt lại được" } : { ok: `Đã đặt lại về ${DEFAULT_PASSWORD}` };
}

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      house_name: String(formData.get("house_name") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      bank_code: String(formData.get("bank_code") ?? "").trim(),
      bank_account: String(formData.get("bank_account") ?? "").replace(/\s/g, ""),
      bank_account_name: String(formData.get("bank_account_name") ?? "").trim().toUpperCase(),
    })
    .eq("id", 1);
  if (error) return { error: "Không lưu được" };
  revalidatePath("/", "layout");
  return { ok: "Đã lưu" };
}
