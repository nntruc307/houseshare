"use client";

import { useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";

/** "1460000" or "1.460.000" -> "1.460.000"; keeps only digits. */
export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> & {
  value: string;
  onValueChange: (formatted: string) => void;
};

/**
 * Money field that shows thousands separators while typing (1.460.000) with a faint "đ".
 * The value handed back is the formatted text; parse it with `num`/`parseMoney`.
 */
export function MoneyInput({ value, onValueChange, className = "", ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  // Digits that sat left of the caret before reformatting, so the caret stays put.
  const caretDigits = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const want = caretDigits.current;
    if (!el || want == null || document.activeElement !== el) return;
    caretDigits.current = null;
    let pos = 0;
    let seen = 0;
    while (pos < value.length && seen < want) {
      if (/\d/.test(value[pos])) seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
  }, [value]);

  return (
    <span className="relative block">
      <input
        {...rest}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onKeyDown={(e) => {
          // Backspace/Delete next to a "." removes the digit beside it instead of doing nothing.
          const el = e.currentTarget;
          const s = el.selectionStart;
          if (s == null || s !== el.selectionEnd) return;
          if (e.key === "Backspace" && el.value[s - 1] === ".") el.setSelectionRange(s - 1, s - 1);
          if (e.key === "Delete" && el.value[s] === ".") el.setSelectionRange(s + 1, s + 1);
          rest.onKeyDown?.(e);
        }}
        onChange={(e) => {
          const el = e.target;
          const caret = el.selectionStart ?? el.value.length;
          caretDigits.current = el.value.slice(0, caret).replace(/\D/g, "").length;
          onValueChange(formatMoneyInput(el.value));
        }}
        className={`${className} pr-8`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[15px] text-muted"
      >
        đ
      </span>
    </span>
  );
}

/** Uncontrolled version for plain server-action forms: submits the formatted text under `name`. */
export function MoneyField({
  defaultValue,
  ...rest
}: Omit<Props, "value" | "onValueChange" | "defaultValue"> & { defaultValue?: number | null }) {
  const [value, setValue] = useState(defaultValue == null ? "" : formatMoneyInput(String(Math.round(defaultValue))));
  return <MoneyInput {...rest} value={value} onValueChange={setValue} />;
}
