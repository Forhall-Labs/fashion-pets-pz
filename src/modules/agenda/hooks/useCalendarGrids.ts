"use client";

import { MONTH_NAMES, isDateBlackedOut, toISODate } from "@/modules/shared/lib/date-utils";
import type { Appointment, BlackoutPeriod } from "@/modules/shared/types";

function startOfGrid(year: number, monthIndex: number) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes primero
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  return gridStart;
}

// Puerto de renderYear() — la única vista que sigue siendo un grid CSS
// custom (react-big-calendar no soporta año nativo, ver docs/ui-spec.md).
// Día/Semana/Mes ahora los resuelve RbcCalendar.tsx contra datos reales.
export function useYearGrid(
  appointments: Appointment[],
  blackoutPeriods: BlackoutPeriod[],
  year: number,
) {
  const months = MONTH_NAMES.map((name, m) => {
    const gridStart = startOfGrid(year, m);
    const miniDays = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      if (d.getMonth() !== m) return null;
      const iso = toISODate(d);
      return {
        iso,
        dayNum: d.getDate(),
        // Solo cuenta citas activas — una cancelada no debería leerse como
        // "día ocupado" en el pantallazo anual.
        count: appointments.filter((a) => a.date === iso && a.status === "scheduled").length,
        blackout: isDateBlackedOut(iso, blackoutPeriods),
      };
    });
    return { monthIndex: m, name, miniDays };
  });

  return { months };
}
