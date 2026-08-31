"use client";

import { useState } from "react";
import Link from "next/link";

import { DAY_LABEL } from "@/modules/shared/lib/labels";
import { WalkingDogLoader } from "@/modules/shared/components/WalkingDogLoader";

import { OwnerForm } from "./OwnerForm";
import { useOwnersList } from "./hooks/useOwnersList";

// Puerto de la pantalla "Dueños — Lista" (renderOwnersList() en app.js).
export function OwnersList() {
  const { query, setQuery, owners, page, setPage, totalPages, loading, error } = useOwnersList();
  const [creating, setCreating] = useState(false);

  return (
    <section className="screen" data-screen="owners">
      <div className="screen-header">
        <h1 className="text-h1">Dueños</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
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
      {error && (
        <div className="empty-state">
          <span className="empty-state-icon">⚠️</span>
          {error}
        </div>
      )}
      {!error && loading && owners.length === 0 ? (
        <WalkingDogLoader />
      ) : (
        <>
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
                      <span className="badge badge-size">
                        Día fijo: {DAY_LABEL[o.fixedVisitDay]}
                      </span>
                    ) : null}
                    <span className="text-small">
                      {o.petCount} mascota{o.petCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="modal-actions" style={{ justifyContent: "center", marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Anterior
              </button>
              <span className="text-small">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
      {creating && <OwnerForm existingOwners={owners} onClose={() => setCreating(false)} />}
    </section>
  );
}
