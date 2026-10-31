"use client";

import { SizeBadge } from "@/modules/shared/components/Badge";
import { HourglassIcon } from "@/modules/shared/components/HourglassIcon";
import { WalkingDogLoader } from "@/modules/shared/components/WalkingDogLoader";
import { formatDateShort } from "@/modules/shared/lib/date-utils";
import { SIZE_LABEL } from "@/modules/shared/lib/labels";
import type { PetSize } from "@/modules/shared/types";

import { WaitingListForm } from "./WaitingListForm";
import { useWaitingListView, waitingDays } from "./hooks/useWaitingListView";

function rangeLabel(start: string | null, end: string | null) {
  if (start && end) return `${formatDateShort(start)} – ${formatDateShort(end)}`;
  if (start) return `Desde ${formatDateShort(start)}`;
  if (end) return `Hasta ${formatDateShort(end)}`;
  return "Sin rango preferido";
}

// Pantalla "Lista de espera" (Épica 5). La recomendación para un lugar
// liberado no vive acá: se abre sola al cancelar o mover una cita
// (<VacatedSlotHost/> en el shell).
export function WaitingListView() {
  const v = useWaitingListView();

  return (
    <section className="screen" data-screen="waiting-list">
      <div className="screen-header">
        <h1 className="text-h1">
          Lista de espera{v.entries.length ? ` (${v.entries.length})` : ""}
        </h1>
        <button className="btn btn-primary" onClick={v.openNew}>
          + Agregar mascota
        </button>
      </div>

      {v.loading ? (
        <WalkingDogLoader />
      ) : v.loadError ? (
        <div className="empty-state" role="alert">
          No se pudo cargar la lista de espera.{" "}
          <button className="btn btn-text btn-sm" onClick={v.reload}>
            Reintentar
          </button>
        </div>
      ) : v.entries.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <HourglassIcon size={32} />
          </span>
          No hay mascotas en la lista de espera.
        </div>
      ) : (
        <div className="data-table">
          {v.entries.map((w) => {
            const days = waitingDays(w.createdAt);
            return (
              <div className="data-row" key={w.id}>
                <div className="data-row-main">
                  <strong>{w.petName}</strong>
                  <span className="text-small">{w.ownerName}</span>
                  {w.staleReason ? (
                    <span className="text-small" style={{ color: "var(--color-danger)" }}>
                      {w.staleReason}
                    </span>
                  ) : null}
                </div>
                <div className="data-row-meta">
                  {w.size in SIZE_LABEL ? (
                    <SizeBadge size={w.size as PetSize} />
                  ) : (
                    <span className="badge badge-incomplete">Tamaño inválido</span>
                  )}
                  <span className="text-small">
                    {rangeLabel(w.preferredStartDate, w.preferredEndDate)}
                  </span>
                  <span className="text-small">
                    Esperando hace {days} día{days === 1 ? "" : "s"}
                  </span>
                  <button className="btn btn-text btn-sm" onClick={() => v.openEdit(w)}>
                    Editar
                  </button>
                  <button
                    className="btn btn-text btn-sm"
                    onClick={() => v.remove(w.id)}
                    disabled={v.removingId === w.id}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {v.removeError ? (
        <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
          {v.removeError}
        </p>
      ) : null}

      {v.form ? (
        <WaitingListForm
          key={v.form.entry?.id ?? "new"}
          entry={v.form.entry}
          existing={v.entries}
          onEditExisting={v.openEdit}
          onClose={v.closeForm}
        />
      ) : null}
    </section>
  );
}
