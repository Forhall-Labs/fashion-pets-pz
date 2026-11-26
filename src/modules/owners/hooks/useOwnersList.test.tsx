import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOwnersList } from "./useOwnersList";

const list = vi.fn();

vi.mock("@/modules/shared/lib/owners-api", () => ({
  ownersApi: { list: (...args: unknown[]) => list(...args) },
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

beforeEach(() => {
  list.mockReset();
});

describe("useOwnersList", () => {
  it("loads the first page with the default page size", async () => {
    list.mockResolvedValue({
      data: [
        {
          id: "o1",
          name: "María Fernández",
          phone: "011-4000-0303",
          address: null,
          lat: null,
          lng: null,
          fixedVisitDay: null,
          petCount: 2,
        },
      ],
      total: 45,
      page: 1,
      limit: 20,
    });

    const { result } = renderHook(() => useOwnersList(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(list).toHaveBeenCalledWith({ page: 1, limit: 20, q: undefined });
    expect(result.current.owners).toHaveLength(1);
    expect(result.current.total).toBe(45);
    expect(result.current.totalPages).toBe(3);
  });

  it("debounces the search box before querying with q", async () => {
    list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    const { result } = renderHook(() => useOwnersList(), { wrapper: createWrapper() });
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    act(() => result.current.setQuery("diego"));
    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 20, q: undefined });

    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 20, q: "diego" }));
  });

  it("resets to page 1 when the search query changes", async () => {
    list.mockResolvedValue({ data: [], total: 0, page: 2, limit: 20 });
    const { result } = renderHook(() => useOwnersList(), { wrapper: createWrapper() });
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.setQuery("lucía"));
    await waitFor(() => expect(result.current.page).toBe(1));
  });

  it("surfaces a Spanish error message when the request fails", async () => {
    list.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useOwnersList(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).toBe("No se pudieron cargar los dueños."));
  });
});
