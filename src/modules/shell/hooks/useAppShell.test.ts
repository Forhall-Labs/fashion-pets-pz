import { act, renderHook, waitFor } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppShell } from "./useAppShell";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const getSession = vi.fn();
const signOut = vi.fn();

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => getSession(), signOut: () => signOut() } },
}));

const push = vi.fn();
const replace = vi.fn();

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  signOut.mockClear();
  signOut.mockResolvedValue(undefined);
  getSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
  vi.mocked(useRouter).mockReturnValue({
    push,
    replace,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("useAppShell", () => {
  it("stops checking the session once one is found", async () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());

    expect(result.current.checkingSession).toBe(true);
    await waitFor(() => expect(result.current.checkingSession).toBe(false));
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(result.current.checkingSession).toBe(true);
  });

  it("marks the exact-match link active and leaves the others inactive", async () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());
    await waitFor(() => expect(result.current.checkingSession).toBe(false));

    expect(result.current.isActive("/agenda")).toBe(true);
    expect(result.current.isActive("/owners")).toBe(false);
  });

  it("treats /agenda as an exact match only, not a prefix for other routes", async () => {
    vi.mocked(usePathname).mockReturnValue("/owners/o1");
    const { result } = renderHook(() => useAppShell());
    await waitFor(() => expect(result.current.checkingSession).toBe(false));

    expect(result.current.isActive("/owners")).toBe(true);
    expect(result.current.isActive("/agenda")).toBe(false);
  });

  it("toggles and closes the mobile nav", async () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());
    await waitFor(() => expect(result.current.checkingSession).toBe(false));

    expect(result.current.navOpen).toBe(false);
    act(() => result.current.toggleNav());
    expect(result.current.navOpen).toBe(true);
    act(() => result.current.closeNav());
    expect(result.current.navOpen).toBe(false);
  });

  it("signs out of Supabase and navigates to /login on logout", async () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());
    await waitFor(() => expect(result.current.checkingSession).toBe(false));

    await act(() => result.current.logout());

    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
  });
});
