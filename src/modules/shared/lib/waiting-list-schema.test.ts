import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { waitingListFormSchema } from "./waiting-list-schema";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-02T12:00:00"));
});
afterEach(() => vi.useRealTimers());

const parse = (
  v: Partial<{ petId: string; preferredStartDate: string; preferredEndDate: string }>,
) =>
  waitingListFormSchema.safeParse({
    petId: "p1",
    preferredStartDate: "",
    preferredEndDate: "",
    ...v,
  });

describe("waitingListFormSchema (HU-5.1)", () => {
  it("accepts an open-ended entry", () => {
    expect(parse({}).success).toBe(true);
  });

  it("requires a pet", () => {
    expect(parse({ petId: "" }).success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = parse({ preferredStartDate: "2026-11-20", preferredEndDate: "2026-11-10" });
    expect(result.error?.issues[0]?.message).toMatch(/anterior a la inicial/);
  });

  it("rejects a range entirely in the past", () => {
    const result = parse({ preferredStartDate: "2026-10-01", preferredEndDate: "2026-10-31" });
    expect(result.error?.issues[0]?.message).toMatch(/fecha futura/);
  });
});
