"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/auth";
import { submitPayment } from "@/app/actions/bills";
import { buttonClass } from "@/components/ui";

export function PaymentConfirm({ periodId }: { periodId: string }) {
  const [asking, setAsking] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(submitPayment, {});

  return (
    <>
      {/* Keeps the end of the page reachable above the pinned bar. This sits outside
          any card: the page-entrance animation leaves a transform on cards, which
          would make "fixed" relative to the card instead of the screen. */}
      <div aria-hidden="true" className="h-12" />
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10">
        <div className="mx-auto w-full max-w-lg px-5">
          {asking ? (
            <form action={action} className="flex w-full flex-col gap-2 rounded-xl bg-hl p-3 shadow-lg">
                <input type="hidden" name="periodId" value={periodId} />
                <p className="text-sm font-medium">Bạn đã chuyển khoản cho tháng này rồi đúng không?</p>
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
          ) : (
            <button type="button" onClick={() => setAsking(true)} className={`${buttonClass.ok} w-full shadow-lg`}>
              Tôi đã chuyển khoản
            </button>
          )}
        </div>
      </div>
    </>
  );
}
