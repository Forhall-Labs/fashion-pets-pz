import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { ApiError } from "@/modules/shared/lib/api-client";

import { useGenerateYear } from "./useGenerateYear";

const preview = vi.fn();
const run = vi.fn();

vi.mock("@/modules/shared/lib/scheduling-api", () => ({
  schedulingApi: {
    preview: (...args: unknown[]) => preview(...args),
    run: (...args: unknown[]) => run(...args),
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

const PREVIEW = {
  targetYear: 2027,
  appointmentsToCreate: 12,
  pets: [{ petId: "rex", petName: "Rex", count: 12 }],
  waitlist: [],
  skipped: [{ petId: "luna", petName: "Luna", reason: "Sin historial" }],
  lastScheduledAt: null,
};
const REPORT = {
  targetYear: 2027,
  created: 12,
  pets: PREVIEW.pets,
  waitlist: [],
  skipped: PREVIEW.skipped,
  failed: [],
};

beforeEach(() => {
  preview.mockReset();
  run.mockReset();
  preview.mockResolvedValue(PREVIEW);
});

describe("useGenerateYear (HU-3.1)", () => {
  it("does not compute the preview until the Admin opens it", async () => {
    const { result } = renderHook(() => useGenerateYear(), { wrapper: createWrapper() });
    expect(preview).not.toHaveBeenCalled();

    act(() => result.current.start());
    await waitFor(() => expect(result.current.preview).toEqual(PREVIEW));
    expect(run).not.toHaveBeenCalled();
  });

  it("runs only on confirm, and exposes the report", async () => {
    run.mockResolvedValue(REPORT);
    const { result } = renderHook(() => useGenerateYear(), { wrapper: createWrapper() });
    act(() => result.current.start());
    await waitFor(() => expect(result.current.preview).not.toBeNull());

    act(() => result.current.confirm());
    await waitFor(() => expect(result.current.report).toEqual(REPORT));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("shows the server's message when another run is already in progress (409)", async () => {
    run.mockRejectedValue(new ApiError(409, ["Ya hay una programación de agenda en curso."]));
    const { result } = renderHook(() => useGenerateYear(), { wrapper: createWrapper() });
    act(() => result.current.start());
    await waitFor(() => expect(result.current.preview).not.toBeNull());

    act(() => result.current.confirm());
    await waitFor(() =>
      expect(result.current.runError).toBe("Ya hay una programación de agenda en curso."),
    );
  });

  it("offers a retry when the preview fails", async () => {
    preview.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useGenerateYear(), { wrapper: createWrapper() });
    act(() => result.current.start());
    await waitFor(() => expect(result.current.previewError).not.toBeNull());

    act(() => result.current.retryPreview());
    await waitFor(() => expect(result.current.preview).toEqual(PREVIEW));
  });
});
