"use client";

import { mockData } from "@/modules/shared/mock-data";
import { getOwner, getPet, petLocation } from "@/modules/shared/selectors";

import { usePickupsView } from "./hooks/usePickupsView";

// Puerto de la pantalla "Pickups del Día".
export function PickupsView() {
  const {
    date,
    changeDate,
    pickupAppts,
    route,
    stale,
    showingRoute,
    generateRoute,
    openWaze,
    openGoogleMaps,
  } = usePickupsView();

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
            onChange={(e) => changeDate(e.target.value)}
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
