import { act, renderHook } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLoginForm } from "./useLoginForm";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const push = vi.fn();

beforeEach(() => {
  push.mockClear();
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
  });

  it("does not navigate when the password is missing", () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(push).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
  });

  it("navigates to /agenda and flips submitting once both fields are filled", () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.setPassword("anything"));
    act(() => result.current.handleSubmit(fakeSubmitEvent()));

    expect(push).toHaveBeenCalledWith("/agenda");
    expect(result.current.submitting).toBe(true);
  });
});
