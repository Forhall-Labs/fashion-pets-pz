"use client";

import { SizeBadge } from "@/modules/shared/components/Badge";
import { formatDateShort } from "@/modules/shared/lib/date-utils";

import { useWaitingListView } from "./hooks/useWaitingListView";

// Puerto de la pantalla "Lista de Espera" (renderWaitingList() en app.js).
// La Recommendation Card (HU-5.2/5.3) aparece cuando se libera un turno —
// eso depende de poder cancelar/mover citas, que todavía no está wireado
// acá. "+ Agregar mascota" (modal) queda para la próxima etapa también.
export function WaitingListView() {
  const { active } = useWaitingListView();

  return (
    <section className="screen" data-screen="waiting-list">
      <div className="screen-header">
        <h1 className="text-h1">Lista de espera</h1>
        <button className="btn btn-primary" disabled title="Próximamente">
          + Agregar mascota
        </button>
      </div>

      {active.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">⏳</span>No hay mascotas en la lista de espera.
        </div>
      ) : (
        <div className="data-table">
          <h2 className="text-h2" style={{ marginBottom: 8 }}>
            Todas las entradas
          </h2>
          {active.map((w) => (
            <div className="data-row" key={w.id}>
              <div className="data-row-main">
                <strong>{w.pet.name}</strong>
                <span className="text-small">{w.owner.name}</span>
              </div>
              <div className="data-row-meta">
                <SizeBadge size={w.pet.size} />
                <span className="text-small">
                  {w.preferredStartDate
                    ? `${formatDateShort(w.preferredStartDate)} – ${formatDateShort(w.preferredEndDate!)}`
                    : "Sin rango preferido"}
                </span>
                <span className="text-small">
                  Esperando hace {w.waitingDays} día{w.waitingDays === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
