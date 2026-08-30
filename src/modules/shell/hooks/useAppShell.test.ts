import { act, renderHook } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppShell } from "./useAppShell";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const push = vi.fn();

beforeEach(() => {
  push.mockClear();
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

describe("useAppShell", () => {
  it("marks the exact-match link active and leaves the others inactive", () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());

    expect(result.current.isActive("/agenda")).toBe(true);
    expect(result.current.isActive("/owners")).toBe(false);
  });

  it("treats /agenda as an exact match only, not a prefix for other routes", () => {
    vi.mocked(usePathname).mockReturnValue("/owners/o1");
    const { result } = renderHook(() => useAppShell());

    expect(result.current.isActive("/owners")).toBe(true);
    expect(result.current.isActive("/agenda")).toBe(false);
  });

  it("toggles and closes the mobile nav", () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());

    expect(result.current.navOpen).toBe(false);
    act(() => result.current.toggleNav());
    expect(result.current.navOpen).toBe(true);
    act(() => result.current.closeNav());
    expect(result.current.navOpen).toBe(false);
  });

  it("navigates to /login on logout", () => {
    vi.mocked(usePathname).mockReturnValue("/agenda");
    const { result } = renderHook(() => useAppShell());

    act(() => result.current.logout());

    expect(push).toHaveBeenCalledWith("/login");
  });
});
