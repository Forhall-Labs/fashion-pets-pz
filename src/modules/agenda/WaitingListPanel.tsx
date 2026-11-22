"use client";

import Link from "next/link";

import { SizeBadge } from "@/modules/shared/components/Badge";
import { SIZE_LABEL } from "@/modules/shared/lib/labels";
import type { WaitingEntry } from "@/modules/shared/lib/waiting-list-api";
import { waitingRangeLabel } from "@/modules/shared/lib/waiting-list-format";
import type { PetSize } from "@/modules/shared/types";

import { useWaitingListPanel } from "./hooks/useWaitingListPanel";

interface WaitingListPanelProps {
  /** Abre el formulario de cita para esa mascota; al guardar se aprueba la entrada. */
  onSchedule: (entry: WaitingEntry) => void;
}

// Panel lateral de la Agenda, al lado de "Citas de hoy": las mascotas que
// esperan un lugar, para tenerlas en cuenta al armar la agenda.
export function WaitingListPanel({ onSchedule }: WaitingListPanelProps) {
  const p = useWaitingListPanel();
  const waiting = p.items.filter((i) => !i.entry.staleReason).length;

  return (
    <div className="today-panel waiting-panel">
      <button className="btn btn-secondary btn-sm today-panel-toggle" onClick={p.toggle}>
        {p.open ? "Ocultar" : "Mostrar"} lista de espera
        {!p.loading && waiting > 0 ? ` (${waiting})` : ""}
      </button>
      {p.open ? (
        <div className="today-panel-body card">
          <h3 className="text-h3">Lista de espera</h3>
          {p.loading ? (
            <p className="text-small">Cargando…</p>
          ) : p.error ? (
            <p className="text-small">
              No se pudo cargar.{" "}
              <button className="btn btn-text btn-sm" onClick={p.reload}>
                Reintentar
              </button>
            </p>
          ) : p.items.length === 0 ? (
            <p className="text-small">Nadie esperando un lugar.</p>
          ) : (
            <>
              <div className="waiting-panel-sizes" aria-label="Esperando por tamaño">
                {p.bySize.map(({ size, count }) => (
                  <span key={size} className={`waiting-size-chip ${count ? "" : "is-empty"}`}>
                    <strong>{count}</strong> {SIZE_LABEL[size]}
                  </span>
                ))}
              </div>
              <ul className="today-panel-list waiting-panel-list">
                {p.items.map(({ entry, days, waitShare }) => (
                  <li key={entry.id} className={entry.staleReason ? "is-stale" : ""}>
                    <div className="waiting-panel-row">
                      <strong>{entry.petName}</strong>
                      {entry.size in SIZE_LABEL ? (
                        <SizeBadge size={entry.size as PetSize} />
                      ) : (
                        <span className="badge badge-incomplete">Sin tamaño</span>
                      )}
                    </div>
                    <span className="text-small waiting-panel-owner">{entry.ownerName}</span>
                    <div
                      className="waiting-bar"
                      role="img"
                      aria-label={`Esperando hace ${days} día${days === 1 ? "" : "s"}`}
                    >
                      <span style={{ width: `${Math.max(4, waitShare * 100)}%` }} />
                    </div>
                    <span className="text-small">
                      {days} día{days === 1 ? "" : "s"} esperando ·{" "}
                      {waitingRangeLabel(entry.preferredStartDate, entry.preferredEndDate)}
                    </span>
                    {entry.staleReason ? (
                      <span className="text-small waiting-panel-stale">
                        Ya tiene una cita activa: quitala de la lista.
                      </span>
                    ) : (
                      <button
                        className="btn btn-text btn-sm waiting-panel-action"
                        onClick={() => onSchedule(entry)}
                      >
                        Agendar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {p.staleCount > 0 ? (
                <p className="text-small">
                  {p.staleCount} pendiente{p.staleCount === 1 ? "" : "s"} de limpieza.
                </p>
              ) : null}
            </>
          )}
          <Link className="btn btn-text btn-sm" href="/waiting-list">
            Ver lista completa
          </Link>
        </div>
      ) : null}
    </div>
  );
}
