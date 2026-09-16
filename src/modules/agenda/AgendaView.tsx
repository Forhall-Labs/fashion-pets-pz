"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { AppointmentDetailModal } from "@/modules/shared/components/AppointmentDetailModal";
import { AppointmentForm } from "@/modules/shared/components/AppointmentForm";
import { WalkingDogLoader } from "@/modules/shared/components/WalkingDogLoader";
import { WarningIcon } from "@/modules/shared/components/WarningIcon";
import type { Appointment } from "@/modules/shared/types";

import { RbcCalendar } from "./RbcCalendar";
import { TodayAgendaPanel } from "./TodayAgendaPanel";
import { YearGrid } from "./CalendarGrids";
import { VIEW_TABS, useAgendaView } from "./hooks/useAgendaView";
import { useAgendaData } from "./hooks/useAgendaData";

// Puerto de la pantalla Agenda (screen-header + agenda-toolbar +
// #calendar-root) de docs/prototype/prototype.html + renderAgenda() de
// app.js — Día/Semana/Mes ahora corren sobre react-big-calendar (ver
// RbcCalendar.tsx) contra datos reales; Año sigue siendo el grid custom.
// Drag-and-drop queda para la próxima etapa (Sprint 4).
export function AgendaView() {
  const {
    view,
    setView,
    label,
    anchor,
    anchorDate,
    weekDays,
    openAppointmentId,
    openAppointment,
    closeAppointment,
    shift,
    goToToday,
    gotoMonth,
  } = useAgendaView();

  const {
    appointments,
    petsById,
    blackoutPeriods,
    todayAppointments,
    todayLoading,
    loading,
    error,
    refetch,
  } = useAgendaData(view, anchor, anchorDate, weekDays);

  const [formState, setFormState] = useState<
    { mode: "create"; presetDate: string } | { mode: "edit"; appointment: Appointment } | null
  >(null);

  let grid: ReactNode;
  if (loading) {
    grid = <WalkingDogLoader />;
  } else if (error) {
    grid = (
      <div className="empty-state">
        <span className="empty-state-icon">
          <WarningIcon size={32} />
        </span>
        No se pudieron cargar las citas.
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refetch}>
            Reintentar
          </button>
        </div>
      </div>
    );
  } else if (view === "year") {
    grid = (
      <YearGrid
        appointments={appointments}
        blackoutPeriods={blackoutPeriods}
        year={anchorDate.getFullYear()}
        onGotoMonth={gotoMonth}
      />
    );
  } else {
    // El calendario se muestra siempre (incluso sin citas) para que el
    // rayado de blackout sea visible — un día bloqueado normalmente no
    // tiene ninguna cita, así que ocultar el grid entero en ese caso
    // escondía justo lo que se quiere resaltar. El aviso de "sin citas" va
    // como nota arriba, no reemplaza el grid.
    grid = (
      <>
        {appointments.length === 0 ? (
          <div className="empty-state" style={{ padding: "var(--space-3)" }}>
            No hay citas{" "}
            {view === "day" ? "este día" : view === "week" ? "esta semana" : "este mes"}.
          </div>
        ) : null}
        <RbcCalendar
          view={view}
          date={anchorDate}
          appointments={appointments}
          petsById={petsById}
          blackoutPeriods={blackoutPeriods}
          onOpenAppointment={openAppointment}
        />
      </>
    );
  }

  return (
    <section className="screen" data-screen="agenda">
      <div className="screen-header">
        <h1 className="text-h1">Agenda</h1>
        <button
          className="btn btn-primary"
          onClick={() => setFormState({ mode: "create", presetDate: anchor })}
        >
          + Nueva cita
        </button>
      </div>

      <div className="agenda-toolbar">
        <div className="view-tabs">
          {VIEW_TABS.map((t) => (
            <button
              key={t.view}
              className={`view-tab ${view === t.view ? "is-active" : ""}`}
              onClick={() => setView(t.view)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="agenda-nav">
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Anterior"
            onClick={() => shift(-1)}
          >
            ‹
          </button>
          <span className="agenda-current-label">{label}</span>
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Siguiente"
            onClick={() => shift(1)}
          >
            ›
          </button>
          <button className="btn btn-secondary btn-sm" onClick={goToToday}>
            Hoy
          </button>
        </div>
      </div>

      <div className="agenda-with-today-panel">
        <div className="calendar-root">{grid}</div>
        <TodayAgendaPanel
          appointments={todayAppointments}
          petsById={petsById}
          loading={todayLoading}
          onOpenAppointment={openAppointment}
        />
      </div>

      {openAppointmentId ? (
        <AppointmentDetailModal
          appointmentId={openAppointmentId}
          onClose={closeAppointment}
          onEdit={(appt) => {
            closeAppointment();
            setFormState({ mode: "edit", appointment: appt });
          }}
        />
      ) : null}

      {formState ? (
        <AppointmentForm
          appointment={formState.mode === "edit" ? formState.appointment : null}
          presetDate={formState.mode === "create" ? formState.presetDate : undefined}
          onClose={() => setFormState(null)}
        />
      ) : null}
    </section>
  );
}
