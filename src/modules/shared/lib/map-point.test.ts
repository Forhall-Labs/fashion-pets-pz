import { describe, expect, it } from "vitest";

import { pointChange, toMapPoint } from "./map-point";

describe("toMapPoint", () => {
  it("builds a point only when both coordinates exist", () => {
    expect(toMapPoint({ lat: 9.37, lng: -83.7 })).toEqual({ lat: 9.37, lng: -83.7 });
    expect(toMapPoint({ lat: 9.37, lng: null })).toBeNull();
  });
});

describe("pointChange", () => {
  const A = { lat: 9.37, lng: -83.7 };

  it("is undefined when the point didn't change", () => {
    expect(pointChange(null, null)).toBeUndefined();
    expect(pointChange(A, { ...A })).toBeUndefined();
  });

  it("is the new point when it was marked or moved", () => {
    expect(pointChange(null, A)).toEqual(A);
    expect(pointChange(A, { lat: 9.38, lng: -83.7 })).toEqual({ lat: 9.38, lng: -83.7 });
  });

  it("is null when the point was removed", () => {
    expect(pointChange(A, null)).toBeNull();
  });
});
