"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui";

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
  const [error, setError] = useState("");

  useEffect(() => {
    loaded.current = loadQr(src);
  }, [src]);

  async function save() {
    setError("");
    const blob = await (loaded.current ?? loadQr(src));
    if (!blob) {
      loaded.current = null;
      setError("Chưa lưu được. Bạn nhấn giữ ảnh QR để lưu nhé.");
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
    <div className="flex w-full flex-col items-center gap-1">
      <button type="button" onClick={save} className={`${buttonClass.soft} w-full`}>
        Lưu ảnh QR
      </button>
      {error ? (
        <p role="alert" className="text-center text-xs text-danger">
          {error}
        </p>
      ) : (
        <p className="text-center text-xs text-muted">Lưu xong, mở app ngân hàng và quét mã từ thư viện ảnh.</p>
      )}
    </div>
  );
}
