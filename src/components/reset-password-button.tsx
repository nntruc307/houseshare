"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/rooms";
import type { FormState } from "@/app/actions/auth";
import { buttonClass } from "@/components/ui";

export function ResetPasswordButton({ profileId }: { profileId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <button type="submit" disabled={pending} className={`${buttonClass.outline} min-h-9 px-3 text-xs`}>
        Đặt lại mật khẩu
      </button>
      {state.ok || state.error ? (
        <span role="status" className={`text-xs ${state.error ? "text-danger" : "text-ok"}`}>
          {state.error ?? state.ok}
        </span>
      ) : null}
    </form>
  );
}
