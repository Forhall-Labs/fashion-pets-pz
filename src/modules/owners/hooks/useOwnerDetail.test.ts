import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useOwnerDetail } from "./useOwnerDetail";

describe("useOwnerDetail", () => {
  it("returns a null owner and empty collections for an unknown id", () => {
    const { result } = renderHook(() => useOwnerDetail("does-not-exist"));

    expect(result.current.owner).toBeUndefined();
    expect(result.current.pets).toEqual([]);
    expect(result.current.upcoming).toEqual([]);
    expect(result.current.waLink).toBeNull();
  });

  it("resolves the owner's pets and scheduled-future appointments in date order", () => {
    const { result } = renderHook(() => useOwnerDetail("o1"));

    expect(result.current.owner?.name).toBe("María Fernández");
    expect(result.current.pets.map((p) => p.name)).toEqual(["Rex", "Nina"]);
    expect(result.current.upcoming.map((a) => a.id)).toEqual(["a1", "a4", "a5", "a6"]);
    expect(result.current.waLink).toContain("wa.me");
  });

  it("opens and closes the appointment modal", () => {
    const { result } = renderHook(() => useOwnerDetail("o1"));

    act(() => result.current.openAppointment("a1"));
    expect(result.current.openAppointmentId).toBe("a1");

    act(() => result.current.closeAppointment());
    expect(result.current.openAppointmentId).toBeNull();
  });
});
