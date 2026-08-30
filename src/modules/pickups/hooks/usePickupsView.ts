"use client";

import { useState } from "react";

import { haversineKm } from "@/modules/shared/date-utils";
import { mockData, TODAY_ISO } from "@/modules/shared/mock-data";
import { getPet, petLocation } from "@/modules/shared/selectors";
import type { Appointment } from "@/modules/shared/types";

interface RouteStop {
  petId: string;
  lat: number;
  lng: number;
  address: string;
}

interface Route {
  date: string;
  stops: RouteStop[];
  excluded: Appointment[];
  signature: string;
}

// Puerto de la pantalla "Pickups del Día" — generateRoute()/openWaze()/
// openGoogleMaps() de app.js son funciones puras, así que quedaron
// completamente funcionales (nearest-neighbor sobre las coordenadas mock).
export function usePickupsView() {
  const [date, setDate] = useState(TODAY_ISO);
  const [route, setRoute] = useState<Route | null>(null);

  const dayAppts = mockData.appointments.filter((a) => a.date === date && a.status === "scheduled");
  const pickupAppts = dayAppts.filter((a) => getPet(mockData, a.petId)!.needsPickup);
  const currentSignature = pickupAppts
    .map((a) => a.id)
    .sort()
    .join(",");
  const stale = route !== null && route.date === date && route.signature !== currentSignature;
  const showingRoute = Boolean(route && route.date === date && !stale);

  function changeDate(next: string) {
    setDate(next);
    setRoute(null);
  }

  function generateRoute() {
    const withLoc: RouteStop[] = [];
    const excluded: Appointment[] = [];
    pickupAppts.forEach((a) => {
      const loc = petLocation(mockData, getPet(mockData, a.petId)!);
      if (loc.has)
        withLoc.push({ petId: a.petId, lat: loc.lat!, lng: loc.lng!, address: loc.address! });
      else excluded.push(a);
    });

    const ordered: RouteStop[] = [];
    const pool = withLoc.slice();
    if (pool.length) {
      let current = pool.shift()!;
      ordered.push(current);
      while (pool.length) {
        let nearestIdx = 0;
        let nearestDist = Infinity;
        pool.forEach((s, i) => {
          const d = haversineKm(current.lat, current.lng, s.lat, s.lng);
          if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = i;
          }
        });
        current = pool.splice(nearestIdx, 1)[0];
        ordered.push(current);
      }
    }
    setRoute({ date, stops: ordered, excluded, signature: currentSignature });
  }

  function openWaze() {
    if (!route || !route.stops.length) return;
    const first = route.stops[0];
    window.open(`https://waze.com/ul?ll=${first.lat},${first.lng}&navigate=yes`, "_blank");
  }

  function openGoogleMaps() {
    if (!route || !route.stops.length) return;
    const last = route.stops[route.stops.length - 1];
    const waypoints = route.stops
      .slice(0, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join("|");
    let url = `https://www.google.com/maps/dir/?api=1&destination=${last.lat},${last.lng}&travelmode=driving`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
    window.open(url, "_blank");
  }

  return {
    date,
    changeDate,
    pickupAppts,
    route,
    stale,
    showingRoute,
    generateRoute,
    openWaze,
    openGoogleMaps,
  };
}
