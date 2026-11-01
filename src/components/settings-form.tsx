"use client";

import { useActionState } from "react";
import { updateSettings } from "@/app/actions/rooms";
import type { FormState } from "@/app/actions/auth";
import type { Settings } from "@/lib/data";
import { Field, Notice, buttonClass, inputClass } from "@/components/ui";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSettings, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Tên nhà">
        <input name="house_name" defaultValue={settings.house_name} className={inputClass} />
      </Field>
      <Field label="Địa chỉ">
        <input name="address" defaultValue={settings.address} className={inputClass} />
      </Field>
      <Field label="Mã ngân hàng (VietQR)" hint="Ví dụ: VCB, TCB, MB, ACB">
        <input name="bank_code" defaultValue={settings.bank_code} className={inputClass} />
      </Field>
      <Field label="Số tài khoản">
        <input name="bank_account" inputMode="numeric" defaultValue={settings.bank_account} className={inputClass} />
      </Field>
      <Field label="Tên chủ tài khoản">
        <input name="bank_account_name" defaultValue={settings.bank_account_name} className={inputClass} />
      </Field>
      {state.error ? <Notice>{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? "Đang lưu…" : "Lưu cài đặt"}
      </button>
    </form>
  );
}
