import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useAppointmentDetailModal } from "./useAppointmentDetailModal";

const getAppointment = vi.fn();
const getPet = vi.fn();
const getOwner = vi.fn();

vi.mock("../lib/appointments-api", () => ({
  appointmentsApi: { get: (...args: unknown[]) => getAppointment(...args) },
}));
vi.mock("../lib/pets-api", () => ({
  petsApi: { get: (...args: unknown[]) => getPet(...args) },
}));
vi.mock("../lib/owners-api", () => ({
  ownersApi: { get: (...args: unknown[]) => getOwner(...args) },
}));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("../lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

const push = vi.fn();
const onClose = vi.fn();

const APPT = {
  id: "a1",
  petId: "p1",
  date: "2026-03-10",
  startTime: "10:00",
  durationMinutes: 60,
  serviceType: "full_groom",
  status: "scheduled",
  source: "manual",
  flaggedReason: null,
};
const PET = {
  id: "p1",
  ownerId: "o1",
  name: "Rex",
  breed: "Labrador",
  size: "medium",
  isAggressive: false,
  groomingFrequency: null,
  needsPickup: false,
  locationAddress: null,
  lat: null,
  lng: null,
  avgServiceDuration: 60,
};
const OWNER = {
  id: "o1",
  name: "María Fernández",
  phone: "01140000303",
  address: null,
  lat: null,
  lng: null,
  fixedVisitDay: null,
};

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

async function importApiError() {
  return (await import("../lib/api-client")).ApiError;
}

beforeEach(() => {
  getAppointment.mockReset();
  getPet.mockReset();
  getOwner.mockReset();
  push.mockClear();
  onClose.mockClear();
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

describe("useAppointmentDetailModal", () => {
  it("resolves the appointment, pet, owner and a WhatsApp link", async () => {
    getAppointment.mockResolvedValue(APPT);
    getPet.mockResolvedValue(PET);
    getOwner.mockResolvedValue(OWNER);

    const { result } = renderHook(() => useAppointmentDetailModal("a1", onClose), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.appt?.id).toBe("a1");
    expect(result.current.pet?.name).toBe("Rex");
    expect(result.current.owner?.name).toBe("María Fernández");
    expect(result.current.waLink).toContain("wa.me");
    expect(result.current.notFound).toBe(false);
  });

  it("marks notFound when the appointment itself is gone (404)", async () => {
    const ApiError = await importApiError();
    getAppointment.mockRejectedValue(new ApiError(404, ["Appointment x not found"]));

    const { result } = renderHook(() => useAppointmentDetailModal("gone", onClose), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(getPet).not.toHaveBeenCalled();
  });

  it("marks notFound when the referenced pet was deleted", async () => {
    const ApiError = await importApiError();
    getAppointment.mockResolvedValue(APPT);
    getPet.mockRejectedValue(new ApiError(404, ["Pet x not found"]));

    const { result } = renderHook(() => useAppointmentDetailModal("a1", onClose), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(getOwner).not.toHaveBeenCalled();
  });

  it("degrades only the owner section when the owner fails to load, keeping the rest usable", async () => {
    getAppointment.mockResolvedValue(APPT);
    getPet.mockResolvedValue(PET);
    getOwner.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAppointmentDetailModal("a1", onClose), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.ownerSectionError).toBe(true));
    expect(result.current.notFound).toBe(false);
    expect(result.current.pet?.name).toBe("Rex");
    expect(result.current.waLink).toBeNull();
  });

  it("closes the modal and navigates to the owner's page", async () => {
    getAppointment.mockResolvedValue(APPT);
    getPet.mockResolvedValue(PET);
    getOwner.mockResolvedValue(OWNER);

    const { result } = renderHook(() => useAppointmentDetailModal("a1", onClose), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.owner?.id).toBe("o1"));

    result.current.goToOwner();

    expect(onClose).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/owners/o1");
  });
});
