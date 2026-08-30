"use client";

import { useState } from "react";

import {
  MONTH_NAMES,
  addDays,
  addMonths,
  formatDateShort,
  fromISODate,
  toISODate,
} from "@/modules/shared/lib/date-utils";
import { TODAY_ISO } from "@/modules/shared/lib/mock-data";

export type CalView = "day" | "week" | "month" | "year";

export const VIEW_TABS: { view: CalView; label: string }[] = [
  { view: "day", label: "Día" },
  { view: "week", label: "Semana" },
  { view: "month", label: "Mes" },
  { view: "year", label: "Año" },
];

// Puerto de renderAgenda() de app.js. Drag-and-drop y "Nueva cita" quedan
// para la próxima etapa.
export function useAgendaView() {
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

  function goToToday() {
    setAnchor(TODAY_ISO);
  }

  function gotoMonth(monthIndex: number) {
    setAnchor(toISODate(new Date(anchorDate.getFullYear(), monthIndex, 1)));
    setView("month");
  }

  let label: string;
  let weekDays: string[] | null = null;

  if (view === "day") {
    label = `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getDate()}, ${anchorDate.getFullYear()}`;
  } else if (view === "week") {
    const monday = new Date(anchorDate);
    monday.setDate(anchorDate.getDate() - ((anchorDate.getDay() + 6) % 7));
    weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return toISODate(d);
    });
    label = `${formatDateShort(weekDays[0])} – ${formatDateShort(weekDays[6])}`;
  } else if (view === "month") {
    label = `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
  } else {
    label = String(anchorDate.getFullYear());
  }

  return {
    view,
    setView,
    label,
    anchor,
    anchorDate,
    weekDays,
    todayIso: TODAY_ISO,
    openAppointmentId,
    openAppointment: setOpenAppointmentId,
    closeAppointment: () => setOpenAppointmentId(null),
    shift,
    goToToday,
    gotoMonth,
  };
}
