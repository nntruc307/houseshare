"use client";

import { useActionState, useMemo, useState } from "react";
import { saveMonth } from "@/app/actions/month";
import type { FormState } from "@/app/actions/auth";
import { calculateBills, type ExpenseKind } from "@/lib/billing";
import { vnd } from "@/lib/format";
import type { MonthFormState } from "@/lib/month-form";
import { MoneyInput, formatMoneyInput } from "@/components/money-input";
import { Card, Notice, RoomChip, SectionLabel, buttonClass, inputClass } from "@/components/ui";

const num = (s: string): number | null => {
  const t = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const dec = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const show = (n: number | null) => (n == null ? "" : String(n));
const money = (n: number | null) => (n == null ? "" : formatMoneyInput(String(Math.round(n))));

type RoomDraft = {
  roomId: string;
  name: string;
  rent: string;
  people: string;
  readings: { meterId: string; label: string; oldValue: string; newValue: string }[];
};

export function MonthForm({ initial }: { initial: MonthFormState }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveMonth, {});
  const locked = initial.status === "closed";
  const [mainKwh, setMainKwh] = useState(show(initial.mainKwh));
  const [amount, setAmount] = useState(money(initial.electricityAmount));
  const [rooms, setRooms] = useState<RoomDraft[]>(
    initial.rooms.map((r) => ({
      roomId: r.roomId,
      name: r.name,
      rent: money(r.rent),
      people: String(r.people),
      readings: r.readings.map((x) => ({
        meterId: x.meterId,
        label: x.label,
        oldValue: show(x.oldValue),
        newValue: show(x.newValue),
      })),
    })),
  );
  const [expenses, setExpenses] = useState(
    initial.expenses.map((e) => ({ kind: e.kind as ExpenseKind, name: e.name, amount: money(e.amount) })),
  );

  const payload = useMemo(
    () => ({
      month: initial.month,
      mainKwh: dec(mainKwh),
      electricityAmount: num(amount),
      rooms: rooms.map((r) => ({
        roomId: r.roomId,
        name: r.name.trim(),
        rent: num(r.rent) ?? 0,
        people: Number(r.people) || 0,
        readings: r.readings.map((x) => ({
          meterId: x.meterId,
          oldValue: dec(x.oldValue),
          newValue: dec(x.newValue),
        })),
      })),
      expenses: expenses.map((e) => ({ kind: e.kind, name: e.name, amount: num(e.amount) })),
    }),
    [initial.month, mainKwh, amount, rooms, expenses],
  );

  const summary = useMemo(
    () =>
      calculateBills({
        mainKwh: payload.mainKwh ?? 0,
        electricityAmount: payload.electricityAmount ?? 0,
        rooms: payload.rooms.map((r) => ({
          roomId: r.roomId,
          rent: r.rent,
          people: r.people,
          readings: r.readings,
        })),
        expenses: payload.expenses
          .filter((e) => (e.amount ?? 0) > 0)
          .map((e) => ({ kind: e.kind, name: e.name, amount: e.amount ?? 0 })),
      }),
    [payload],
  );
  const billOf = new Map(summary.rooms.map((b) => [b.roomId, b]));
  const meta = new Map(initial.rooms.map((r) => [r.roomId, r]));

  const patchRoom = (id: string, patch: Partial<RoomDraft>) =>
    setRooms((rs) => rs.map((r) => (r.roomId === id ? { ...r, ...patch } : r)));
  const patchReading = (id: string, meterId: string, patch: Partial<RoomDraft["readings"][number]>) =>
    setRooms((rs) =>
      rs.map((r) =>
        r.roomId === id
          ? { ...r, readings: r.readings.map((x) => (x.meterId === meterId ? { ...x, ...patch } : x)) }
          : r,
      ),
    );

  const field = `${inputClass} tabular-nums`;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <input type="hidden" name="month" value={initial.month} />

      {locked ? (
        <Notice tone="brand">Tháng này đã chốt. Bấm “Mở lại để sửa” nếu cần chỉnh số liệu.</Notice>
      ) : null}

      <Card>
        <SectionLabel>Điện toàn nhà</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[13px] text-ink/80">
            Tổng kWh (công tơ tổng)
            <input
              inputMode="decimal"
              value={mainKwh}
              disabled={locked}
              onChange={(e) => setMainKwh(e.target.value)}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-ink/80">
            Tiền điện
            <MoneyInput value={amount} disabled={locked} onValueChange={setAmount} className={field} />
          </label>
        </div>
      </Card>

      {rooms.map((r) => {
        const m = meta.get(r.roomId)!;
        const bill = billOf.get(r.roomId);
        return (
          <Card key={r.roomId}>
            <div className="mb-3 flex items-center gap-3">
              <RoomChip code={m.code} color={m.color} />
              <p className="flex-1 font-bold">{r.name.trim() || m.name}</p>
              <p className="text-right text-sm font-bold tabular-nums">{vnd(bill?.total ?? 0)} đ</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 flex flex-col gap-1 text-[13px] text-ink/80">
                Tên phòng tháng này
                <input
                  value={r.name}
                  maxLength={60}
                  disabled={locked}
                  placeholder={m.name}
                  onChange={(e) => patchRoom(r.roomId, { name: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-[13px] text-ink/80">
                Tiền phòng
                <MoneyInput
                  value={r.rent}
                  disabled={locked}
                  onValueChange={(v) => patchRoom(r.roomId, { rent: v })}
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-[13px] text-ink/80">
                Số người
                <input
                  inputMode="numeric"
                  value={r.people}
                  disabled={locked}
                  onChange={(e) => patchRoom(r.roomId, { people: e.target.value })}
                  className={field}
                />
              </label>
              {r.readings.map((x) => (
                <div key={x.meterId} className="col-span-2 grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-[13px] text-ink/80">
                    Số cũ · {x.label}
                    <input
                      inputMode="decimal"
                      value={x.oldValue}
                      disabled={locked}
                      onChange={(e) => patchReading(r.roomId, x.meterId, { oldValue: e.target.value })}
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] text-ink/80">
                    Số mới · {x.label}
                    <input
                      inputMode="decimal"
                      value={x.newValue}
                      disabled={locked}
                      onChange={(e) => patchReading(r.roomId, x.meterId, { newValue: e.target.value })}
                      className={field}
                    />
                  </label>
                </div>
              ))}
            </div>
            {bill ? <p className="mt-2 text-xs text-muted">Dùng {bill.kwh} kWh</p> : null}
          </Card>
        );
      })}

      <Card>
        <SectionLabel>Chi phí chung</SectionLabel>
        <div className="mt-3 flex flex-col gap-3">
          {expenses.map((e, i) => (
            <div key={`${e.kind}-${i}`} className="grid grid-cols-[1fr_1fr] gap-3">
              {e.kind === "other" ? (
                <input
                  aria-label="Tên khoản chi"
                  value={e.name}
                  disabled={locked}
                  onChange={(ev) =>
                    setExpenses((xs) => xs.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)))
                  }
                  className={inputClass}
                />
              ) : (
                <span className="flex items-center text-[15px] font-medium">{e.name}</span>
              )}
              <MoneyInput
                aria-label={`Số tiền ${e.name}`}
                value={e.amount}
                disabled={locked}
                onValueChange={(v) => setExpenses((xs) => xs.map((x, j) => (j === i ? { ...x, amount: v } : x)))}
                className={field}
              />
            </div>
          ))}
          {!locked ? (
            <button
              type="button"
              className={buttonClass.outline}
              onClick={() => setExpenses((xs) => [...xs, { kind: "other", name: "Khoản khác", amount: "" }])}
            >
              + Thêm khoản khác
            </button>
          ) : null}
        </div>
      </Card>

      <Card>
        <SectionLabel>Tóm tắt</SectionLabel>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          <li className="flex justify-between">
            <span>Điện chung (đã trừ công tơ phòng)</span>
            <span className="tabular-nums">{summary.commonKwh} kWh · {vnd(summary.commonAmount)} đ</span>
          </li>
          <li className="flex justify-between font-bold">
            <span>Tổng các phòng</span>
            <span className="tabular-nums">{vnd(summary.grandTotal)} đ</span>
          </li>
        </ul>
      </Card>

      {state.error ? <Notice>{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}

      {locked ? (
        <button type="submit" name="intent" value="reopen" disabled={pending} className={buttonClass.outline}>
          Mở lại để sửa
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="submit" name="intent" value="save" disabled={pending} className={buttonClass.soft}>
            {pending ? "Đang lưu…" : "Lưu nháp"}
          </button>
          <button type="submit" name="intent" value="close" disabled={pending} className={buttonClass.primary}>
            Chốt tháng
          </button>
        </div>
      )}
    </form>
  );
}
