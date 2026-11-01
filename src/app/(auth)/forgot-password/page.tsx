"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "@/app/actions/auth";
import { Notice, buttonClass, inputClass } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-muted">Nhập email, mình gửi link để đặt lại mật khẩu.</p>
      </div>
      {state.error ? <Notice>{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="ten@gmail.com"
          required
          className={`${inputClass} h-[50px] rounded-xl`}
        />
      </label>
      <button type="submit" disabled={pending} className={`${buttonClass.primary} h-[52px] text-base`}>
        {pending ? "Đang gửi…" : "Gửi link đặt lại"}
      </button>
      <Link
        href="/login"
        className="flex min-h-11 items-center justify-center self-center text-sm font-semibold text-brand"
      >
        Quay lại đăng nhập
      </Link>
    </form>
  );
}
