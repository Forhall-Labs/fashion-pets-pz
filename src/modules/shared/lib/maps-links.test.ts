import { describe, expect, it } from "vitest";

import { googleMapsUrl, isInServiceArea, MapLinkError, wazeUrl } from "./maps-links";

const A = { lat: 9.93, lng: -84.07 };
const B = { lat: 9.94, lng: -84.08 };
const C = { lat: 9.95, lng: -84.09 };

describe("googleMapsUrl (HU-6.3)", () => {
  it("uses the earlier stops as ordered waypoints and the last as destination", () => {
    const url = new URL(googleMapsUrl([A, B, C]));

    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("waypoints")).toBe("9.93,-84.07|9.94,-84.08");
    expect(url.searchParams.get("destination")).toBe("9.95,-84.09");
  });

  it("gives plain directions to a single stop", () => {
    const url = new URL(googleMapsUrl([A]));

    expect(url.searchParams.get("destination")).toBe("9.93,-84.07");
    expect(url.searchParams.has("waypoints")).toBe(false);
  });

  it("refuses a route with no valid stops", () => {
    expect(() => googleMapsUrl([])).toThrow(MapLinkError);
  });

  it("refuses broken coordinates instead of building a broken link", () => {
    expect(() => googleMapsUrl([A, { lat: Number.NaN, lng: -84 }])).toThrow(MapLinkError);
  });
});

describe("wazeUrl (HU-6.3)", () => {
  it("navigates turn by turn to a single destination", () => {
    expect(wazeUrl(A)).toBe("https://waze.com/ul?ll=9.93%2C-84.07&navigate=yes");
  });
});

describe("isInServiceArea", () => {
  it("accepts coordinates in Costa Rica and rejects missing or foreign ones", () => {
    expect(isInServiceArea({ lat: 9.37, lng: -83.7 })).toBe(true);
    expect(isInServiceArea({ lat: null, lng: null })).toBe(false);
    expect(isInServiceArea({ lat: 6.65, lng: -75.46 })).toBe(false);
  });
});
