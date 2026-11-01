"use client";

import { useActionState, useMemo, useState } from "react";
import { recordCleaning } from "@/app/actions/cleaning";
import type { FormState } from "@/app/actions/auth";
import { applyPlan, planRecord, type Slot } from "@/lib/cleaning";
import { dayMonth } from "@/lib/format";
import { Notice, buttonClass, inputClass } from "@/components/ui";

type RoomLite = { id: string; code: string; name: string };

export function RecordCleaningForm({
  slots,
  rooms,
  fixedRoomId,
  today,
}: {
  slots: Slot[];
  rooms: RoomLite[];
  fixedRoomId: string | null; // members record their own room only
  today: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordCleaning, {});
  const [roomId, setRoomId] = useState(fixedRoomId ?? rooms[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const byId = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const preview = useMemo(() => {
    try {
      const plan = planRecord(slots, roomId, date);
      const after = applyPlan(slots, plan);
      const moved = plan.changes
        .map((c) => {
          const was = slots.find((s) => s.id === c.slotId)!;
          const now = after.find((s) => s.id === c.slotId)!;
          return { id: c.slotId, date: was.date, from: was.roomId, to: now.roomId };
        })
        .filter((m) => m.from !== m.to);
      return { plan, moved, error: null as string | null };
    } catch (e) {
      return { plan: null, moved: [], error: e instanceof Error ? e.message : "Lỗi" };
    }
  }, [slots, roomId, date]);

  return (
    <form action={action} className="flex flex-col gap-3">
      {fixedRoomId ? (
        <input type="hidden" name="roomId" value={fixedRoomId} />
      ) : (
        <label className="flex flex-col gap-1 text-[13px] text-ink/80">
          Phòng đã dọn
          <select
            name="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className={inputClass}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} · {r.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-[13px] text-ink/80">
        Ngày đã dọn
        <input
          type="date"
          name="cleanedOn"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
          required
        />
      </label>

      {preview.error ? <Notice>{preview.error}</Notice> : null}
      {preview.plan?.kind === "substitute" ? (
        <div className="rounded-xl bg-hl p-3 text-sm">
          <p className="mb-1 font-bold">
            Dọn thay phòng {byId.get(preview.plan.substituteFor)?.code}. Lịch sẽ đổi:
          </p>
          <ul className="flex flex-col gap-0.5">
            {preview.moved.map((m) => (
              <li key={m.id}>
                {dayMonth(m.date)}: {byId.get(m.from)?.code} → <strong>{byId.get(m.to)?.code}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.error ? <Notice>{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <button type="submit" disabled={pending || !!preview.error} className={buttonClass.primary}>
        {pending ? "Đang lưu…" : "Ghi nhận đã dọn"}
      </button>
    </form>
  );
}
