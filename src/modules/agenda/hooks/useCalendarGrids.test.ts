import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { fromISODate, minutesToTime } from "@/modules/shared/lib/date-utils";
import { mockData, TODAY_ISO } from "@/modules/shared/lib/mock-data";

import {
  MONTH_WEEKDAY_LABELS,
  useDayWeekGrid,
  useMonthGrid,
  useYearGrid,
} from "./useCalendarGrids";

describe("useDayWeekGrid", () => {
  it("builds one hourly row per shop-config hour, within the open/close window", () => {
    const { result } = renderHook(() => useDayWeekGrid(mockData, [TODAY_ISO]));

    expect(result.current.dayHeaders).toHaveLength(1);
    expect(result.current.rows.map((r) => minutesToTime(r.hMin))).toEqual([
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
    ]);
  });

  it("buckets each appointment into the row for its hour, with the pet resolved", () => {
    const { result } = renderHook(() => useDayWeekGrid(mockData, [TODAY_ISO]));

    const nineAm = result.current.rows.find((r) => minutesToTime(r.hMin) === "09:00")!;
    const tenAm = result.current.rows.find((r) => minutesToTime(r.hMin) === "10:00")!;

    expect(nineAm.cells[0].appts.map((a) => a.pet.name)).toEqual(["Rex"]);
    expect(tenAm.cells[0].appts.map((a) => a.pet.name)).toEqual(["Simón"]);
  });
});

describe("useMonthGrid", () => {
  it("always returns a full 6-week grid with the fixed Monday-first weekday labels", () => {
    const today = fromISODate(TODAY_ISO);
    const { result } = renderHook(() =>
      useMonthGrid(mockData, today.getFullYear(), today.getMonth(), TODAY_ISO),
    );

    expect(result.current.weekdayLabels).toBe(MONTH_WEEKDAY_LABELS);
    expect(result.current.cells).toHaveLength(42);
  });

  it("flags today's cell and lists its appointments", () => {
    const today = fromISODate(TODAY_ISO);
    const { result } = renderHook(() =>
      useMonthGrid(mockData, today.getFullYear(), today.getMonth(), TODAY_ISO),
    );

    const todayCell = result.current.cells.find((c) => c.iso === TODAY_ISO)!;

    expect(todayCell.isToday).toBe(true);
    expect(todayCell.otherMonth).toBe(false);
    expect(todayCell.appts.map((a) => a.pet.name)).toEqual(["Rex", "Simón"]);
    expect(todayCell.moreCount).toBe(0);
  });
});

describe("useYearGrid", () => {
  it("returns 12 months of 42 mini-day slots each", () => {
    const today = fromISODate(TODAY_ISO);
    const { result } = renderHook(() => useYearGrid(mockData, today.getFullYear()));

    expect(result.current.months).toHaveLength(12);
    expect(result.current.months.every((m) => m.miniDays.length === 42)).toBe(true);
  });

  it("marks today's mini-day as having an appointment", () => {
    const today = fromISODate(TODAY_ISO);
    const { result } = renderHook(() => useYearGrid(mockData, today.getFullYear()));

    const month = result.current.months[today.getMonth()];
    const todayMiniDay = month.miniDays.find((d) => d?.iso === TODAY_ISO);

    expect(todayMiniDay?.hasAppt).toBe(true);
  });
});
