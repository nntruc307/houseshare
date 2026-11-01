import Link from "next/link";
import { MonthForm } from "@/components/month-form";
import { Badge, PageTitle } from "@/components/ui";
import { monthLabel } from "@/lib/format";
import { loadMonthForm } from "@/lib/month-form";

export default async function AdminMonthPage({ searchParams }: PageProps<"/admin/month">) {
  const { month } = await searchParams;
  const { state, months } = await loadMonthForm(month);
  return (
    <>
      <PageTitle title={monthLabel(state.month)} subtitle="Nhập số liệu tháng" />
      <div className="flex flex-wrap items-center gap-2">
        {state.status === "closed" ? <Badge tone="ok">Đã chốt</Badge> : null}
        {state.status === "draft" ? <Badge tone="warn">Nháp</Badge> : null}
        {state.status === "new" ? <Badge tone="brand">Tháng mới</Badge> : null}
        <span className="flex-1" />
        {months.slice(0, 4).map((m) => (
          <Link
            key={m.month}
            href={`/admin/month?month=${m.month.slice(0, 7)}`}
            className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted"
          >
            T{Number(m.month.slice(5, 7))}
          </Link>
        ))}
      </div>
      <MonthForm key={state.month + state.status} initial={state} />
    </>
  );
}
