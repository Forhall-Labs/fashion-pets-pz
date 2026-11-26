"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";

import type { MapPoint } from "../lib/map-point";

// San Isidro de El General: el mapa abre ahí cuando todavía no hay punto,
// porque casi todos los clientes son de Pérez Zeledón.
const SHOP_CENTER: MapPoint = { lat: 9.3706, lng: -83.7046 };

interface LeafletMapProps {
  value: MapPoint | null;
  onPick: (point: MapPoint) => void;
}

// Solo se carga en el navegador (LocationPicker lo importa con
// next/dynamic + ssr:false): Leaflet toca `window` al importarse.
export default function LeafletMap({ value, onPick }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  });

  // El mapa se crea una sola vez; el centro inicial es el punto guardado o
  // la tienda. Después, el punto se mueve con el efecto de abajo.
  const [initialValue] = useState(value);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const start = initialValue ?? SHOP_CENTER;
    const map = L.map(el, { center: [start.lat, start.lng], zoom: initialValue ? 17 : 14 });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      onPickRef.current({ lat: round6(e.latlng.lat), lng: round6(e.latlng.lng) });
    });
    // Dentro de un modal el contenedor puede cambiar de tamaño después de
    // montarse; sin esto Leaflet deja tiles grises.
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(el);
    mapRef.current = map;
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [initialValue]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      return;
    }
    // circleMarker en vez de L.marker: el ícono por defecto de Leaflet
    // depende de imágenes que el bundler no resuelve.
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-primary-dark")
      .trim();
    markerRef.current = L.circleMarker([value.lat, value.lng], {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      fillColor: color || "#b65c2c",
      fillOpacity: 1,
    }).addTo(map);
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="map-picker-canvas"
      role="application"
      aria-label="Mapa: tocá para marcar el punto"
    />
  );
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
