import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useWhatsAppButton } from "./useWhatsAppButton";
import type { WhatsAppResult } from "../lib/whatsapp";

const OK: WhatsAppResult = {
  ok: true,
  messages: [{ text: "Hola María!", url: "https://wa.me/50688880101?text=Hola" }],
};

afterEach(() => vi.restoreAllMocks());

describe("useWhatsAppButton (HU-7.1)", () => {
  it("opens the pre-filled chat in a new tab and sends nothing by itself", () => {
    const win = { opener: {} } as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(win);
    const { result } = renderHook(() => useWhatsAppButton(OK));

    act(() => result.current.open(0));

    expect(open).toHaveBeenCalledWith("https://wa.me/50688880101?text=Hola", "_blank");
    expect(win.opener).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.blocked).toBeNull();
  });

  it("shows the validation message on click instead of opening a broken link", () => {
    const open = vi.spyOn(window, "open");
    const { result } = renderHook(() =>
      useWhatsAppButton({ ok: false, error: "El dueño no tiene teléfono." }),
    );

    act(() => result.current.open(0));

    expect(open).not.toHaveBeenCalled();
    expect(result.current.error).toBe("El dueño no tiene teléfono.");
  });

  it("offers to copy the message when the browser can't open the link", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => useWhatsAppButton(OK));

    act(() => result.current.open(0));
    expect(result.current.blocked).toBe(0);

    await act(() => result.current.copy(0));
    expect(writeText).toHaveBeenCalledWith("Hola María!");
    expect(result.current.copied).toBe(true);
  });

  it("shows the text to copy by hand if the clipboard is unavailable too", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("x")) },
    });
    const { result } = renderHook(() => useWhatsAppButton(OK));

    act(() => result.current.open(0));
    await act(() => result.current.copy(0));

    expect(result.current.error).toContain("Hola María!");
  });
});
