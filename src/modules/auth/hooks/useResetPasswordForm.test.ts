import { act, renderHook } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useResetPasswordForm } from "./useResetPasswordForm";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const updateUser = vi.fn();
const signOut = vi.fn();

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: {
    auth: {
      updateUser: (...args: unknown[]) => updateUser(...args),
      signOut: () => signOut(),
    },
  },
}));

const push = vi.fn();

beforeEach(() => {
  push.mockClear();
  updateUser.mockClear();
  signOut.mockClear();
  signOut.mockResolvedValue(undefined);
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

function fakeSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("useResetPasswordForm", () => {
  it("rejects a password shorter than 6 characters without calling Supabase", async () => {
    const { result } = renderHook(() => useResetPasswordForm());

    act(() => result.current.setPassword("abc"));
    act(() => result.current.setConfirmPassword("abc"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(updateUser).not.toHaveBeenCalled();
    expect(result.current.error).toBe("La contraseña tiene que tener al menos 6 caracteres.");
  });

  it("rejects mismatched passwords without calling Supabase", async () => {
    const { result } = renderHook(() => useResetPasswordForm());

    act(() => result.current.setPassword("password1"));
    act(() => result.current.setConfirmPassword("password2"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(updateUser).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Las contraseñas no coinciden.");
  });

  it("updates the password, signs out of the recovery session, and navigates to /login", async () => {
    updateUser.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useResetPasswordForm());

    act(() => result.current.setPassword("new-password"));
    act(() => result.current.setConfirmPassword("new-password"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("surfaces a translated error and does not navigate when Supabase rejects the update", async () => {
    updateUser.mockResolvedValue({ error: { code: "weak_password", message: "weak" } });
    const { result } = renderHook(() => useResetPasswordForm());

    act(() => result.current.setPassword("new-password"));
    act(() => result.current.setConfirmPassword("new-password"));
    await act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(push).not.toHaveBeenCalled();
    expect(result.current.error).toBe("La contraseña es muy débil. Usá al menos 6 caracteres.");
  });
});
