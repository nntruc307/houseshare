"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/auth";
import { submitPayment } from "@/app/actions/bills";
import { buttonClass } from "@/components/ui";

export function PaymentConfirm({ periodId }: { periodId: string }) {
  const [asking, setAsking] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(submitPayment, {});

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`${buttonClass.ok} w-full`}>
        Đã thanh toán
      </button>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-2 rounded-xl bg-hl p-3">
      <input type="hidden" name="periodId" value={periodId} />
      <p className="text-sm font-medium">Bạn xác nhận đã chuyển khoản cho tháng này?</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setAsking(false)} className={buttonClass.outline}>
          Chưa
        </button>
        <button type="submit" disabled={pending} className={buttonClass.ok}>
          Xác nhận
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
