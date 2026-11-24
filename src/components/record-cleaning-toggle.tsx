"use client";

import { useState } from "react";
import { RecordCleaningForm } from "@/components/record-cleaning-form";
import { buttonClass } from "@/components/ui";
import type { Slot } from "@/lib/cleaning";

type RoomLite = { id: string; code: string; name: string };

/** Home-page entry to record a clean: a prominent button that opens the form in place. */
export function RecordCleaningToggle({
  slots,
  rooms,
  fixedRoomId,
  today,
  isAdmin,
}: {
  slots: Slot[];
  rooms: RoomLite[];
  fixedRoomId: string | null;
  today: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-line pt-4">
      {open ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold">{isAdmin ? "Ghi nhận đã dọn (admin)" : "Phòng bạn vừa dọn?"}</p>
          <RecordCleaningForm slots={slots} rooms={rooms} fixedRoomId={fixedRoomId} today={today} />
          <button type="button" onClick={() => setOpen(false)} className={`${buttonClass.soft} w-full`}>
            Đóng
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={`${buttonClass.primary} w-full`}>
          Dọn xong rồi? Bấm để ghi nhận
        </button>
      )}
    </div>
  );
}
