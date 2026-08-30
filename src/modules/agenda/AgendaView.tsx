"use client";

import type { ReactNode } from "react";

import { AppointmentDetailModal } from "@/modules/shared/AppointmentDetailModal";
import { mockData } from "@/modules/shared/mock-data";

import { DayWeekGrid, MonthGrid, YearGrid } from "./CalendarGrids";
import { VIEW_TABS, useAgendaView } from "./hooks/useAgendaView";

// Puerto de la pantalla Agenda (screen-header + agenda-toolbar +
// #calendar-root) de docs/prototype/prototype.html + renderAgenda() de
// app.js. Drag-and-drop y "Nueva cita" quedan para la próxima etapa.
export function AgendaView() {
  const {
    view,
    setView,
    label,
    anchor,
    anchorDate,
    weekDays,
    todayIso,
    openAppointmentId,
    openAppointment,
    closeAppointment,
    shift,
    goToToday,
    gotoMonth,
  } = useAgendaView();

  let grid: ReactNode;
  if (view === "day") {
    grid = <DayWeekGrid data={mockData} days={[anchor]} onOpenAppointment={openAppointment} />;
  } else if (view === "week") {
    grid = <DayWeekGrid data={mockData} days={weekDays!} onOpenAppointment={openAppointment} />;
  } else if (view === "month") {
    grid = (
      <MonthGrid
        data={mockData}
        year={anchorDate.getFullYear()}
        monthIndex={anchorDate.getMonth()}
        todayIso={todayIso}
        onOpenAppointment={openAppointment}
      />
    );
  } else {
    grid = <YearGrid data={mockData} year={anchorDate.getFullYear()} onGotoMonth={gotoMonth} />;
  }

  return (
    <section className="screen" data-screen="agenda">
      <div className="screen-header">
        <h1 className="text-h1">Agenda</h1>
        <button className="btn btn-primary" disabled title="Próximamente">
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

      <div className="calendar-root">{grid}</div>

      {openAppointmentId ? (
        <AppointmentDetailModal
          data={mockData}
          appointmentId={openAppointmentId}
          onClose={closeAppointment}
        />
      ) : null}
    </section>
  );
}
