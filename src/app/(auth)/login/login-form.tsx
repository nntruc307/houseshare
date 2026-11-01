"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type FormState } from "@/app/actions/auth";
import { Notice, buttonClass, inputClass } from "@/components/ui";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {notice ? <Notice>{notice}</Notice> : null}
      {state.error ? <Notice>{state.error}</Notice> : null}
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
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Mật khẩu
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={`${inputClass} h-[50px] rounded-xl`}
        />
      </label>
      <button type="submit" disabled={pending} className={`${buttonClass.primary} mt-2 h-[52px] text-base`}>
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
      <Link
        href="/forgot-password"
        className="flex min-h-11 items-center justify-center self-center text-sm font-semibold text-brand"
      >
        Quên mật khẩu?
      </Link>
    </form>
  );
}
