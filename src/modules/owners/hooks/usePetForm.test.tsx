import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { UseFormSetValue } from "react-hook-form";

import { usePetForm } from "./usePetForm";
import type { PetFormValues } from "@/modules/shared/lib/pet-schema";
import type { Pet } from "@/modules/shared/types";

const create = vi.fn();
const update = vi.fn();

vi.mock("@/modules/shared/lib/pets-api", () => ({
  petsApi: {
    create: (...args: unknown[]) => create(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));

const listAppointments = vi.fn();
const cancelAppointment = vi.fn();

vi.mock("@/modules/shared/lib/appointments-api", () => ({
  appointmentsApi: {
    list: (...args: unknown[]) => listAppointments(...args),
    cancel: (...args: unknown[]) => cancelAppointment(...args),
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

const REX: Pet = {
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
  avgServiceDuration: null,
};

function fakeSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

function fillRequiredFields(setValue: UseFormSetValue<PetFormValues>) {
  setValue("name", "Luna");
  setValue("breed", "Poodle");
  setValue("size", "small");
}

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  listAppointments.mockReset();
  cancelAppointment.mockReset();
  listAppointments.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

describe("usePetForm", () => {
  it("creates a new pet with the entered data", async () => {
    create.mockResolvedValue({ ...REX, id: "new" });
    const onSaved = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(
      () => usePetForm({ ownerId: "o1", existingPets: [], onSaved, onClose }),
      { wrapper: createWrapper() },
    );

    act(() => fillRequiredFields(result.current.setValue));
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ name: "Luna", breed: "Poodle", size: "small" });
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("blocks submit when breed is missing", async () => {
    const { result } = renderHook(
      () => usePetForm({ ownerId: "o1", existingPets: [], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.setValue("name", "Luna");
      result.current.setValue("size", "small");
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    expect(result.current.errors.breed).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it("requires confirming the aggressive flag before it's set", () => {
    const { result } = renderHook(
      () => usePetForm({ ownerId: "o1", existingPets: [], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.toggleAggressive(true));
    expect(result.current.stage).toBe("aggressive-confirm");
    expect(result.current.isAggressive).toBe(false);

    act(() => result.current.confirmAggressive());
    expect(result.current.stage).toBe("form");
    expect(result.current.isAggressive).toBe(true);
  });

  it("cancelling the aggressive confirmation leaves the flag unset", () => {
    const { result } = renderHook(
      () => usePetForm({ ownerId: "o1", existingPets: [], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.toggleAggressive(true));
    act(() => result.current.cancelAggressive());
    expect(result.current.stage).toBe("form");
    expect(result.current.isAggressive).toBe(false);
  });

  it("warns on a duplicate pet name under the same owner, but still allows saving", async () => {
    create.mockResolvedValue({ ...REX, id: "new" });
    const { result } = renderHook(
      () => usePetForm({ ownerId: "o1", existingPets: [REX], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.setValue("name", "Rex");
      result.current.setValue("breed", "Otra raza");
      result.current.setValue("size", "small");
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    expect(result.current.stage).toBe("duplicate-name");
    expect(result.current.duplicateName).toBe("Rex");
    expect(create).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.confirmDuplicateName();
    });
    await waitFor(() => expect(create).toHaveBeenCalled());
  });

  it("does not warn about a duplicate name against itself when editing", async () => {
    update.mockResolvedValue(REX);
    const { result } = renderHook(
      () => usePetForm({ pet: REX, ownerId: "o1", existingPets: [REX], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(result.current.stage).toBe("form");
  });

  it("applies a frequency change immediately when there are no future appointments", async () => {
    update.mockResolvedValue({ ...REX, groomingFrequency: "once_a_month" });
    listAppointments.mockResolvedValue([]);
    const { result } = renderHook(
      () => usePetForm({ pet: REX, ownerId: "o1", existingPets: [REX], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.setValue("groomingFrequency", "once_a_month"));
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(result.current.stage).toBe("form");
  });

  it("asks to keep or regenerate future appointments on a frequency change", async () => {
    listAppointments.mockResolvedValue([
      { id: "a1", petId: REX.id, status: "scheduled", date: "2999-01-01" },
    ]);
    const { result } = renderHook(
      () => usePetForm({ pet: REX, ownerId: "o1", existingPets: [REX], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.setValue("groomingFrequency", "once_a_month"));
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    expect(result.current.stage).toBe("frequency-conflict");
    expect(result.current.futureAppointmentCount).toBe(1);
    expect(update).not.toHaveBeenCalled();
  });

  it("keeping existing appointments saves the frequency without cancelling anything", async () => {
    update.mockResolvedValue({ ...REX, groomingFrequency: "once_a_month" });
    listAppointments.mockResolvedValue([
      { id: "a1", petId: REX.id, status: "scheduled", date: "2999-01-01" },
    ]);
    const { result } = renderHook(
      () => usePetForm({ pet: REX, ownerId: "o1", existingPets: [REX], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.setValue("groomingFrequency", "once_a_month"));
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await act(async () => {
      result.current.keepAppointments();
    });

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it("regenerating cancels the future appointments and saves the new frequency", async () => {
    update.mockResolvedValue({ ...REX, groomingFrequency: "once_a_month" });
    cancelAppointment.mockResolvedValue({});
    listAppointments.mockResolvedValue([
      { id: "a1", petId: REX.id, status: "scheduled", date: "2999-01-01" },
    ]);
    const { result } = renderHook(
      () => usePetForm({ pet: REX, ownerId: "o1", existingPets: [REX], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.setValue("groomingFrequency", "once_a_month"));
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await act(async () => {
      result.current.regenerateAppointments();
    });

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(cancelAppointment).toHaveBeenCalledWith("a1");
  });

  it("reports a partial cancellation failure with a specific message instead of the generic one", async () => {
    cancelAppointment.mockRejectedValue(new Error("network error"));
    listAppointments.mockResolvedValue([
      { id: "a1", petId: REX.id, status: "scheduled", date: "2999-01-01" },
    ]);
    const { result } = renderHook(
      () => usePetForm({ pet: REX, ownerId: "o1", existingPets: [REX], onClose: vi.fn() }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.setValue("groomingFrequency", "once_a_month"));
    await act(async () => {
      await result.current.handleSubmit(fakeSubmitEvent());
    });

    await act(async () => {
      result.current.regenerateAppointments();
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error).toContain("1 de 1");
    expect(update).not.toHaveBeenCalled();
  });
});
