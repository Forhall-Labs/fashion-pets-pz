import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { addDays } from "@/modules/shared/lib/date-utils";
import { TODAY_ISO } from "@/modules/shared/lib/mock-data";

import { usePickupsView } from "./usePickupsView";

let openSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  openSpy.mockRestore();
});

describe("usePickupsView", () => {
  it("lists today's pickup-needed appointments with no route generated yet", () => {
    const { result } = renderHook(() => usePickupsView());

    expect(result.current.date).toBe(TODAY_ISO);
    expect(result.current.pickupAppts.map((a) => a.id)).toEqual(["a1", "a2"]);
    expect(result.current.route).toBeNull();
    expect(result.current.showingRoute).toBe(false);
  });

  it("generates a route ordering stops by nearest neighbor, falling back to owner location", () => {
    const { result } = renderHook(() => usePickupsView());

    act(() => result.current.generateRoute());

    expect(result.current.showingRoute).toBe(true);
    expect(result.current.stale).toBe(false);
    expect(result.current.route?.stops.map((s) => s.petId)).toEqual(["p1", "p5"]);
    expect(result.current.route?.excluded).toEqual([]);
  });

  it("opens Waze at the first stop's coordinates", () => {
    const { result } = renderHook(() => usePickupsView());

    act(() => result.current.generateRoute());
    act(() => result.current.openWaze());

    expect(openSpy).toHaveBeenCalledWith(
      "https://waze.com/ul?ll=-34.6037,-58.3816&navigate=yes",
      "_blank",
    );
  });

  it("opens Google Maps directions to the last stop via the earlier stops as waypoints", () => {
    const { result } = renderHook(() => usePickupsView());

    act(() => result.current.generateRoute());
    act(() => result.current.openGoogleMaps());

    const [url] = openSpy.mock.calls[0];
    expect(url).toContain("destination=-34.5623,-58.4562");
    expect(url).toContain(`waypoints=${encodeURIComponent("-34.6037,-58.3816")}`);
  });

  it("clears the generated route when the date changes", () => {
    const { result } = renderHook(() => usePickupsView());

    act(() => result.current.generateRoute());
    act(() => result.current.changeDate(addDays(TODAY_ISO, 1)));

    expect(result.current.date).toBe(addDays(TODAY_ISO, 1));
    expect(result.current.route).toBeNull();
  });
});
