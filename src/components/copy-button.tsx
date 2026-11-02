"use client";

import { useEffect, useRef, useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    let next = "Đã sao chép";
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      next = "Chưa sao chép được";
    }
    setMessage(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 1800);
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className="inline-flex size-7 items-center justify-center rounded-lg border border-field bg-surface text-ink transition duration-150 active:scale-[0.94]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      <span
        role="status"
        className={
          message
            ? "absolute right-0 bottom-full mb-1.5 rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-surface"
            : "sr-only"
        }
      >
        {message}
      </span>
    </span>
  );
}
