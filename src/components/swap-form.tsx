"use client";

import { useActionState } from "react";
import { swapCleaning } from "@/app/actions/cleaning";
import type { FormState } from "@/app/actions/auth";
import { Notice, buttonClass, inputClass } from "@/components/ui";

export function SwapForm({ options }: { options: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(swapCleaning, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <select name="a" defaultValue={options[0]?.id} className={inputClass} aria-label="Lượt thứ nhất">
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select name="b" defaultValue={options[1]?.id} className={inputClass} aria-label="Lượt thứ hai">
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {state.error ? <Notice>{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <button type="submit" disabled={pending} className={buttonClass.outline}>
        {pending ? "Đang đổi…" : "Đổi chỗ hai lượt"}
      </button>
    </form>
  );
}
