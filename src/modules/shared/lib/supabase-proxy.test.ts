import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProxyClient } from "./supabase-proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

function cookiesConfig() {
  const call = vi.mocked(createServerClient).mock.calls.at(-1);
  if (!call) throw new Error("createServerClient was not called");
  return call[2]?.cookies as {
    getAll: () => { name: string; value: string }[];
    setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
  };
}

beforeEach(() => {
  vi.mocked(createServerClient).mockClear();
});

describe("createProxyClient", () => {
  it("exposes the incoming request's cookies to the Supabase client", () => {
    const request = new NextRequest("https://example.com/owners", {
      headers: { cookie: "sb-access-token=abc; sb-refresh-token=def" },
    });

    createProxyClient(request);

    expect(cookiesConfig().getAll()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "sb-access-token", value: "abc" }),
        expect.objectContaining({ name: "sb-refresh-token", value: "def" }),
      ]),
    );
  });

  it("propagates a refreshed cookie onto the response getResponse() returns", () => {
    const request = new NextRequest("https://example.com/owners");
    const { getResponse } = createProxyClient(request);

    cookiesConfig().setAll([
      { name: "sb-access-token", value: "refreshed", options: { path: "/" } },
    ]);

    expect(getResponse().cookies.get("sb-access-token")?.value).toBe("refreshed");
  });

  it("returns the latest response after multiple cookie refreshes", () => {
    const request = new NextRequest("https://example.com/owners");
    const { getResponse } = createProxyClient(request);

    cookiesConfig().setAll([{ name: "sb-access-token", value: "first" }]);
    cookiesConfig().setAll([{ name: "sb-access-token", value: "second" }]);

    expect(getResponse().cookies.get("sb-access-token")?.value).toBe("second");
  });
});
