import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useOwnersList } from "./useOwnersList";

describe("useOwnersList", () => {
  it("lists every owner with their pet count when there is no search query", () => {
    const { result } = renderHook(() => useOwnersList());

    expect(result.current.owners).toHaveLength(4);
    const maria = result.current.owners.find((o) => o.id === "o1")!;
    expect(maria.petCount).toBe(2);
  });

  it("filters owners by a case-insensitive name match", () => {
    const { result } = renderHook(() => useOwnersList());

    act(() => result.current.setQuery("diego"));

    expect(result.current.owners.map((o) => o.name)).toEqual(["Diego Torres"]);
  });

  it("filters owners by a partial phone match", () => {
    const { result } = renderHook(() => useOwnersList());

    act(() => result.current.setQuery("0303"));

    expect(result.current.owners.map((o) => o.name)).toEqual(["Lucía Gómez"]);
  });

  it("returns no owners when nothing matches", () => {
    const { result } = renderHook(() => useOwnersList());

    act(() => result.current.setQuery("nobody"));

    expect(result.current.owners).toHaveLength(0);
  });
});
