import Link from "next/link";

type Props = {
  /** Months as "YYYY-MM-01", newest first. */
  months: string[];
  /** The month on screen ("YYYY-MM-01"). */
  selected: string;
  /** Page the chips link to, e.g. "/bills". */
  href: string;
  className?: string;
};

/** "2026-10-01" -> "T10"; adds "/25" when the year differs from the newest month. */
function chipLabel(month: string, refYear: string): string {
  const [y, m] = month.split("-");
  return y === refYear ? `T${Number(m)}` : `T${Number(m)}/${y.slice(2)}`;
}

/** Small pill row to jump between months. The month on screen is filled. Scrolls sideways when long. */
export function MonthChips({ months, selected, href, className = "" }: Props) {
  const list = months.includes(selected) ? months : [selected, ...months];
  const refYear = list[0]?.slice(0, 4) ?? "";
  return (
    <nav aria-label="Chọn tháng" className={`-mx-1 min-w-0 overflow-x-auto px-1 py-0.5 ${className}`}>
      <ul className="flex w-max gap-2">
        {list.map((m) => {
          const active = m === selected;
          return (
            <li key={m}>
              <Link
                href={`${href}?month=${m.slice(0, 7)}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-8 items-center rounded-full px-3.5 text-xs font-semibold tabular-nums transition ${
                  active ? "bg-brand text-brand-ink shadow-sm" : "bg-surface text-muted"
                }`}
              >
                {chipLabel(m, refYear)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
