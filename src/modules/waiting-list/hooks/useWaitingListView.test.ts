import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWaitingListView } from "./useWaitingListView";

describe("useWaitingListView", () => {
  it("lists only active entries, oldest first, with pet/owner resolved and days waited", () => {
    const { result } = renderHook(() => useWaitingListView());

    expect(result.current.active.map((w) => w.id)).toEqual(["w1", "w2", "w3"]);
    expect(result.current.active.map((w) => w.waitingDays)).toEqual([10, 5, 2]);

    const first = result.current.active[0];
    expect(first.pet.name).toBe("Coco");
    expect(first.owner.name).toBe("Diego Torres");
  });
});
