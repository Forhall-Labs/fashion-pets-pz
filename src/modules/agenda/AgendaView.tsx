"use client";

import { useState } from "react";

import { AppointmentDetailModal } from "@/modules/shared/AppointmentDetailModal";
import {
  MONTH_NAMES,
  addDays,
  addMonths,
  formatDateShort,
  fromISODate,
  toISODate,
} from "@/modules/shared/date-utils";
import { mockData, TODAY_ISO } from "@/modules/shared/mock-data";

import { DayWeekGrid, MonthGrid, YearGrid } from "./CalendarGrids";

type CalView = "day" | "week" | "month" | "year";

const VIEW_TABS: { view: CalView; label: string }[] = [
  { view: "day", label: "Día" },
  { view: "week", label: "Semana" },
  { view: "month", label: "Mes" },
  { view: "year", label: "Año" },
];

// Puerto de la pantalla Agenda (screen-header + agenda-toolbar +
// #calendar-root) de docs/prototype/prototype.html + renderAgenda() de
// app.js. Drag-and-drop y "Nueva cita" quedan para la próxima etapa.
export function AgendaView() {
  const [view, setView] = useState<CalView>("month");
  const [anchor, setAnchor] = useState(TODAY_ISO);
  const [openAppointmentId, setOpenAppointmentId] = useState<string | null>(null);

  const anchorDate = fromISODate(anchor);

  function shift(dir: 1 | -1) {
    if (view === "day") setAnchor((a) => addDays(a, dir));
    else if (view === "week") setAnchor((a) => addDays(a, dir * 7));
    else if (view === "month") setAnchor((a) => addMonths(a, dir));
    else setAnchor((a) => addMonths(a, dir * 12));
  }

  let label: string;
  let grid: React.ReactNode;

  if (view === "day") {
    label = `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getDate()}, ${anchorDate.getFullYear()}`;
    grid = <DayWeekGrid data={mockData} days={[anchor]} onOpenAppointment={setOpenAppointmentId} />;
  } else if (view === "week") {
    const monday = new Date(anchorDate);
    monday.setDate(anchorDate.getDate() - ((anchorDate.getDay() + 6) % 7));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return toISODate(d);
    });
    label = `${formatDateShort(days[0])} – ${formatDateShort(days[6])}`;
    grid = <DayWeekGrid data={mockData} days={days} onOpenAppointment={setOpenAppointmentId} />;
  } else if (view === "month") {
    label = `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
    grid = (
      <MonthGrid
        data={mockData}
        year={anchorDate.getFullYear()}
        monthIndex={anchorDate.getMonth()}
        todayIso={TODAY_ISO}
        onOpenAppointment={setOpenAppointmentId}
      />
    );
  } else {
    label = String(anchorDate.getFullYear());
    grid = (
      <YearGrid
        data={mockData}
        year={anchorDate.getFullYear()}
        onGotoMonth={(m) => {
          setAnchor(toISODate(new Date(anchorDate.getFullYear(), m, 1)));
          setView("month");
        }}
      />
    );
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
          <button className="btn btn-secondary btn-sm" onClick={() => setAnchor(TODAY_ISO)}>
            Hoy
          </button>
        </div>
      </div>

      <div className="calendar-root">{grid}</div>

      {openAppointmentId ? (
        <AppointmentDetailModal
          data={mockData}
          appointmentId={openAppointmentId}
          onClose={() => setOpenAppointmentId(null)}
        />
      ) : null}
    </section>
  );
}
