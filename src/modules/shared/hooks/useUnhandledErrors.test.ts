import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useUnhandledErrors } from "./useUnhandledErrors";
import { isReportableError } from "../lib/unhandled-errors";

function fireError(error: unknown) {
  window.dispatchEvent(new ErrorEvent("error", { error, message: String(error) }));
}

function fireRejection(reason: unknown) {
  const event = new Event("unhandledrejection") as PromiseRejectionEvent;
  Object.defineProperty(event, "reason", { value: reason });
  window.dispatchEvent(event);
}

describe("isReportableError", () => {
  it("reports real errors", () => {
    expect(isReportableError(new TypeError("x is undefined"))).toBe(true);
    expect(isReportableError("algo falló")).toBe(true);
  });

  it("ignores cancelled requests and ResizeObserver noise", () => {
    expect(isReportableError(new DOMException("aborted", "AbortError"))).toBe(false);
    expect(isReportableError(new Error("ResizeObserver loop limit exceeded"))).toBe(false);
  });
});

describe("useUnhandledErrors", () => {
  it("opens on an uncaught error and closes on demand", () => {
    const { result } = renderHook(() => useUnhandledErrors());
    expect(result.current.open).toBe(false);

    act(() => fireError(new Error("boom")));
    expect(result.current.open).toBe(true);

    act(() => result.current.close());
    expect(result.current.open).toBe(false);
  });

  it("opens on an unhandled promise rejection", () => {
    const { result } = renderHook(() => useUnhandledErrors());
    act(() => fireRejection(new Error("fetch failed")));
    expect(result.current.open).toBe(true);
  });

  it("stays closed for ignored noise", () => {
    const { result } = renderHook(() => useUnhandledErrors());
    act(() => fireRejection(new DOMException("aborted", "AbortError")));
    expect(result.current.open).toBe(false);
  });

  it("stops listening after unmount", () => {
    const { result, unmount } = renderHook(() => useUnhandledErrors());
    unmount();
    act(() => fireError(new Error("boom")));
    expect(result.current.open).toBe(false);
  });
});
