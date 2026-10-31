import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type { WaitingEntry } from "@/modules/shared/lib/waiting-list-api";

import { useWaitingListForm } from "./useWaitingListForm";
import { useWaitingListView, waitingDays } from "./useWaitingListView";

const list = vi.fn();
const create = vi.fn();
const remove = vi.fn();
const suggestedRange = vi.fn();
const listPets = vi.fn();
const listOwners = vi.fn();

vi.mock("@/modules/shared/lib/waiting-list-api", () => ({
  waitingListApi: {
    list: (...a: unknown[]) => list(...a),
    create: (...a: unknown[]) => create(...a),
    update: vi.fn(),
    remove: (...a: unknown[]) => remove(...a),
    suggestedRange: (...a: unknown[]) => suggestedRange(...a),
  },
}));
vi.mock("@/modules/shared/lib/pets-api", () => ({
  petsApi: { list: (...a: unknown[]) => listPets(...a) },
}));
vi.mock("@/modules/shared/lib/owners-api", () => ({
  ownersApi: { list: (...a: unknown[]) => listOwners(...a) },
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

const REX: WaitingEntry = {
  id: "e1",
  petId: "p-rex",
  petName: "Rex",
  ownerName: "María",
  size: "medium",
  createdAt: "2026-10-01T12:00:00Z",
  preferredStartDate: null,
  preferredEndDate: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue([REX]);
  listPets.mockResolvedValue({
    data: [
      { id: "p-rex", name: "Rex", size: "medium", ownerId: "o1" },
      { id: "p-luna", name: "Luna", size: "small", ownerId: "o1" },
      { id: "p-nosize", name: "Pelusa", size: "", ownerId: "o1" },
    ],
    total: 3,
    page: 1,
    limit: 100,
  });
  listOwners.mockResolvedValue({
    data: [{ id: "o1", name: "María" }],
    total: 1,
    page: 1,
    limit: 100,
  });
  suggestedRange.mockResolvedValue(null);
  create.mockResolvedValue({});
});

describe("useWaitingListView (HU-5.1)", () => {
  it("lists active entries with their size", async () => {
    const { result } = renderHook(() => useWaitingListView(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.entries[0]).toMatchObject({ petName: "Rex", size: "medium" });
  });

  it("removes an entry from the list", async () => {
    remove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useWaitingListView(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.remove("e1"));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("e1", expect.anything()));
  });

  it("counts days waiting", () => {
    expect(waitingDays("2026-10-01T12:00:00Z", Date.parse("2026-10-11T12:00:00Z"))).toBe(10);
  });
});

describe("useWaitingListForm (HU-5.1)", () => {
  function renderForm(entry: WaitingEntry | null = null) {
    const onClose = vi.fn();
    const onEditExisting = vi.fn();
    const hook = renderHook(
      () => useWaitingListForm({ entry, existing: [REX], onEditExisting, onClose }),
      { wrapper: createWrapper() },
    );
    return { ...hook, onClose, onEditExisting };
  }

  it("adds a pet with an open-ended range, sending an idempotency key", async () => {
    const { result, onClose } = renderForm();
    await waitFor(() => expect(result.current.petsLoading).toBe(false));
    await act(() => result.current.choosePet("p-luna"));
    await act(() => result.current.submit());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      { petId: "p-luna", preferredStartDate: null, preferredEndDate: null },
      expect.any(String),
    );
  });

  it("suggests a range from the owner's fixed visit day", async () => {
    suggestedRange.mockResolvedValue({ start: "2026-11-07", end: "2026-11-28" });
    const { result } = renderForm();
    await waitFor(() => expect(result.current.petsLoading).toBe(false));
    await act(() => result.current.choosePet("p-luna"));
    await act(() => result.current.submit());

    expect(result.current.suggestion).toMatch(/día fijo/);
    expect(create).toHaveBeenCalledWith(
      { petId: "p-luna", preferredStartDate: "2026-11-07", preferredEndDate: "2026-11-28" },
      expect.any(String),
    );
  });

  it("offers to edit the existing entry instead of creating a duplicate", async () => {
    const { result, onEditExisting } = renderForm();
    await waitFor(() => expect(result.current.petsLoading).toBe(false));
    await act(() => result.current.choosePet("p-rex"));

    expect(result.current.duplicate?.id).toBe("e1");
    await act(() => result.current.submit());
    expect(create).not.toHaveBeenCalled();
    act(() => result.current.editDuplicate());
    expect(onEditExisting).toHaveBeenCalledWith(REX);
  });

  it("asks to set the pet's size first", async () => {
    const { result } = renderForm();
    await waitFor(() => expect(result.current.petsLoading).toBe(false));
    await act(() => result.current.choosePet("p-nosize"));
    await act(() => result.current.submit());

    expect(result.current.missingSize).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it("shows the server's reason when the pet already has an active appointment", async () => {
    const { ApiError } = await import("@/modules/shared/lib/api-client");
    create.mockRejectedValue(new ApiError(409, ["Luna ya tiene una cita activa este año."]));
    const { result, onClose } = renderForm();
    await waitFor(() => expect(result.current.petsLoading).toBe(false));
    await act(() => result.current.choosePet("p-luna"));
    await act(() => result.current.submit());

    await waitFor(() => expect(result.current.error).toMatch(/cita activa/));
    expect(onClose).not.toHaveBeenCalled();
  });
});
