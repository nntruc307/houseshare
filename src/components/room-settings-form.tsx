"use client";

import { useState } from "react";
import { updateRoom } from "@/app/actions/rooms";
import { MoneyField } from "@/components/money-input";
import { SubmitButton } from "@/components/submit-button";
import { RoomChip, buttonClass, inputClass } from "@/components/ui";

type Props = {
  room: { id: string; code: string; name: string; color: string; default_rent: number; default_people: number };
  accounts: number;
};

const icon = "h-[18px] w-[18px]";

function Pencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={icon} aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={icon} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function Cross() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={icon} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-60";

/** Room header with a tap-to-edit name, plus default rent and head count. Draft months follow these values. */
export function RoomSettingsForm({ room, accounts }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(room.name);

  return (
    <form
      action={async (fd) => {
        await updateRoom(fd);
        setEditing(false);
      }}
      className="mb-3 flex flex-col gap-3"
    >
      <input type="hidden" name="roomId" value={room.id} />
      <div className="flex min-h-10 items-center gap-3">
        <RoomChip code={room.code} color={room.color} />
        {editing ? (
          <>
            <input
              name="name"
              value={name}
              maxLength={60}
              required
              autoFocus
              aria-label={`Tên phòng ${room.code}`}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setName(room.name);
                  setEditing(false);
                }
              }}
              className={`${inputClass} min-w-0 flex-1 py-2`}
            />
            <SubmitButton pendingLabel="…" className={`${iconBtn} bg-brand text-brand-ink`}>
              <span className="sr-only">Lưu tên</span>
              <Check />
            </SubmitButton>
            <button
              type="button"
              onClick={() => {
                setName(room.name);
                setEditing(false);
              }}
              className={`${iconBtn} bg-line text-muted`}
            >
              <span className="sr-only">Hủy</span>
              <Cross />
            </button>
          </>
        ) : (
          <>
            <input type="hidden" name="name" value={room.name} />
            <p className="min-w-0 flex-1 truncate font-bold">{room.name}</p>
            <span className="text-xs text-muted">{accounts} tài khoản</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`${iconBtn} -mr-2 text-muted hover:bg-line`}
            >
              <span className="sr-only">Sửa tên phòng {room.code}</span>
              <Pencil />
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-[1fr_5.5rem_auto] items-end gap-2">
        <label className="flex min-w-0 flex-col gap-1 text-[13px] text-ink/80">
          Tiền phòng
          <MoneyField name="rent" defaultValue={room.default_rent} className={`${inputClass} tabular-nums`} />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-[13px] text-ink/80">
          Số người
          <input
            name="people"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={room.default_people}
            required
            className={`${inputClass} tabular-nums`}
          />
        </label>
        <SubmitButton className={buttonClass.soft}>Lưu</SubmitButton>
      </div>
    </form>
  );
}
