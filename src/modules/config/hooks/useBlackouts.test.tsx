import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useBlackouts } from "./useBlackouts";

const api = {
  list: vi.fn(),
  conflicts: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

vi.mock("@/modules/shared/lib/blackout-periods-api", () => ({
  blackoutPeriodsApi: {
    list: () => api.list(),
    conflicts: (...args: unknown[]) => api.conflicts(...args),
    create: (...args: unknown[]) => api.create(...args),
    update: (...args: unknown[]) => api.update(...args),
    remove: (...args: unknown[]) => api.remove(...args),
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

const NEXT_YEAR = new Date().getFullYear() + 1;
const START = `${NEXT_YEAR}-12-20`;
const END = `${NEXT_YEAR}-12-31`;
const EXISTING = {
  id: "b1",
  startDate: `${NEXT_YEAR}-12-28`,
  endDate: `${NEXT_YEAR + 1}-01-05`,
  label: "Fin de año",
};
const APPT = {
  id: "a1",
  petId: "p1",
  petName: "Rex",
  date: `${NEXT_YEAR}-12-22`,
  startTime: "09:00:00",
};
const NO_CONFLICTS = { appointments: [], overlappingPeriods: [] };
const SAVED = { period: { id: "new" }, resolved: 0, failed: [] };

async function fillAndSubmit(
  result: { current: ReturnType<typeof useBlackouts> },
  values: { startDate: string; endDate: string; label?: string },
) {
  await act(async () => {
    const form = result.current;
    // react-hook-form: registrar valores vía onChange de register()
    for (const [name, value] of Object.entries({ label: "", ...values })) {
      await form
        .register(name as "startDate" | "endDate" | "label")
        .onChange({ target: { name, value } });
    }
  });
  await act(async () => {
    await result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as React.BaseSyntheticEvent);
  });
}

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.list.mockResolvedValue([]);
});

describe("useBlackouts (HU-4.1)", () => {
  it("saves directly when there are no conflicts", async () => {
    api.conflicts.mockResolvedValue(NO_CONFLICTS);
    api.create.mockResolvedValue(SAVED);
    const { result } = renderHook(() => useBlackouts(), { wrapper: createWrapper() });

    await fillAndSubmit(result, { startDate: START, endDate: END, label: "Vacaciones" });

    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    expect(api.create.mock.calls[0][0]).toMatchObject({
      startDate: START,
      endDate: END,
      label: "Vacaciones",
    });
    expect(api.create.mock.calls[0][0].conflictResolution).toBeUndefined();
  });

  it("asks what to do with conflicting appointments, then saves with the chosen resolution", async () => {
    api.conflicts.mockResolvedValue({ appointments: [APPT], overlappingPeriods: [] });
    api.create.mockResolvedValue(SAVED);
    const { result } = renderHook(() => useBlackouts(), { wrapper: createWrapper() });

    await fillAndSubmit(result, { startDate: START, endDate: END });

    await waitFor(() => expect(result.current.step?.type).toBe("appointments"));
    expect(api.create).not.toHaveBeenCalled();

    act(() => result.current.resolveAppointments("cancel"));
    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    expect(api.create.mock.calls[0][0].conflictResolution).toBe("cancel");
  });

  it("offers to merge an overlapping period, and merging patches the existing one with the union", async () => {
    api.conflicts
      .mockResolvedValueOnce({ appointments: [], overlappingPeriods: [EXISTING] })
      .mockResolvedValueOnce(NO_CONFLICTS);
    api.update.mockResolvedValue(SAVED);
    const { result } = renderHook(() => useBlackouts(), { wrapper: createWrapper() });

    await fillAndSubmit(result, { startDate: START, endDate: END });
    await waitFor(() => expect(result.current.step?.type).toBe("overlap"));

    act(() => result.current.mergeOverlap());
    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
    expect(api.update).toHaveBeenCalledWith(
      "b1",
      expect.objectContaining({ startDate: START, endDate: EXISTING.endDate, label: "Fin de año" }),
    );
    expect(api.create).not.toHaveBeenCalled();
  });

  it("warns before saving a range entirely in the past", async () => {
    const { result } = renderHook(() => useBlackouts(), { wrapper: createWrapper() });

    await fillAndSubmit(result, { startDate: "2020-01-01", endDate: "2020-01-05" });

    expect(result.current.step?.type).toBe("past");
    expect(api.conflicts).not.toHaveBeenCalled();
  });

  it("reports appointments whose resolution failed after the period was saved", async () => {
    api.conflicts.mockResolvedValue({ appointments: [APPT], overlappingPeriods: [] });
    api.create.mockResolvedValue({ ...SAVED, resolved: 0, failed: ["a1"] });
    const { result } = renderHook(() => useBlackouts(), { wrapper: createWrapper() });

    await fillAndSubmit(result, { startDate: START, endDate: END });
    await waitFor(() => expect(result.current.step?.type).toBe("appointments"));
    act(() => result.current.resolveAppointments("keep"));

    await waitFor(() =>
      expect(result.current.step).toEqual({ type: "partial-failure", failed: 1 }),
    );
  });
});
