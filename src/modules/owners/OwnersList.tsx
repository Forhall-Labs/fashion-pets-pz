"use client";

import Link from "next/link";
import { useState } from "react";

import { DAY_LABEL } from "@/modules/shared/labels";
import { mockData } from "@/modules/shared/mock-data";
import { petsOfOwner } from "@/modules/shared/selectors";

// Puerto de la pantalla "Dueños — Lista" (renderOwnersList() en app.js).
// Crear dueño (modal) queda para la próxima etapa.
export function OwnersList() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const owners = mockData.owners.filter(
    (o) => !q || o.name.toLowerCase().includes(q) || o.phone.includes(q),
  );

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
          owners.map((o) => {
            const petCount = petsOfOwner(mockData, o.id).length;
            return (
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
                    {petCount} mascota{petCount === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
