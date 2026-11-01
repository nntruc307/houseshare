"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel = "Đang lưu…",
  className,
  formAction,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      formAction={formAction}
      name={name}
      value={value}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
