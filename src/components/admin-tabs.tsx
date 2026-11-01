"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/month", label: "Nhập tháng" },
  { href: "/admin/rooms", label: "Phòng" },
  { href: "/admin/settings", label: "Cài đặt" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Quản lý" className="grid grid-cols-3 gap-1 rounded-xl bg-line p-1">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 items-center justify-center rounded-lg text-sm font-semibold ${
              active ? "bg-surface text-brand shadow-sm" : "text-muted"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
