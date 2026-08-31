import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOwnerDetail } from "./useOwnerDetail";

const getOwner = vi.fn();
const listPets = vi.fn();

vi.mock("@/modules/shared/lib/owners-api", () => ({
  ownersApi: { get: (...args: unknown[]) => getOwner(...args) },
}));

vi.mock("@/modules/shared/lib/pets-api", () => ({
  petsApi: { list: (...args: unknown[]) => listPets(...args) },
}));

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const OWNER = {
  id: "real-owner-uuid",
  name: "María Fernández",
  phone: "011-4000-0303",
  address: null,
  lat: null,
  lng: null,
  fixedVisitDay: null,
};

beforeEach(() => {
  getOwner.mockReset();
  listPets.mockReset();
});

describe("useOwnerDetail", () => {
  it("loads the owner and that owner's pets by ownerId", async () => {
    getOwner.mockResolvedValue(OWNER);
    listPets.mockResolvedValue({ data: [{ id: "p1", name: "Rex" }], total: 1, page: 1, limit: 1 });

    const { result } = renderHook(() => useOwnerDetail(OWNER.id), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getOwner).toHaveBeenCalledWith(OWNER.id);
    expect(listPets).toHaveBeenCalledWith({ ownerId: OWNER.id });
    expect(result.current.owner?.name).toBe("María Fernández");
    expect(result.current.pets.map((p) => p.name)).toEqual(["Rex"]);
  });

  it("degrades to no upcoming appointments and no WhatsApp link for a real owner id", async () => {
    getOwner.mockResolvedValue(OWNER);
    listPets.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    const { result } = renderHook(() => useOwnerDetail(OWNER.id), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // El id real nunca matchea mockData, así que esto degrada a vacío en vez
    // de mostrar datos falsos de otro dueño — ver el comentario en useOwnerDetail.ts.
    expect(result.current.upcoming).toEqual([]);
    expect(result.current.waLink).toBeNull();
  });

  it("marks notFound on a 404 without leaving loading stuck", async () => {
    const { ApiError } = await import("@/modules/shared/lib/api-client");
    getOwner.mockRejectedValue(new ApiError(404, ["Owner x not found"]));
    listPets.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    const { result } = renderHook(() => useOwnerDetail("missing"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.owner).toBeNull();
  });

  it("opens and closes the appointment modal", async () => {
    getOwner.mockResolvedValue(OWNER);
    listPets.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    const { result } = renderHook(() => useOwnerDetail(OWNER.id), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.openAppointment("a1"));
    expect(result.current.openAppointmentId).toBe("a1");

    act(() => result.current.closeAppointment());
    expect(result.current.openAppointmentId).toBeNull();
  });
});
