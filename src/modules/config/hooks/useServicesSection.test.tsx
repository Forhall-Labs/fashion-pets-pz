import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useServicesSection } from "./useServicesSection";
import type { Service } from "@/modules/shared/types";

const BATH: Service = {
  id: "svc-bath",
  name: "Baño",
  durationSmallMinutes: 30,
  durationMediumMinutes: 45,
  durationExtraLargeMinutes: 60,
  active: true,
};

const list = vi.fn();
const create = vi.fn();
const update = vi.fn();

vi.mock("@/modules/shared/lib/services-api", () => ({
  servicesApi: {
    list: () => list(),
    create: (...args: unknown[]) => create(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));
vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent;

beforeEach(() => {
  list.mockReset().mockResolvedValue([BATH]);
  create.mockReset().mockResolvedValue({ ...BATH, id: "new" });
  update.mockReset().mockResolvedValue(BATH);
});
afterEach(() => cleanup());

describe("useServicesSection (Épica 8)", () => {
  it("creates a service with its three durations as numbers", async () => {
    const { result } = renderHook(() => useServicesSection(), { wrapper });
    await waitFor(() => expect(result.current.services).toHaveLength(1));

    act(() => result.current.openNew());
    act(() => {
      result.current
        .register("name")
        .onChange({ target: { value: "Corte de uñas", name: "name" } });
      result.current
        .register("durationSmallMinutes")
        .onChange({ target: { value: "10", name: "durationSmallMinutes" } });
      result.current
        .register("durationMediumMinutes")
        .onChange({ target: { value: "10", name: "durationMediumMinutes" } });
      result.current
        .register("durationExtraLargeMinutes")
        .onChange({ target: { value: "15", name: "durationExtraLargeMinutes" } });
    });
    await act(async () => {
      await result.current.handleSubmit(submitEvent());
    });

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0]?.[0]).toEqual({
      name: "Corte de uñas",
      durationSmallMinutes: 10,
      durationMediumMinutes: 10,
      durationExtraLargeMinutes: 15,
    });
    await waitFor(() => expect(result.current.editing).toBeNull());
  });

  it("edits an existing service in place", async () => {
    const { result } = renderHook(() => useServicesSection(), { wrapper });
    await waitFor(() => expect(result.current.services).toHaveLength(1));

    act(() => result.current.openEdit(BATH));
    await act(async () => {
      await result.current.handleSubmit(submitEvent());
    });

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0]?.[0]).toBe("svc-bath");
    expect(create).not.toHaveBeenCalled();
  });

  it("deactivates instead of deleting", async () => {
    const { result } = renderHook(() => useServicesSection(), { wrapper });
    await waitFor(() => expect(result.current.services).toHaveLength(1));

    act(() => result.current.toggleActive(BATH));

    await waitFor(() => expect(update).toHaveBeenCalledWith("svc-bath", { active: false }));
  });

  it("shows the API error, e.g. a duplicate name", async () => {
    create.mockRejectedValue(new Error('Ya existe un servicio llamado "Baño".'));
    const { result } = renderHook(() => useServicesSection(), { wrapper });
    await waitFor(() => expect(result.current.services).toHaveLength(1));

    act(() => result.current.openNew());
    act(() => {
      result.current.register("name").onChange({ target: { value: "baño", name: "name" } });
      for (const f of [
        "durationSmallMinutes",
        "durationMediumMinutes",
        "durationExtraLargeMinutes",
      ] as const) {
        result.current.register(f).onChange({ target: { value: "30", name: f } });
      }
    });
    await act(async () => {
      await result.current.handleSubmit(submitEvent());
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.editing).toBe("new");
  });
});
