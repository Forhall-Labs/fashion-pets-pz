"use client";

import { StatusBadge } from "@/modules/shared/components/Badge";
import type { Appointment, Pet } from "@/modules/shared/types";

import { useTodayAgendaPanel } from "./hooks/useTodayAgendaPanel";

interface TodayAgendaPanelProps {
  appointments: Appointment[];
  petsById: Map<string, Pet>;
  loading: boolean;
  onOpenAppointment: (id: string) => void;
}

// Panel desplegable al lado del calendario: log del día — lo que falta de
// hoy (citas programadas que no pasaron, en vivo a medida que avanza la
// hora) más cualquier cancelación de hoy, para que quede visible que se
// canceló y no solo que "no hay nada más". No depende de qué vista/fecha
// esté mirando el usuario en el calendario principal.
export function TodayAgendaPanel({
  appointments,
  petsById,
  loading,
  onOpenAppointment,
}: TodayAgendaPanelProps) {
  const { open, toggle, items } = useTodayAgendaPanel(appointments, petsById);

  return (
    <div className="today-panel">
      <button className="btn btn-secondary btn-sm today-panel-toggle" onClick={toggle}>
        {open ? "Ocultar" : "Mostrar"} agenda de hoy
        {!loading && items.length > 0 ? ` (${items.length})` : ""}
      </button>
      {open ? (
        <div className="today-panel-body card">
          <h3 className="text-h3">Citas de hoy</h3>
          {loading ? (
            <p className="text-small">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-small">Sin novedades por hoy.</p>
          ) : (
            <ul className="today-panel-list">
              {items.map(({ appt, pet }) => (
                <li
                  key={appt.id}
                  className={appt.status === "cancelled" ? "is-cancelled" : ""}
                  onClick={() => onOpenAppointment(appt.id)}
                >
                  <span className="appt-time">{appt.startTime}</span> {pet.name}
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
