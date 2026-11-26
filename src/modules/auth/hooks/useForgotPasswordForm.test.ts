import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useForgotPasswordForm } from "./useForgotPasswordForm";

const resetPasswordForEmail = vi.fn();

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: {
    auth: { resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmail(...args) },
  },
}));

beforeEach(() => {
  resetPasswordForEmail.mockClear();
});

function fakeSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("useForgotPasswordForm", () => {
  it("starts with an empty email, not submitting, no error, not sent", () => {
    const { result } = renderHook(() => useForgotPasswordForm());

    expect(result.current.email).toBe("");
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.sent).toBe(false);
  });

  it("does not call Supabase when the email is empty", async () => {
    const { result } = renderHook(() => useForgotPasswordForm());

    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("requests the reset email with a redirect back to /reset-password and marks it sent", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useForgotPasswordForm());

    act(() => result.current.setEmail("admin@peluqueria.com"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(resetPasswordForEmail).toHaveBeenCalledWith("admin@peluqueria.com", {
      redirectTo: expect.stringContaining("/reset-password"),
    });
    expect(result.current.sent).toBe(true);
    expect(result.current.submitting).toBe(false);
  });

  it("surfaces a translated error and does not mark it sent when Supabase rejects the request", async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: { code: "over_request_rate_limit", message: "rate limited" },
    });
    const { result } = renderHook(() => useForgotPasswordForm());

    act(() => result.current.setEmail("admin@peluqueria.com"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(result.current.sent).toBe(false);
    expect(result.current.error).toBe("Demasiados intentos. Probá de nuevo en unos minutos.");
  });
});
