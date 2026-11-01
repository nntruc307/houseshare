"use client";

import { useActionState } from "react";
import { addMember } from "@/app/actions/rooms";
import type { FormState } from "@/app/actions/auth";
import { Notice, buttonClass, inputClass } from "@/components/ui";

export function AddMemberForm({ rooms }: { rooms: { id: string; code: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMember, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="name" placeholder="Tên hiển thị" required className={inputClass} />
      <input name="email" type="email" placeholder="Email đăng nhập" required className={inputClass} />
      <select name="roomId" className={inputClass} aria-label="Phòng">
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.code} · {r.name}
          </option>
        ))}
      </select>
      {state.error ? <Notice>{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? "Đang tạo…" : "Thêm thành viên"}
      </button>
    </form>
  );
}
