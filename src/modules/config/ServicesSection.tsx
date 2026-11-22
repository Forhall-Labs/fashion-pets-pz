"use client";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";
import { Modal, ModalHeader } from "@/modules/shared/components/Modal";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import type { Service } from "@/modules/shared/types";

import { useServicesSection } from "./hooks/useServicesSection";

function durationsLabel(s: Service): string {
  return `Pequeño ${s.durationSmallMinutes} · Mediano ${s.durationMediumMinutes} · Extra grande ${s.durationExtraLargeMinutes} min`;
}

const DURATION_FIELDS = [
  { name: "durationSmallMinutes", id: "sf-small", label: "Pequeño (min)" },
  { name: "durationMediumMinutes", id: "sf-medium", label: "Mediano (min)" },
  { name: "durationExtraLargeMinutes", id: "sf-xl", label: "Extra grande (min)" },
] as const;

// Épica 8 — catálogo de servicios con duración sugerida por tamaño. El
// grooming completo no está acá: usa la duración promedio de cada mascota.
export function ServicesSection() {
  const s = useServicesSection();

  return (
    <div className="config-section card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="text-h2">Servicios</h2>
        <button className="btn btn-primary btn-sm" onClick={s.openNew}>
          + Agregar servicio
        </button>
      </div>
      <span className="text-small">
        Servicios además del grooming completo, con su duración sugerida según el tamaño. Al agendar
        se puede ajustar.
      </span>
      <div className="blackout-list">
        {s.loading ? (
          <span className="text-small">Cargando…</span>
        ) : s.loadError ? (
          <span className="text-small">
            No se pudieron cargar los servicios.{" "}
            <button className="btn btn-text btn-sm" onClick={s.reload}>
              Reintentar
            </button>
          </span>
        ) : s.services.length === 0 ? (
          <span className="text-small">Todavía no hay servicios.</span>
        ) : (
          s.services.map((svc) => (
            <div className="blackout-item" key={svc.id}>
              <span>
                <strong>{svc.name}</strong>
                {!svc.active ? <span className="badge badge-incomplete"> Desactivado</span> : null}
                <br />
                <span className="text-small">{durationsLabel(svc)}</span>
              </span>
              <span>
                <button className="btn btn-text btn-sm" onClick={() => s.openEdit(svc)}>
                  Editar
                </button>
                <button
                  className="btn btn-text btn-sm"
                  onClick={() => s.toggleActive(svc)}
                  disabled={s.togglingId === svc.id}
                >
                  {svc.active ? "Desactivar" : "Reactivar"}
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {s.editing ? (
        <Modal onClose={s.close}>
          <ModalHeader
            title={s.editing === "new" ? "Agregar servicio" : "Editar servicio"}
            onClose={s.close}
          />
          <form onSubmit={s.handleSubmit} noValidate>
            <div className={`field ${s.errors.name ? "has-error" : ""}`}>
              <label htmlFor="sf-name">Nombre</label>
              <input id="sf-name" placeholder="Ej.: Baño" {...s.register("name")} />
              <span className="error-msg">{s.errors.name?.message}</span>
            </div>
            <span className="text-small">Duración sugerida según el tamaño de la mascota:</span>
            <div className="field-row">
              {DURATION_FIELDS.map((f) => (
                <div className={`field ${s.errors[f.name] ? "has-error" : ""}`} key={f.name}>
                  <label htmlFor={f.id}>{f.label}</label>
                  <input id={f.id} inputMode="numeric" {...s.register(f.name)} />
                  <span className="error-msg">{s.errors[f.name]?.message}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={s.close}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${s.saving ? "btn-loading" : ""}`}
                disabled={s.saving}
              >
                {s.saving ? <PawPrintsSpinner /> : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {s.error ? (
        <ErrorModal title="No se pudo guardar" message={s.error} onClose={s.clearError} />
      ) : null}
    </div>
  );
}
