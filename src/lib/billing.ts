// Pure billing calculation. No I/O, so it runs on the server and in the
// admin's browser (live preview) with identical results.

export type ExpenseKind = "wifi" | "water" | "trash" | "other";

export type ExpenseInput = {
  id?: string;
  kind: ExpenseKind;
  name: string;
  amount: number;
};

export type RoomInput = {
  roomId: string;
  rent: number;
  people: number;
  adjustment?: number; // only for months imported from Excel
  readings: { oldValue: number | null; newValue: number | null }[];
};

export type BillInput = {
  mainKwh: number;
  electricityAmount: number;
  rooms: RoomInput[];
  expenses: ExpenseInput[];
};

export type ExpenseShare = {
  kind: ExpenseKind;
  name: string;
  amount: number; // this room's share, VND (not rounded)
};

export type RoomBill = {
  roomId: string;
  people: number;
  kwh: number;
  rent: number;
  electricity: number;
  expenses: ExpenseShare[];
  adjustment: number;
  raw: number; // exact total
  total: number; // rounded to the nearest 1.000đ
};

export type BillSummary = {
  totalPeople: number;
  privateKwh: number;
  commonKwh: number;
  privateAmount: number;
  commonAmount: number;
  perHead: { kind: ExpenseKind; name: string; amount: number; perPerson: number }[];
  rooms: RoomBill[];
  grandTotal: number;
  missingReadings: boolean;
};

export const ROUND_TO = 1000;

export function roundTotal(value: number): number {
  return Math.round(value / ROUND_TO) * ROUND_TO;
}

export function roomConsumption(readings: RoomInput["readings"]): number {
  return readings.reduce((sum, r) => {
    if (r.oldValue == null || r.newValue == null) return sum;
    return sum + (r.newValue - r.oldValue);
  }, 0);
}

export function calculateBills(input: BillInput): BillSummary {
  const totalPeople = input.rooms.reduce((s, r) => s + r.people, 0);
  const kwhByRoom = input.rooms.map((r) => roomConsumption(r.readings));
  const privateKwh = kwhByRoom.reduce((s, k) => s + k, 0);
  const missingReadings = input.rooms.some((r) =>
    r.readings.some((x) => x.oldValue == null || x.newValue == null),
  );

  // Same split as the Excel sheet: the part measured by room sub-meters is
  // shared by kWh, the rest of the main meter is shared per person.
  const privateAmount =
    input.mainKwh > 0 ? (input.electricityAmount * privateKwh) / input.mainKwh : 0;
  const commonAmount = input.electricityAmount - privateAmount;
  const commonKwh = input.mainKwh - privateKwh;

  const perHead = input.expenses.map((e) => ({
    kind: e.kind,
    name: e.name,
    amount: e.amount,
    perPerson: totalPeople > 0 ? e.amount / totalPeople : 0,
  }));

  const rooms: RoomBill[] = input.rooms.map((room, i) => {
    const kwh = kwhByRoom[i];
    const commonShare = totalPeople > 0 ? (commonAmount / totalPeople) * room.people : 0;
    const privateShare = privateKwh > 0 ? (privateAmount * kwh) / privateKwh : 0;
    const electricity = commonShare + privateShare;
    const expenses = perHead.map((e) => ({
      kind: e.kind,
      name: e.name,
      amount: e.perPerson * room.people,
    }));
    const adjustment = room.adjustment ?? 0;
    const raw =
      room.rent + electricity + expenses.reduce((s, e) => s + e.amount, 0) + adjustment;
    return {
      roomId: room.roomId,
      people: room.people,
      kwh,
      rent: room.rent,
      electricity,
      expenses,
      adjustment,
      raw,
      total: roundTotal(raw),
    };
  });

  return {
    totalPeople,
    privateKwh,
    commonKwh,
    privateAmount,
    commonAmount,
    perHead,
    rooms,
    grandTotal: rooms.reduce((s, r) => s + r.total, 0),
    missingReadings,
  };
}
