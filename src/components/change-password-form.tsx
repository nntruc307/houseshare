"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/actions/auth";
import { Notice, buttonClass, inputClass } from "@/components/ui";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-[13px] text-ink/80">
        Mật khẩu mới
        <input name="password" type="password" autoComplete="new-password" minLength={6} required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-ink/80">
        Nhập lại mật khẩu
        <input name="confirm" type="password" autoComplete="new-password" minLength={6} required className={inputClass} />
      </label>
      {state.error ? <Notice>{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? "Đang lưu…" : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
