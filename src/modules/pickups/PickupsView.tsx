"use client";

import { useState } from "react";

import { haversineKm } from "@/modules/shared/date-utils";
import { mockData, TODAY_ISO } from "@/modules/shared/mock-data";
import { getOwner, getPet, petLocation } from "@/modules/shared/selectors";
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
export function PickupsView() {
  const [date, setDate] = useState(TODAY_ISO);
  const [route, setRoute] = useState<Route | null>(null);

  const dayAppts = mockData.appointments.filter((a) => a.date === date && a.status === "scheduled");
  const pickupAppts = dayAppts.filter((a) => getPet(mockData, a.petId)!.needsPickup);
  const currentSignature = pickupAppts
    .map((a) => a.id)
    .sort()
    .join(",");
  const stale = route !== null && route.date === date && route.signature !== currentSignature;
  const showingRoute = route && route.date === date && !stale;

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

  return (
    <section className="screen" data-screen="pickups">
      <div className="screen-header">
        <h1 className="text-h1">Pickups del día</h1>
        <div className="field field-inline">
          <label htmlFor="pickup-date">Fecha</label>
          <input
            type="date"
            id="pickup-date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setRoute(null);
            }}
          />
        </div>
      </div>

      {pickupAppts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🚗</span>No hay pickups programados para este día.
        </div>
      ) : showingRoute ? (
        <>
          <h2 className="text-h2" style={{ marginBottom: 8 }}>
            Ruta generada
          </h2>
          <div className="data-table">
            {route!.stops.map((s, i) => {
              const pet = getPet(mockData, s.petId)!;
              const owner = getOwner(mockData, pet.ownerId)!;
              return (
                <div className="data-row" key={s.petId}>
                  <div className="route-stop">
                    <span className="route-stop-num">{i + 1}</span>
                    <div className="data-row-main">
                      <strong>{pet.name}</strong>
                      <span className="text-small">
                        {owner.name} · {s.address}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {route!.excluded.map((a) => {
              const pet = getPet(mockData, a.petId)!;
              return (
                <div className="data-row" key={a.id}>
                  <div className="data-row-main">
                    <strong>{pet.name}</strong>
                    <span className="text-small">Excluido — ubicación faltante</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="map-buttons">
            <button className="btn btn-primary" disabled={!route!.stops.length} onClick={openWaze}>
              Abrir en Waze
            </button>
            <button
              className="btn btn-primary"
              disabled={!route!.stops.length}
              onClick={openGoogleMaps}
            >
              Abrir en Google Maps
            </button>
            <button className="btn btn-ghost btn-sm" onClick={generateRoute}>
              Regenerar
            </button>
            {!route!.stops.length ? (
              <span className="text-small">
                Sin paradas válidas — corregí las direcciones faltantes.
              </span>
            ) : (
              <span className="text-small">
                Waze solo admite una parada a la vez: se abre la primera.
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {stale ? (
            <div className="route-banner">
              <span>La lista de pickups cambió desde que generaste la ruta.</span>
              <button className="btn btn-primary btn-sm" onClick={generateRoute}>
                Regenerar ruta
              </button>
            </div>
          ) : null}
          <div className="data-table">
            {pickupAppts.map((a) => {
              const pet = getPet(mockData, a.petId)!;
              const owner = getOwner(mockData, pet.ownerId)!;
              const loc = petLocation(mockData, pet);
              return (
                <div className="data-row" key={a.id}>
                  <div className="data-row-main">
                    <strong>{pet.name}</strong>
                    <span className="text-small">
                      {owner.name} · {a.startTime}
                    </span>
                  </div>
                  <div className="data-row-meta">
                    {loc.has ? (
                      <span className="pickup-row-status">{loc.address}</span>
                    ) : (
                      <span className="badge badge-incomplete">Ubicación faltante</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="map-buttons">
            <button className="btn btn-primary" onClick={generateRoute}>
              Generar ruta
            </button>
          </div>
        </>
      )}
    </section>
  );
}
