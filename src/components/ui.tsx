import type { ReactNode } from "react";
import { LINE_COLORS, roomColor } from "@/lib/palette";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`rounded-2xl bg-surface p-4 ${className}`}>{children}</section>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-[13px] font-bold tracking-wide text-muted uppercase">{children}</h2>;
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex flex-col gap-0.5">
      {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
      <h1 className="text-[22px] leading-tight font-bold">{title}</h1>
    </header>
  );
}

export function RoomChip({
  code,
  color,
  size = "md",
}: {
  code: string;
  color: string;
  size?: "sm" | "md";
}) {
  const c = roomColor(color);
  const cls = size === "sm" ? "px-1.5 py-0.5 text-xs rounded-md" : "h-10 min-w-11 px-2 text-sm rounded-[10px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-bold ${cls}`}
      style={{ background: c.bg, color: c.fg }}
    >
      {code}
    </span>
  );
}

type Tone = "ok" | "warn" | "brand" | "solid" | "hl";

const TONES: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  brand: "bg-brand-soft text-brand",
  solid: "bg-brand text-brand-ink",
  hl: "bg-hl-line text-ink",
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Dot({ kind }: { kind: keyof typeof LINE_COLORS }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ background: LINE_COLORS[kind] }}
    />
  );
}

export function Notice({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "ok" | "brand";
  children: ReactNode;
}) {
  const cls = tone === "ok" ? "bg-ok-soft text-ok" : tone === "brand" ? "bg-brand-soft text-brand" : "bg-warn-soft text-warn";
  return (
    <p role="status" className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${cls}`}>
      {children}
    </p>
  );
}

export const inputClass =
  "h-11 w-full rounded-[10px] border border-field bg-surface px-3 text-base text-ink placeholder:text-muted/70 disabled:bg-bg";

export const buttonClass = {
  primary:
    "inline-flex min-h-11 items-center justify-center rounded-xl transition duration-150 active:scale-[0.97] bg-brand px-4 text-[15px] font-semibold text-brand-ink disabled:opacity-60",
  soft: "inline-flex min-h-11 items-center justify-center rounded-xl transition duration-150 active:scale-[0.97] bg-brand-soft px-4 text-[15px] font-semibold text-brand disabled:opacity-60",
  ok: "inline-flex min-h-11 items-center justify-center rounded-xl transition duration-150 active:scale-[0.97] bg-ok px-4 text-[15px] font-semibold text-white disabled:opacity-60",
  outline:
    "inline-flex min-h-11 items-center justify-center rounded-xl transition duration-150 active:scale-[0.97] border border-field bg-surface px-4 text-[15px] font-semibold text-ink disabled:opacity-60",
  danger:
    "inline-flex min-h-11 items-center justify-center rounded-xl transition duration-150 active:scale-[0.97] bg-warn-soft px-4 text-[15px] font-semibold text-danger disabled:opacity-60",
};

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px] text-ink/80">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
