import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type { PickupItem, PickupRoute } from "@/modules/shared/lib/pickups-api";

import { usePickupsView } from "./usePickupsView";

const list = vi.fn();
const route = vi.fn();

vi.mock("@/modules/shared/lib/pickups-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/shared/lib/pickups-api")>()),
  pickupsApi: {
    list: (...args: unknown[]) => list(...args),
    route: (...args: unknown[]) => route(...args),
  },
}));

vi.mock("@/modules/shared/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function pickup(id: string, extra: Partial<PickupItem> = {}): PickupItem {
  return {
    appointmentId: id,
    petId: `p-${id}`,
    petName: `Mascota ${id}`,
    ownerId: "o1",
    ownerName: "María",
    ownerPhone: "+506 8888-0101",
    startTime: "09:00",
    address: "Barrio Amón",
    lat: 9.93,
    lng: -84.07,
    flags: [],
    ...extra,
  };
}

function routeFor(ids: string[]): PickupRoute {
  return {
    date: "2026-11-02",
    stops: ids.map((id, i) => ({
      address: `Dirección ${id}`,
      lat: 9.9 + i / 100,
      lng: -84.07,
      pets: [{ appointmentId: id, petId: `p-${id}`, petName: `Mascota ${id}`, ownerName: "María" }],
    })),
    excluded: [],
    signature: [...ids].sort().join(","),
  };
}

let win: { opener: unknown; location: { href: string }; close: ReturnType<typeof vi.fn> };
let openSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-02T12:00:00"));
  list.mockReset();
  route.mockReset();
  win = { opener: {}, location: { href: "" }, close: vi.fn() };
  openSpy = vi.spyOn(window, "open").mockReturnValue(win as unknown as Window);
});

afterEach(() => {
  vi.useRealTimers();
  openSpy.mockRestore();
});

async function renderWithRoute(ids: string[]) {
  list.mockResolvedValue(ids.map((id) => pickup(id)));
  route.mockResolvedValue(routeFor(ids));
  const hook = renderHook(() => usePickupsView(), { wrapper: createWrapper() });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  act(() => hook.result.current.generateRoute());
  await waitFor(() => expect(hook.result.current.showingRoute).toBe(true));
  return hook;
}

describe("usePickupsView (HU-6.1)", () => {
  it("loads today's pickups from the API", async () => {
    list.mockResolvedValue([pickup("a1"), pickup("a2")]);
    const { result } = renderHook(() => usePickupsView(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(list).toHaveBeenCalledWith("2026-11-02");
    expect(result.current.pickups.map((p) => p.appointmentId)).toEqual(["a1", "a2"]);
  });

  it("loads a future day when the date changes", async () => {
    list.mockResolvedValue([]);
    const { result } = renderHook(() => usePickupsView(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.changeDate("2026-11-09"));

    await waitFor(() => expect(list).toHaveBeenCalledWith("2026-11-09"));
  });

  it("reports a load error and retries on demand", async () => {
    list.mockRejectedValueOnce(new Error("down")).mockResolvedValue([pickup("a1")]);
    const { result } = renderHook(() => usePickupsView(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loadError).toBe(true));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.pickups).toHaveLength(1));
  });
});

describe("usePickupsView (HU-6.2)", () => {
  it("keeps the unordered list and reports the error when the route can't be generated", async () => {
    list.mockResolvedValue([pickup("a1"), pickup("a2")]);
    route.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => usePickupsView(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.generateRoute());

    await waitFor(() => expect(result.current.routeError).toBe(true));
    expect(result.current.showingRoute).toBe(false);
    expect(result.current.pickups).toHaveLength(2);
  });

  it("detects a stale route once the pickup list changes", async () => {
    const { result } = await renderWithRoute(["a1"]);
    list.mockResolvedValue([pickup("a1"), pickup("a2")]);

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.stale).toBe(true));
    expect(result.current.showingRoute).toBe(false);
  });
});

describe("usePickupsView (HU-6.3)", () => {
  it("opens Google Maps with every stop in the generated order", async () => {
    const { result } = await renderWithRoute(["a1", "a2", "a3"]);

    await act(() => result.current.openGoogleMaps());

    const url = new URL(win.location.href);
    expect(url.searchParams.get("waypoints")).toBe("9.9,-84.07|9.91,-84.07");
    expect(url.searchParams.get("destination")).toBe("9.92,-84.07");
    expect(win.opener).toBeNull();
  });

  it("opens Waze on the first stop", async () => {
    const { result } = await renderWithRoute(["a1", "a2"]);

    await act(() => result.current.openWaze(0));

    expect(win.location.href).toBe("https://waze.com/ul?ll=9.9%2C-84.07&navigate=yes");
  });

  it("asks to regenerate instead of opening a route that went stale", async () => {
    const { result } = await renderWithRoute(["a1"]);
    list.mockResolvedValue([pickup("a1"), pickup("a2")]);

    await act(() => result.current.openGoogleMaps());

    expect(win.close).toHaveBeenCalled();
    expect(win.location.href).toBe("");
    expect(result.current.stale).toBe(true);
  });

  it("offers to copy the link when no window can be opened", async () => {
    const { result } = await renderWithRoute(["a1"]);
    openSpy.mockReturnValue(null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await act(() => result.current.openGoogleMaps());
    expect(result.current.blockedLink).toContain("https://www.google.com/maps/dir/");

    await act(() => result.current.copyBlockedLink());
    expect(writeText).toHaveBeenCalledWith(result.current.blockedLink);
    expect(result.current.copied).toBe(true);
  });
});
