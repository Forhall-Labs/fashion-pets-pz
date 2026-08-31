import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOwnerForm } from "./useOwnerForm";
import type { Owner } from "@/modules/shared/types";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

const create = vi.fn();
const update = vi.fn();

vi.mock("@/modules/shared/lib/owners-api", () => ({
  ownersApi: {
    create: (...args: unknown[]) => create(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

const push = vi.fn();

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const EXISTING: Owner = {
  id: "o1",
  name: "Juan Pérez",
  phone: "011-1234-5678",
  address: null,
  lat: null,
  lng: null,
  fixedVisitDay: null,
};

function fakeSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  push.mockClear();
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

describe("useOwnerForm", () => {
  it("creates a new owner with the entered data", async () => {
    create.mockResolvedValue({ ...EXISTING, id: "new" });
    const onSaved = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(() => useOwnerForm({ existingOwners: [], onSaved, onClose }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setValue("name", "María López");
      result.current.setValue("phone", "011-9999-0000");
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({
      name: "María López",
      phone: "011-9999-0000",
    });
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("blocks submit and shows inline errors on an empty name", async () => {
    const { result } = renderHook(() => useOwnerForm({ existingOwners: [], onClose: vi.fn() }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setValue("phone", "011-9999-0000");
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    expect(result.current.errors.name).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it("warns on a duplicate name+phone instead of creating immediately", async () => {
    const { result } = renderHook(
      () => useOwnerForm({ existingOwners: [EXISTING], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.setValue("name", EXISTING.name);
      result.current.setValue("phone", EXISTING.phone);
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    expect(result.current.conflict).toEqual({ type: "duplicate", existing: EXISTING });
    expect(create).not.toHaveBeenCalled();

    create.mockResolvedValue({ ...EXISTING, id: "new" });
    await act(async () => {
      result.current.confirmConflict();
    });
    await waitFor(() => expect(create).toHaveBeenCalled());
  });

  it("warns when the phone is already used by a different owner", async () => {
    const { result } = renderHook(
      () => useOwnerForm({ existingOwners: [EXISTING], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.setValue("name", "Otro Nombre");
      result.current.setValue("phone", EXISTING.phone);
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    expect(result.current.conflict).toEqual({ type: "shared-phone", existing: EXISTING });
    expect(create).not.toHaveBeenCalled();
  });

  it("cancelling a conflict does not create the owner", async () => {
    const { result } = renderHook(
      () => useOwnerForm({ existingOwners: [EXISTING], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.setValue("name", EXISTING.name);
      result.current.setValue("phone", EXISTING.phone);
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    act(() => result.current.cancelConflict());
    expect(result.current.conflict).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not run the duplicate check when editing", async () => {
    update.mockResolvedValue(EXISTING);
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useOwnerForm({ owner: EXISTING, existingOwners: [EXISTING], onClose }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(result.current.conflict).toBeNull();
  });
});
