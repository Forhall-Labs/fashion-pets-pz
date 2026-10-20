import { describe, expect, it } from "vitest";

import { blackoutFormSchema, capacityFormSchema, hoursFormSchema } from "./shop-config-schema";

function capacityError(maxPetsPerDay: string, quick = "") {
  const result = capacityFormSchema.safeParse({
    maxPetsPerDay,
    quickServiceDurationMinutes: quick,
  });
  return result.success ? null : result.error.issues[0].message;
}

describe("capacityFormSchema (HU-4.2 @validation)", () => {
  it("accepts a positive whole number", () => {
    expect(capacityError("10")).toBeNull();
  });

  it.each([
    ["0", "entero positivo"],
    ["-1", "positivo"],
    ["abc", "numérico"],
    ["8.5", "entero, sin decimales"],
    ["", "Ingresá"],
  ])("rejects %j with a specific message", (value, fragment) => {
    expect(capacityError(value)).toContain(fragment);
  });

  it("allows the quick-service duration to be empty, but not invalid", () => {
    expect(capacityError("8", "")).toBeNull();
    expect(capacityError("8", "0")).toContain("entero positivo");
  });
});

describe("hoursFormSchema (HU-4.3 @validation)", () => {
  function hoursError(openTime: string, closeTime: string) {
    const result = hoursFormSchema.safeParse({ openTime, closeTime });
    return result.success ? null : result.error.issues[0].message;
  }

  it("accepts closing after opening", () => {
    expect(hoursError("08:00", "19:00")).toBeNull();
  });

  it("rejects closing equal to or before opening", () => {
    expect(hoursError("09:00", "09:00")).toContain("posterior a la apertura");
    expect(hoursError("09:00", "08:00")).toContain("posterior a la apertura");
  });

  it("requires both times", () => {
    expect(hoursError("09:00", "")).toContain("obligatorios");
  });
});

describe("blackoutFormSchema (HU-4.1 @validation)", () => {
  function blackoutErrors(startDate: string, endDate: string) {
    const result = blackoutFormSchema.safeParse({ startDate, endDate, label: "" });
    return result.success ? [] : result.error.issues.map((i) => `${i.path[0]}: ${i.message}`);
  }

  it("accepts a single-day range", () => {
    expect(blackoutErrors("2026-12-24", "2026-12-24")).toEqual([]);
  });

  it("rejects an end date before the start date", () => {
    expect(blackoutErrors("2026-12-31", "2026-12-20")).toEqual([
      "endDate: La fecha final debe ser igual o posterior al inicio.",
    ]);
  });

  it("flags the missing field", () => {
    expect(blackoutErrors("", "2026-12-20")).toEqual(["startDate: Elegí una fecha de inicio."]);
    expect(blackoutErrors("2026-12-20", "")).toEqual(["endDate: Elegí una fecha de fin."]);
  });
});
