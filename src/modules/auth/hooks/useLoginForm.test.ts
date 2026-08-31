import { act, renderHook } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLoginForm } from "./useLoginForm";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const signInWithPassword = vi.fn();

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { signInWithPassword: (...args: unknown[]) => signInWithPassword(...args) } },
}));

const push = vi.fn();

beforeEach(() => {
  push.mockClear();
  signInWithPassword.mockClear();
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

function fakeSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("useLoginForm", () => {
  it("starts with the default admin email, empty password and not submitting", () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.email).toBe("admin@peluqueria.com");
    expect(result.current.password).toBe("");
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not call Supabase or navigate when the password is missing", async () => {
    const { result } = renderHook(() => useLoginForm());

    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
  });

  it("navigates to /agenda once Supabase confirms the credentials", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.setPassword("correct-password"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "admin@peluqueria.com",
      password: "correct-password",
    });
    expect(push).toHaveBeenCalledWith("/agenda");
  });

  it("surfaces a Spanish error message and stops submitting when Supabase rejects the credentials", async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", message: "Invalid login credentials" },
    });
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.setPassword("wrong-password"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(push).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBe("Usuario o contraseña incorrectos.");
  });

  it("falls back to a generic Spanish message for an unmapped error", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Something unexpected" } });
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.setPassword("wrong-password"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(result.current.error).toBe("Ocurrió un error. Intentá de nuevo.");
  });

  it("clears the error via clearError", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Something unexpected" } });
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.setPassword("wrong-password"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));
    expect(result.current.error).not.toBeNull();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
