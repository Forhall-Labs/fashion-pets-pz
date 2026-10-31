import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useSlotRecommendation } from "./useSlotRecommendation";

const getPet = vi.fn();
const listPets = vi.fn();
const listOwners = vi.fn();
const recommendations = vi.fn();
const listWaiting = vi.fn();
const approve = vi.fn();
const createAppointment = vi.fn();

vi.mock("../lib/pets-api", () => ({
  petsApi: {
    get: (...a: unknown[]) => getPet(...a),
    list: (...a: unknown[]) => listPets(...a),
  },
}));
vi.mock("../lib/owners-api", () => ({
  ownersApi: { list: (...a: unknown[]) => listOwners(...a) },
}));
vi.mock("../lib/waiting-list-api", () => ({
  waitingListApi: {
    recommendations: (...a: unknown[]) => recommendations(...a),
    list: (...a: unknown[]) => listWaiting(...a),
    approve: (...a: unknown[]) => approve(...a),
  },
}));
vi.mock("../lib/appointments-api", () => ({
  appointmentsApi: { create: (...a: unknown[]) => createAppointment(...a) },
}));
vi.mock("../lib/supabase-client", () => ({
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

const SLOT = { date: "2026-11-13", startTime: "09:00", durationMinutes: 60, previousPetId: "gone" };
const REX = {
  id: "e-rex",
  petId: "p-rex",
  petName: "Rex",
  ownerName: "María",
  size: "medium",
  createdAt: "2026-09-01T12:00:00Z",
  preferredStartDate: null,
  preferredEndDate: null,
};
const BELLA = {
  ...REX,
  id: "e-bella",
  petId: "p-bella",
  petName: "Bella",
  createdAt: "2026-10-01T12:00:00Z",
};
const PETS = [
  { id: "p-rex", name: "Rex", size: "medium", ownerId: "o1" },
  { id: "p-luna", name: "Luna", size: "small", ownerId: "o1" },
  { id: "p-max", name: "Max", size: "medium", ownerId: "o1" },
];

beforeEach(() => {
  vi.clearAllMocks();
  getPet.mockResolvedValue({ id: "gone", size: "medium" });
  listPets.mockResolvedValue({ data: PETS, total: 3, page: 1, limit: 100 });
  listOwners.mockResolvedValue({
    data: [{ id: "o1", name: "María" }],
    total: 1,
    page: 1,
    limit: 100,
  });
  listWaiting.mockResolvedValue([REX, BELLA]);
  recommendations.mockResolvedValue({
    status: "match",
    ranked: true,
    candidates: [REX, BELLA],
    flagged: [],
  });
  approve.mockResolvedValue({ appointment: {}, staleReason: null });
  createAppointment.mockResolvedValue({});
});

async function render() {
  const onDone = vi.fn();
  const hook = renderHook(() => useSlotRecommendation(SLOT, onDone), { wrapper: createWrapper() });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return { ...hook, onDone };
}

describe("useSlotRecommendation (HU-5.2/5.3)", () => {
  it("asks for candidates matching the size of the pet that held the slot", async () => {
    await render();
    expect(recommendations).toHaveBeenCalledWith({ date: "2026-11-13", size: "medium" });
  });

  it("approves the top recommendation into the vacated slot", async () => {
    const { result, onDone } = await render();
    expect(result.current.chosenId).toBe("e-rex");

    act(() => result.current.approve());

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(approve).toHaveBeenCalledWith("e-rex", {
      date: "2026-11-13",
      startTime: "09:00",
      durationMinutes: 60,
    });
  });

  it("approves an alternate candidate instead of the top one", async () => {
    const { result } = await render();
    act(() => result.current.select("e-bella"));
    act(() => result.current.approve());
    await waitFor(() => expect(approve).toHaveBeenCalledWith("e-bella", expect.anything()));
  });

  it("leaves the slot open without booking anything", async () => {
    const { result, onDone } = await render();
    act(() => result.current.leaveOpen());
    expect(onDone).toHaveBeenCalled();
    expect(approve).not.toHaveBeenCalled();
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("shows the server's reason and keeps the modal open when approval is rejected", async () => {
    const { ApiError } = await import("../lib/api-client");
    approve.mockRejectedValue(new ApiError(409, ["El lugar ya no está disponible: capacidad."]));
    const { result, onDone } = await render();

    act(() => result.current.approve());

    await waitFor(() => expect(result.current.error).toMatch(/ya no está disponible/));
    expect(onDone).not.toHaveBeenCalled();
  });

  it("reports a booking that left the entry stale instead of closing", async () => {
    approve.mockResolvedValue({ appointment: {}, staleReason: "Pendiente de limpieza" });
    const { result, onDone } = await render();
    act(() => result.current.approve());
    await waitFor(() => expect(result.current.staleReason).toBe("Pendiente de limpieza"));
    expect(onDone).not.toHaveBeenCalled();
  });

  it("goes to manual review when the previous pet's size can't be known", async () => {
    getPet.mockRejectedValue(new Error("404"));
    await render();
    expect(recommendations).toHaveBeenCalledWith({ date: "2026-11-13", size: null });
  });

  it("books a waiting-list pet manually through approval, so it leaves the list", async () => {
    const { result, onDone } = await render();
    act(() => result.current.startManual());
    act(() => result.current.chooseManualPet("p-rex"));
    act(() => result.current.bookManually());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(approve).toHaveBeenCalledWith("e-rex", expect.anything());
  });

  it("books a pet not on the waiting list directly", async () => {
    const { result, onDone } = await render();
    act(() => result.current.startManual());
    act(() => result.current.chooseManualPet("p-max"));
    act(() => result.current.bookManually());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ petId: "p-max", date: "2026-11-13", flaggedReason: null }),
      expect.any(String),
    );
  });

  it("requires explicit confirmation for a size mismatch, then flags the exception", async () => {
    const { result, onDone } = await render();
    act(() => result.current.startManual());
    act(() => result.current.chooseManualPet("p-luna"));
    expect(result.current.sizeMismatch).toBe(true);

    act(() => result.current.bookManually());
    expect(result.current.error).toMatch(/no coincide/);
    expect(createAppointment).not.toHaveBeenCalled();

    act(() => result.current.setMismatchConfirmed(true));
    act(() => result.current.bookManually());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        petId: "p-luna",
        flaggedReason: expect.stringMatching(/^Excepción de tamaño/),
      }),
      expect.any(String),
    );
  });

  it("keeps the slot unbooked when the manual booking fails", async () => {
    createAppointment.mockRejectedValue(new Error("down"));
    const { result, onDone } = await render();
    act(() => result.current.startManual());
    act(() => result.current.chooseManualPet("p-max"));
    act(() => result.current.bookManually());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(onDone).not.toHaveBeenCalled();
  });
});
