import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MapPoint } from "../lib/map-point";
import { LocationPicker } from "./LocationPicker";

// Leaflet no corre en jsdom: el mapa se reemplaza por botones que "tocan" un punto.
vi.mock("next/dynamic", () => ({
  default: () =>
    function FakeMap({ onPick }: { onPick: (p: MapPoint) => void }) {
      return (
        <>
          <button onClick={() => onPick({ lat: 9.37, lng: -83.7 })}>tocar San Isidro</button>
          <button onClick={() => onPick({ lat: 40.4, lng: -3.7 })}>tocar Madrid</button>
        </>
      );
    },
}));

afterEach(() => cleanup());

describe("LocationPicker", () => {
  it("passes a point inside Costa Rica up", () => {
    const onChange = vi.fn();
    render(<LocationPicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByText("tocar San Isidro"));

    expect(onChange).toHaveBeenCalledWith({ lat: 9.37, lng: -83.7 });
  });

  it("rejects a point outside Costa Rica", () => {
    const onChange = vi.fn();
    render(<LocationPicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByText("tocar Madrid"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Ese punto queda fuera de Costa Rica.");
  });

  it("can remove the marked point", () => {
    const onChange = vi.fn();
    render(<LocationPicker value={{ lat: 9.37, lng: -83.7 }} onChange={onChange} />);

    fireEvent.click(screen.getByText("Quitar punto"));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
