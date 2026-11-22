"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { isInServiceArea } from "../lib/maps-links";
import type { MapPoint } from "../lib/map-point";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="map-picker-canvas map-picker-loading">Cargando mapa…</div>,
});

interface LocationPickerProps {
  value: MapPoint | null;
  onChange: (point: MapPoint | null) => void;
  error?: string;
}

// Punto de recogida marcado a mano en el mapa. Más confiable que geocodificar
// el texto: Nominatim no reconoce las direcciones tipo "Barrio X, San Isidro"
// (QA de la Épica 6, 2026-11-18).
export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [outside, setOutside] = useState(false);

  function pick(point: MapPoint) {
    if (!isInServiceArea(point)) {
      setOutside(true);
      return;
    }
    setOutside(false);
    onChange(point);
  }

  return (
    <div className="map-picker">
      <LeafletMap value={value} onPick={pick} />
      <div className="map-picker-footer">
        <span className="hint">
          {value
            ? `Punto marcado (${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}). Tocá otro lugar para moverlo.`
            : "Tocá el mapa para marcar el punto."}
        </span>
        {value ? (
          <button type="button" className="btn btn-text btn-sm" onClick={() => onChange(null)}>
            Quitar punto
          </button>
        ) : null}
      </div>
      {outside ? (
        <span className="error-msg" role="alert">
          Ese punto queda fuera de Costa Rica.
        </span>
      ) : null}
      {error ? (
        <span className="error-msg" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
