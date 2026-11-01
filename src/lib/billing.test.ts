import { describe, expect, it } from "vitest";
import { calculateBills, roundTotal, type BillInput } from "./billing";

// Figures from the house's October 2026 sheet (room names left out).
const october: BillInput = {
  mainKwh: 480,
  electricityAmount: 1_460_000,
  rooms: [
    { roomId: "A", rent: 4_000_000, people: 2, readings: [ { oldValue: 6177, newValue: 6239 }, { oldValue: 1750, newValue: 1783 } ] },
    { roomId: "B", rent: 3_500_000, people: 2, readings: [{ oldValue: 4811, newValue: 4903 }] },
    { roomId: "C", rent: 2_900_000, people: 2, readings: [{ oldValue: 3513, newValue: 3560 }] },
    { roomId: "D", rent: 3_000_000, people: 3, readings: [{ oldValue: 2877, newValue: 2955 }] },
    { roomId: "E", rent: 2_000_000, people: 1, readings: [{ oldValue: 4369, newValue: 4435 }] },
  ],
  expenses: [
    { kind: "wifi", name: "Wifi", amount: 400_000 },
    { kind: "water", name: "Nước", amount: 159_000 },
    { kind: "trash", name: "Rác", amount: 70_000 },
  ],
};

describe("calculateBills", () => {
  it("splits electricity exactly like the Excel sheet", () => {
    const r = calculateBills(october);
    expect(r.totalPeople).toBe(10);
    expect(r.privateKwh).toBe(378);
    expect(r.commonKwh).toBe(102);
    expect(r.privateAmount).toBeCloseTo(1_149_750, 6);
    expect(r.commonAmount).toBeCloseTo(310_250, 6);
    const elec = r.rooms.map((x) => x.electricity);
    expect(elec[0]).toBeCloseTo(351_008.333, 2);
    expect(elec[1]).toBeCloseTo(341_883.333, 2);
    expect(elec[2]).toBeCloseTo(205_008.333, 2);
    expect(elec[3]).toBeCloseTo(330_325, 2);
    expect(elec[4]).toBeCloseTo(231_775, 2);
    expect(elec.reduce((s, x) => s + x, 0)).toBeCloseTo(1_460_000, 6);
  });

  it("charges wifi, water and trash per person as separate lines", () => {
    const d = calculateBills(october).rooms[3];
    expect(d.expenses.map((e) => [e.kind, Math.round(e.amount)])).toEqual([
      ["wifi", 120_000],
      ["water", 47_700],
      ["trash", 21_000],
    ]);
  });

  it("rounds each room's total to the nearest 1.000đ with no deductions", () => {
    const totals = calculateBills(october).rooms.map((x) => x.total);
    expect(totals).toEqual([4_477_000, 3_968_000, 3_231_000, 3_519_000, 2_295_000]);
  });

  it("reproduces the old Excel totals when imported deductions are present", () => {
    const withAdvances: BillInput = {
      ...october,
      rooms: october.rooms.map((r) =>
        r.roomId === "A" ? { ...r, adjustment: -(1_460_000 + 559_000) }
          : r.roomId === "E" ? { ...r, adjustment: -70_000 } : r,
      ),
    };
    const totals = calculateBills(withAdvances).rooms.map((x) => x.total);
    expect(totals).toEqual([2_458_000, 3_968_000, 3_231_000, 3_519_000, 2_225_000]);
  });

  it("handles missing readings and empty months without dividing by zero", () => {
    const r = calculateBills({ mainKwh: 0, electricityAmount: 0, rooms: [
      { roomId: "A", rent: 100_000, people: 0, readings: [{ oldValue: 10, newValue: null }] },
    ], expenses: [{ kind: "wifi", name: "Wifi", amount: 400_000 }] });
    expect(r.missingReadings).toBe(true);
    expect(r.rooms[0].electricity).toBe(0);
    expect(r.rooms[0].total).toBe(100_000);
  });

  it("rounds half up to the thousand", () => {
    expect(roundTotal(2_457_500)).toBe(2_458_000);
    expect(roundTotal(2_457_499)).toBe(2_457_000);
  });
});
