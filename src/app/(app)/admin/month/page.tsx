import { MonthChips } from "@/components/month-chips";
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
      <div className="flex items-center gap-3">
        <span className="shrink-0">
          {state.status === "closed" ? <Badge tone="ok">Đã chốt</Badge> : null}
          {state.status === "draft" ? <Badge tone="warn">Nháp</Badge> : null}
          {state.status === "new" ? <Badge tone="brand">Tháng mới</Badge> : null}
        </span>
        <MonthChips
          months={months.map((m) => m.month)}
          selected={state.month}
          href="/admin/month"
          className="ml-auto"
        />
      </div>
      <MonthForm key={state.month + state.status} initial={state} />
    </>
  );
}
