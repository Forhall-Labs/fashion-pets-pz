import { describe, expect, it } from "vitest";

import { closedDayMessage, DEFAULT_OPEN_WEEKDAYS, isOpenDayISO, weekdayOfISO } from "./open-days";

describe("open-days", () => {
  it("defaults to Monday–Saturday", () => {
    expect(DEFAULT_OPEN_WEEKDAYS).not.toContain("sunday");
    expect(DEFAULT_OPEN_WEEKDAYS).toHaveLength(6);
  });

  it("resolves the weekday of an ISO date in local time", () => {
    expect(weekdayOfISO("2026-12-13")).toBe("sunday");
    expect(weekdayOfISO("2026-12-14")).toBe("monday");
  });

  it("tells open from closed days and explains the closed one", () => {
    expect(isOpenDayISO("2026-12-13", DEFAULT_OPEN_WEEKDAYS)).toBe(false);
    expect(isOpenDayISO("2026-12-12", DEFAULT_OPEN_WEEKDAYS)).toBe(true);
    expect(closedDayMessage("2026-12-13")).toBe(
      "La tienda no atiende los domingos. Elegí otro día.",
    );
  });
});
