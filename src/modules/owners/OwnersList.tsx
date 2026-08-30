"use client";

import Link from "next/link";

import { DAY_LABEL } from "@/modules/shared/lib/labels";

import { useOwnersList } from "./hooks/useOwnersList";

// Puerto de la pantalla "Dueños — Lista" (renderOwnersList() en app.js).
// Crear dueño (modal) queda para la próxima etapa.
export function OwnersList() {
  const { query, setQuery, owners } = useOwnersList();

  return (
    <section className="screen" data-screen="owners">
      <div className="screen-header">
        <h1 className="text-h1">Dueños</h1>
        <button className="btn btn-primary" disabled title="Próximamente">
          + Nuevo dueño
        </button>
      </div>
      <div className="field field-search">
        <input
          type="search"
          placeholder="Buscar por nombre o teléfono…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="data-table">
        {owners.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>No se encontraron dueños.
          </div>
        ) : (
          owners.map((o) => (
            <Link href={`/owners/${o.id}`} className="data-row" key={o.id}>
              <div className="data-row-main">
                <strong>{o.name}</strong>
                <span className="text-small">{o.phone}</span>
              </div>
              <div className="data-row-meta">
                {o.fixedVisitDay ? (
                  <span className="badge badge-size">Día fijo: {DAY_LABEL[o.fixedVisitDay]}</span>
                ) : null}
                <span className="text-small">
                  {o.petCount} mascota{o.petCount === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
