"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    let next: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      next = "failed";
    }
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`${buttonClass.outline} min-h-9 shrink-0 px-3 text-xs`}
    >
      <span role="status">
        {status === "copied" ? "Đã sao chép" : status === "failed" ? "Thử lại" : "Sao chép"}
      </span>
    </button>
  );
}
