import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCapacityForm } from "./useCapacityForm";

const impact = vi.fn();
const update = vi.fn();

vi.mock("@/modules/shared/lib/shop-config-api", () => ({
  shopConfigApi: {
    impact: (...args: unknown[]) => impact(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

const CONFIG = {
  maxPetsPerDay: 6,
  quickServiceDurationMinutes: 30,
  openTime: "09:00",
  closeTime: "18:00",
};

// Mismos disparadores que los modales reales (ShopConfigSaveModals.tsx).
function CapacityForm() {
  const { register, handleSubmit, save } = useCapacityForm(CONFIG);
  return (
    <form onSubmit={handleSubmit}>
      <input aria-label="max" {...register("maxPetsPerDay")} />
      <button type="submit">Guardar</button>
      {save.pending ? (
        <button type="button" onClick={save.cancelPending}>
          Cancelar aviso
        </button>
      ) : null}
      {save.scanFailed ? (
        <button type="button" onClick={save.dismissScanFailed}>
          Cancelar revisión
        </button>
      ) : null}
    </form>
  );
}

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CapacityForm />
    </QueryClientProvider>,
  );
  return screen.getByLabelText("max") as HTMLInputElement;
}

afterEach(cleanup);

beforeEach(() => {
  impact.mockReset();
  update.mockReset();
});

describe("useCapacityForm (HU-4.2)", () => {
  it("restores the saved value when the Admin cancels the impact warning", async () => {
    impact.mockResolvedValue({
      outOfHours: [],
      overCapacityDays: [{ date: "2027-01-15", count: 6 }],
    });
    const input = renderForm();
    expect(input.value).toBe("6");

    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByText("Guardar"));
    fireEvent.click(await screen.findByText("Cancelar aviso"));
    await waitFor(() => expect(input.value).toBe("6"));
    expect(update).not.toHaveBeenCalled();
  });

  it("restores the saved value when the Admin dismisses a failed impact scan", async () => {
    impact.mockRejectedValue(new Error("network"));
    const input = renderForm();

    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByText("Guardar"));
    fireEvent.click(await screen.findByText("Cancelar revisión"));
    await waitFor(() => expect(input.value).toBe("6"));
  });
});
