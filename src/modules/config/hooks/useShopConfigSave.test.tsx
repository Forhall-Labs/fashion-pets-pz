import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useShopConfigSave } from "./useShopConfigSave";

const impact = vi.fn();
const update = vi.fn();

vi.mock("@/modules/shared/lib/shop-config-api", () => ({
  shopConfigApi: {
    impact: (...args: unknown[]) => impact(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const CONFIG = {
  maxPetsPerDay: 7,
  quickServiceDurationMinutes: 30,
  openTime: "09:00",
  closeTime: "17:00",
};
const OUT_OF_HOURS = {
  id: "a1",
  petId: "p1",
  petName: "Rex",
  date: "2026-10-01",
  startTime: "17:30",
  durationMinutes: 60,
};
const BUSY_DAY = { date: "2026-10-05", count: 9 };

beforeEach(() => {
  impact.mockReset();
  update.mockReset();
  update.mockResolvedValue(CONFIG);
});

describe("useShopConfigSave", () => {
  it("saves straight away when the change affects no appointment", async () => {
    impact.mockResolvedValue({ outOfHours: [], overCapacityDays: [] });
    const { result } = renderHook(() => useShopConfigSave("capacity"), {
      wrapper: createWrapper(),
    });

    await act(() => result.current.submit({ maxPetsPerDay: 10 }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ maxPetsPerDay: 10 }, expect.anything()),
    );
    await waitFor(() => expect(result.current.saved).toBe(true));
  });

  it("warns (without saving) when lowering capacity below a day's bookings, and saves only on confirm", async () => {
    impact.mockResolvedValue({ outOfHours: [], overCapacityDays: [BUSY_DAY] });
    const { result } = renderHook(() => useShopConfigSave("capacity"), {
      wrapper: createWrapper(),
    });

    await act(() => result.current.submit({ maxPetsPerDay: 7 }));

    expect(result.current.pending?.impact.overCapacityDays).toEqual([BUSY_DAY]);
    expect(update).not.toHaveBeenCalled();

    act(() => result.current.confirmPending());
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
  });

  it("only reports what the section changes: capacity ignores out-of-hours appointments", async () => {
    impact.mockResolvedValue({ outOfHours: [OUT_OF_HOURS], overCapacityDays: [] });
    const { result } = renderHook(() => useShopConfigSave("capacity"), {
      wrapper: createWrapper(),
    });

    await act(() => result.current.submit({ maxPetsPerDay: 10 }));

    expect(result.current.pending).toBeNull();
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
  });

  it("warns when narrowing hours leaves an appointment outside them", async () => {
    impact.mockResolvedValue({ outOfHours: [OUT_OF_HOURS], overCapacityDays: [BUSY_DAY] });
    const { result } = renderHook(() => useShopConfigSave("hours"), { wrapper: createWrapper() });

    await act(() => result.current.submit({ openTime: "09:00", closeTime: "17:00" }));

    expect(result.current.pending?.impact).toEqual({
      outOfHours: [OUT_OF_HOURS],
      overCapacityDays: [],
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("offers a manual re-scan when the impact scan fails", async () => {
    impact.mockRejectedValueOnce(new Error("down"));
    const { result } = renderHook(() => useShopConfigSave("hours"), { wrapper: createWrapper() });

    await act(() => result.current.submit({ openTime: "08:00", closeTime: "18:00" }));
    expect(result.current.scanFailed).toBe(true);
    expect(update).not.toHaveBeenCalled();

    impact.mockResolvedValue({ outOfHours: [], overCapacityDays: [] });
    act(() => result.current.retryScan());
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(result.current.scanFailed).toBe(false);
  });

  it("surfaces a save failure and keeps the previous value (no cache write)", async () => {
    impact.mockResolvedValue({ outOfHours: [], overCapacityDays: [] });
    update.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useShopConfigSave("capacity"), {
      wrapper: createWrapper(),
    });

    await act(() => result.current.submit({ maxPetsPerDay: 10 }));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.saved).toBe(false);
  });
});
