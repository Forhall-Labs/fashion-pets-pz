import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { addDays } from "@/modules/shared/lib/date-utils";
import { TODAY_ISO } from "@/modules/shared/lib/mock-data";

import { useConfigView } from "./useConfigView";

function fakeSubmitEvent() {
  return { preventDefault: () => {} } as React.FormEvent;
}

describe("useConfigView — capacity", () => {
  it("seeds from the shop config and flags a non-positive value as invalid", () => {
    const { result } = renderHook(() => useConfigView());

    expect(result.current.capacity.maxPetsPerDay).toBe(6);

    act(() => result.current.capacity.setMaxPetsPerDay(0));
    act(() => result.current.capacity.submit(fakeSubmitEvent()));

    expect(result.current.capacity.error).toBe(true);
  });

  it("accepts a positive integer", () => {
    const { result } = renderHook(() => useConfigView());

    act(() => result.current.capacity.setMaxPetsPerDay(10));
    act(() => result.current.capacity.submit(fakeSubmitEvent()));

    expect(result.current.capacity.error).toBe(false);
  });
});

describe("useConfigView — hours", () => {
  it("rejects a closing time at or before the opening time", () => {
    const { result } = renderHook(() => useConfigView());

    act(() => result.current.hours.setCloseTime(result.current.hours.openTime));
    act(() => result.current.hours.submit(fakeSubmitEvent()));

    expect(result.current.hours.error).toBe(true);
  });

  it("accepts a closing time after the opening time", () => {
    const { result } = renderHook(() => useConfigView());

    act(() => result.current.hours.setOpenTime("09:00"));
    act(() => result.current.hours.setCloseTime("18:00"));
    act(() => result.current.hours.submit(fakeSubmitEvent()));

    expect(result.current.hours.error).toBe(false);
  });
});

describe("useConfigView — blackouts", () => {
  it("starts from the shop's configured blackout periods", () => {
    const { result } = renderHook(() => useConfigView());

    expect(result.current.blackouts.items).toHaveLength(1);
    expect(result.current.blackouts.items[0].label).toBe("Vacaciones de invierno");
  });

  it("requires a start date before an end date", () => {
    const { result } = renderHook(() => useConfigView());

    act(() => result.current.blackouts.form.submit(fakeSubmitEvent()));
    expect(result.current.blackouts.form.error).toBe("start");

    act(() => result.current.blackouts.form.setStart(TODAY_ISO));
    act(() => result.current.blackouts.form.submit(fakeSubmitEvent()));
    expect(result.current.blackouts.form.error).toBe("end");
  });

  it("rejects an end date before the start date", () => {
    const { result } = renderHook(() => useConfigView());

    act(() => result.current.blackouts.form.setStart(TODAY_ISO));
    act(() => result.current.blackouts.form.setEnd(addDays(TODAY_ISO, -1)));
    act(() => result.current.blackouts.form.submit(fakeSubmitEvent()));

    expect(result.current.blackouts.form.error).toBe("end");
  });

  it("adds a new blackout period and resets the form", () => {
    const { result } = renderHook(() => useConfigView());

    act(() => result.current.blackouts.form.setStart(TODAY_ISO));
    act(() => result.current.blackouts.form.setEnd(addDays(TODAY_ISO, 5)));
    act(() => result.current.blackouts.form.setLabel("Feriado"));
    act(() => result.current.blackouts.form.submit(fakeSubmitEvent()));

    expect(result.current.blackouts.items).toHaveLength(2);
    const added = result.current.blackouts.items[1];
    expect(added).toMatchObject({
      startDate: TODAY_ISO,
      endDate: addDays(TODAY_ISO, 5),
      label: "Feriado",
    });
    expect(result.current.blackouts.form.start).toBe("");
    expect(result.current.blackouts.form.error).toBeNull();
  });

  it("removes a blackout period by id", () => {
    const { result } = renderHook(() => useConfigView());
    const [existing] = result.current.blackouts.items;

    act(() => result.current.blackouts.remove(existing.id));

    expect(result.current.blackouts.items).toHaveLength(0);
  });
});
