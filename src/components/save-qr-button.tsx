"use client";

import { useEffect, useRef, useState } from "react";

async function loadQr(src: string): Promise<Blob | null> {
  try {
    const res = await fetch(src);
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

export function SaveQrButton({ src, fileName }: { src: string; fileName: string }) {
  // Loaded up front: iOS only allows the share sheet right after a tap, not
  // after waiting on the network.
  const loaded = useRef<Promise<Blob | null> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loaded.current = loadQr(src);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [src]);

  async function save() {
    if (timer.current) clearTimeout(timer.current);
    setError("");
    const blob = await (loaded.current ?? loadQr(src));
    if (!blob) {
      loaded.current = null;
      setError("Chưa lưu được. Bạn nhấn giữ ảnh QR để lưu nhé.");
      timer.current = setTimeout(() => setError(""), 3000);
      return;
    }

    // Phones: the share sheet offers "Save image", which puts it in Photos.
    const file = new File([blob], fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // closed the sheet
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={save}
        aria-label="Lưu ảnh QR"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-field bg-surface text-ink transition duration-150 active:scale-[0.94]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </button>
      <span
        role="alert"
        className={
          error
            ? "absolute bottom-full left-1/2 mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1 text-center text-xs font-semibold text-surface"
            : "sr-only"
        }
      >
        {error}
      </span>
    </span>
  );
}
