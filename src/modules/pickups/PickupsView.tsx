"use client";

import { AppointmentDetailModal } from "@/modules/shared/components/AppointmentDetailModal";
import { AppointmentForm } from "@/modules/shared/components/AppointmentForm";
import { CarIcon } from "@/modules/shared/components/CarIcon";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import { WalkingDogLoader } from "@/modules/shared/components/WalkingDogLoader";
import type { ExclusionReason, PickupItem } from "@/modules/shared/lib/pickups-api";

import { usePickupsView } from "./hooks/usePickupsView";

const EXCLUSION_LABEL: Record<ExclusionReason, string> = {
  location_missing: "Excluida — sin ubicación",
  invalid_address: "Excluida — no se encontró la dirección",
  unsupported_region: "Excluida — dirección fuera de Costa Rica",
};

function PickupStatus({ pickup }: { pickup: PickupItem }) {
  if (pickup.flags.includes("invalid_appointment_data")) {
    return <span className="badge badge-incomplete">Datos de la cita inválidos</span>;
  }
  if (pickup.flags.includes("location_missing")) {
    return <span className="badge badge-incomplete">Ubicación faltante</span>;
  }
  return <span className="pickup-row-status">{pickup.address}</span>;
}

// Pantalla "Pickups del día" (Épica 6).
export function PickupsView() {
  const v = usePickupsView();
  const route = v.route;

  return (
    <section className="screen" data-screen="pickups">
      <div className="screen-header">
        <h1 className="text-h1">Pickups del día</h1>
        <div className="field field-inline">
          <label htmlFor="pickup-date">Fecha</label>
          <input
            type="date"
            id="pickup-date"
            value={v.date}
            onChange={(e) => v.changeDate(e.target.value)}
          />
        </div>
      </div>

      {v.loading ? (
        <WalkingDogLoader />
      ) : v.loadError ? (
        <div className="empty-state" role="alert">
          No se pudieron cargar los pickups de este día.{" "}
          <button className="btn btn-text btn-sm" onClick={v.reload}>
            Reintentar
          </button>
        </div>
      ) : v.pickups.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <CarIcon size={32} />
          </span>
          No hay pickups programados para este día.
        </div>
      ) : v.showingRoute && route ? (
        <>
          <h2 className="text-h2" style={{ marginBottom: 8 }}>
            Ruta generada
          </h2>
          <div className="data-table">
            {route.stops.map((s, i) => (
              <div className="data-row" key={s.address}>
                <div className="route-stop">
                  <span className="route-stop-num">{i + 1}</span>
                  <div className="data-row-main">
                    <strong>{s.pets.map((p) => p.petName).join(" y ")}</strong>
                    <span className="text-small">
                      {[...new Set(s.pets.map((p) => p.ownerName))].join(", ")} · {s.address}
                    </span>
                  </div>
                </div>
                {route.stops.length > 1 ? (
                  <div className="data-row-meta">
                    <button className="btn btn-text btn-sm" onClick={() => v.openWaze(i)}>
                      Waze
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {route.excluded.map((e) => (
              <div className="data-row" key={e.appointmentId}>
                <div className="data-row-main">
                  <strong>{e.petName}</strong>
                  <span className="text-small">{EXCLUSION_LABEL[e.reason]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="map-buttons">
            <button
              className="btn btn-primary"
              disabled={!route.stops.length || v.checkingStale}
              onClick={() => void v.openWaze(0)}
            >
              Abrir en Waze
            </button>
            <button
              className="btn btn-primary"
              disabled={!route.stops.length || v.checkingStale}
              onClick={() => void v.openGoogleMaps()}
            >
              Abrir en Google Maps
            </button>
            <button className="btn btn-ghost btn-sm" onClick={v.generateRoute}>
              Regenerar
            </button>
            {!route.stops.length ? (
              <span className="text-small">
                No hay direcciones válidas — corregí las direcciones de las mascotas excluidas.
              </span>
            ) : route.stops.length > 1 ? (
              <span className="text-small">
                Waze solo admite una parada a la vez: el botón abre la primera, y cada parada tiene
                el suyo.
              </span>
            ) : null}
          </div>
          {v.mapError ? (
            <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
              {v.mapError}
            </p>
          ) : null}
          {v.blockedLink ? (
            <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
              No se pudo abrir el mapa.{" "}
              <button className="btn btn-text btn-sm" onClick={() => void v.copyBlockedLink()}>
                {v.copied ? "Link copiado" : "Copiar link"}
              </button>
            </p>
          ) : null}
        </>
      ) : (
        <>
          {v.stale ? (
            <div className="route-banner" role="alert">
              <span>La lista de pickups cambió desde que generaste la ruta.</span>
              <button className="btn btn-primary btn-sm" onClick={v.generateRoute}>
                Regenerar ruta
              </button>
            </div>
          ) : null}
          <div className="data-table">
            {v.pickups.map((p) => (
              <button
                type="button"
                className="data-row"
                key={p.appointmentId}
                onClick={() => v.openAppointment(p.appointmentId)}
                style={{ width: "100%", textAlign: "left", font: "inherit" }}
              >
                <div className="data-row-main">
                  <strong>{p.petName}</strong>
                  <span className="text-small">
                    {p.ownerName} · {p.startTime ?? "hora inválida"}
                  </span>
                </div>
                <div className="data-row-meta">
                  <PickupStatus pickup={p} />
                </div>
              </button>
            ))}
          </div>
          {v.routeError ? (
            <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
              No se pudo generar la ruta. Te dejamos la lista sin ordenar; probá de nuevo en un
              rato.
            </p>
          ) : null}
          <div className="map-buttons">
            <button
              className="btn btn-primary"
              onClick={v.generateRoute}
              disabled={v.generating}
              aria-busy={v.generating}
            >
              {v.generating ? <PawPrintsSpinner /> : "Generar ruta"}
            </button>
          </div>
        </>
      )}

      {v.openAppointmentId ? (
        <AppointmentDetailModal
          appointmentId={v.openAppointmentId}
          onClose={v.closeAppointment}
          onEdit={(appt) => {
            v.closeAppointment();
            v.setEditingAppointment(appt);
          }}
        />
      ) : null}
      {v.editingAppointment ? (
        <AppointmentForm
          appointment={v.editingAppointment}
          onClose={() => v.setEditingAppointment(null)}
        />
      ) : null}
    </section>
  );
}
