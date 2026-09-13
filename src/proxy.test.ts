import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProxyClient } from "@/modules/shared/lib/supabase-proxy";

import { proxy } from "./proxy";

vi.mock("@/modules/shared/lib/supabase-proxy", () => ({
  createProxyClient: vi.fn(),
}));

function mockSession(user: User | null, response: NextResponse = NextResponse.next()) {
  vi.mocked(createProxyClient).mockReturnValue({
    supabase: {
      auth: { getUser: () => Promise.resolve({ data: { user } }) },
    } as unknown as ReturnType<typeof createProxyClient>["supabase"],
    getResponse: () => response,
  });
}

beforeEach(() => {
  vi.mocked(createProxyClient).mockReset();
});

describe("proxy", () => {
  it("redirects an unauthenticated request to /login on a protected path", async () => {
    mockSession(null);

    const response = await proxy(new NextRequest("https://example.com/owners"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/login");
  });

  it.each(["/login", "/forgot-password", "/reset-password"])(
    "lets an unauthenticated request through on the public path %s",
    async (path) => {
      mockSession(null);

      const response = await proxy(new NextRequest(`https://example.com${path}`));

      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("lets an authenticated request through on a protected path", async () => {
    mockSession({ id: "user-1" } as User);

    const response = await proxy(new NextRequest("https://example.com/owners"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("copies a cookie refreshed during getUser() onto the /login redirect", async () => {
    const refreshed = NextResponse.next();
    refreshed.cookies.set("sb-access-token", "refreshed-value", { path: "/" });
    mockSession(null, refreshed);

    const response = await proxy(new NextRequest("https://example.com/owners"));

    expect(response.status).toBe(307);
    expect(response.cookies.get("sb-access-token")?.value).toBe("refreshed-value");
  });
});
