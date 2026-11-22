import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { FULL_GROOM, useAppointmentForm } from "./useAppointmentForm";
import type { Appointment, Pet, Service } from "../types";

const LUNA: Pet = {
  id: "pet-luna",
  ownerId: "o1",
  name: "Luna",
  breed: "Poodle",
  size: "medium",
  isAggressive: false,
  groomingFrequency: "once_a_month",
  needsPickup: false,
  locationAddress: null,
  lat: null,
  lng: null,
  avgServiceDuration: 90,
};
const BATH: Service = {
  id: "svc-bath",
  name: "Baño",
  durationSmallMinutes: 30,
  durationMediumMinutes: 45,
  durationExtraLargeMinutes: 60,
  active: true,
};
const OLD: Service = { ...BATH, id: "svc-old", name: "Deslanado", active: false };

const create = vi.fn();

vi.mock("./usePetOptions", () => ({
  usePetOptions: () => ({
    pets: [LUNA],
    ownersById: new Map(),
    petOptions: [{ id: LUNA.id, label: "Luna" }],
    loading: false,
    error: false,
  }),
}));
vi.mock("../lib/services-api", () => ({
  servicesApi: { list: () => Promise.resolve([BATH, OLD]) },
}));
vi.mock("../lib/shop-config-api", () => ({
  shopConfigApi: {
    get: () =>
      Promise.resolve({
        maxPetsPerDay: 8,
        openTime: "08:00",
        closeTime: "18:00",
        openWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      }),
  },
}));
vi.mock("../lib/appointments-api", () => ({
  appointmentsApi: {
    create: (...args: unknown[]) => create(...args),
    update: vi.fn(),
  },
}));
vi.mock("../lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderForm(appointment: Appointment | null = null) {
  const hook = renderHook(() => useAppointmentForm({ appointment, onClose: vi.fn() }), { wrapper });
  await waitFor(() => expect(hook.result.current.serviceOptions.length).toBeGreaterThan(1));
  return hook;
}

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({ id: "new" });
});
afterEach(() => cleanup());

describe("useAppointmentForm — servicio (Épica 8)", () => {
  it("offers full groom plus the active catalog services", async () => {
    const { result } = await renderForm();
    expect(result.current.serviceOptions.map((o) => o.label)).toEqual([
      "Grooming completo",
      "Baño",
    ]);
  });

  it("suggests the catalog duration for the pet's size, and sends the service id", async () => {
    const { result } = await renderForm();

    act(() => result.current.handlePetChange(LUNA.id));
    act(() => result.current.handleServiceChange(BATH.id));
    act(() => {
      result.current.register("date").onChange({ target: { value: "2026-12-10", name: "date" } });
      result.current
        .register("startTime")
        .onChange({ target: { value: "09:00", name: "startTime" } });
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      durationMinutes: 45,
      serviceType: "quick_service",
      serviceId: BATH.id,
    });
  });

  it("uses the pet's own duration for a full groom", async () => {
    const { result } = await renderForm();

    act(() => result.current.handleServiceChange(BATH.id));
    act(() => result.current.handlePetChange(LUNA.id));
    act(() => result.current.handleServiceChange(FULL_GROOM));
    act(() => {
      result.current.register("date").onChange({ target: { value: "2026-12-10", name: "date" } });
      result.current
        .register("startTime")
        .onChange({ target: { value: "09:00", name: "startTime" } });
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      durationMinutes: 90,
      serviceType: "full_groom",
      serviceId: null,
    });
  });

  it("keeps showing a deactivated service the appointment already had", async () => {
    const appt: Appointment = {
      id: "a1",
      petId: LUNA.id,
      date: "2026-12-10",
      startTime: "09:00",
      durationMinutes: 40,
      serviceType: "quick_service",
      serviceId: OLD.id,
      status: "scheduled",
      source: "manual",
      flaggedReason: null,
    };
    const { result } = await renderForm(appt);

    expect(result.current.service).toBe(OLD.id);
    expect(result.current.serviceOptions.map((o) => o.label)).toContain("Deslanado (desactivado)");
  });

  it("blocks a Sunday with the shop's message (2026-12-13 es domingo)", async () => {
    const { result } = await renderForm();

    act(() => {
      result.current.register("date").onChange({ target: { value: "2026-12-13", name: "date" } });
    });

    await waitFor(() =>
      expect(result.current.closedDayError).toBe(
        "La tienda no atiende los domingos. Elegí otro día.",
      ),
    );
  });
});
