"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Item = { href: string; label: string; icon: ReactNode; match: (p: string) => boolean };

const stroke = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ITEMS: Item[] = [
  {
    href: "/",
    label: "Trang chủ",
    match: (p) => p === "/",
    icon: (
      <svg {...stroke}>
        <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/bills",
    label: "Hóa đơn",
    match: (p) => p.startsWith("/bills"),
    icon: (
      <svg {...stroke}>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
  {
    href: "/cleaning",
    label: "Dọn VS",
    match: (p) => p.startsWith("/cleaning"),
    icon: (
      <svg {...stroke}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
];

const ADMIN_ITEM: Item = {
  href: "/admin/month",
  label: "Quản lý",
  match: (p) => p.startsWith("/admin"),
  icon: (
    <svg {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </svg>
  ),
};

const ACCOUNT_ITEM: Item = {
  href: "/account",
  label: "Tôi",
  match: (p) => p.startsWith("/account"),
  icon: (
    <svg {...stroke}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
};

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [...ITEMS, ...(isAdmin ? [ADMIN_ITEM] : []), ACCOUNT_ITEM];
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[68px] flex-col items-center justify-center gap-1 text-xs transition-colors duration-200 active:scale-95 ${
                  active ? "font-bold text-brand" : "text-muted"
                }`}
              >
                <span className={`transition-transform duration-200 ${active ? "-translate-y-0.5 scale-110" : ""}`}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
