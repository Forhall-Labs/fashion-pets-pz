import { cleanup, renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useWaitingListPanel } from "./useWaitingListPanel";
import type { WaitingEntry } from "@/modules/shared/lib/waiting-list-api";

const NOW = Date.parse("2026-11-21T12:00:00Z");
const entry = (id: string, size: string, daysAgo: number, stale = false): WaitingEntry => ({
  id,
  petId: `p-${id}`,
  petName: id,
  ownerName: `Dueño ${id}`,
  size,
  createdAt: new Date(NOW - daysAgo * 86_400_000).toISOString(),
  preferredStartDate: null,
  preferredEndDate: null,
  staleReason: stale ? "Pendiente de limpieza" : null,
});

const list = vi.fn();
const remove = vi.fn();
vi.mock("@/modules/shared/lib/waiting-list-api", () => ({
  waitingListApi: {
    list: () => list(),
    remove: (...args: unknown[]) => remove(...args),
  },
}));
vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  cleanup();
  remove.mockReset();
});

describe("useWaitingListPanel", () => {
  it("puts whoever waited longest first, with a wait bar relative to them", async () => {
    list.mockResolvedValue([entry("Toby", "small", 10), entry("Luna", "extra_large", 60)]);
    const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((i) => [i.entry.petName, i.days])).toEqual([
      ["Luna", 60],
      ["Toby", 10],
    ]);
    expect(result.current.items[0]?.waitShare).toBe(1);
    expect(result.current.items[1]?.waitShare).toBeCloseTo(10 / 60);
  });

  it("lists entries pending cleanup last, even if they waited longer", async () => {
    list.mockResolvedValue([entry("Vieja", "small", 90, true), entry("Nueva", "small", 1)]);
    const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((i) => i.entry.petName)).toEqual(["Nueva", "Vieja"]);
  });

  it("uses a 30-day floor so a short wait doesn't look full", async () => {
    list.mockResolvedValue([entry("Toby", "small", 3)]);
    const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.waitShare).toBeCloseTo(0.1);
  });

  it("counts waiting pets by size, leaving stale entries out of the counts", async () => {
    list.mockResolvedValue([
      entry("A", "small", 5),
      entry("B", "small", 4),
      entry("C", "medium", 3, true),
    ]);
    const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(3));
    expect(result.current.bySize).toEqual([
      { size: "small", count: 2 },
      { size: "medium", count: 0 },
      { size: "extra_large", count: 0 },
    ]);
    expect(result.current.staleCount).toBe(1);
  });

  it("can be collapsed", async () => {
    list.mockResolvedValue([]);
    const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });
    expect(result.current.open).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.open).toBe(false);
  });

  describe("limpieza", () => {
    const stale = [entry("A", "small", 50, true), entry("B", "medium", 40, true)];

    it("removes a single entry pending cleanup", async () => {
      list.mockResolvedValue([...stale, entry("C", "small", 5)]);
      remove.mockResolvedValue(undefined);
      const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });
      await waitFor(() => expect(result.current.items).toHaveLength(3));

      act(() => result.current.removeOne("A"));

      await waitFor(() => expect(remove).toHaveBeenCalledWith("A"));
      expect(remove).toHaveBeenCalledTimes(1);
    });

    it("cleans every pending entry only after confirming, and never touches the rest", async () => {
      list.mockResolvedValue([...stale, entry("C", "small", 5)]);
      remove.mockResolvedValue(undefined);
      const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });
      await waitFor(() => expect(result.current.items).toHaveLength(3));

      act(() => result.current.askCleanupAll());
      expect(result.current.confirmingCleanup).toBe(true);
      expect(remove).not.toHaveBeenCalled();

      act(() => result.current.confirmCleanupAll());

      await waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
      expect(remove.mock.calls.map((c) => c[0]).sort()).toEqual(["A", "B"]);
      await waitFor(() => expect(result.current.confirmingCleanup).toBe(false));
    });

    it("reports how many could not be removed", async () => {
      list.mockResolvedValue(stale);
      remove.mockImplementation((id: string) =>
        id === "A" ? Promise.reject(new Error("x")) : Promise.resolve(undefined),
      );
      const { result } = renderHook(() => useWaitingListPanel(NOW), { wrapper });
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      act(() => result.current.askCleanupAll());
      act(() => result.current.confirmCleanupAll());

      await waitFor(() =>
        expect(result.current.cleanupError).toBe("No se pudo quitar 1 entrada. Probá de nuevo."),
      );
    });
  });
});
