import type { Appointment, BlackoutPeriod } from "@/modules/shared/types";

import { useYearGrid } from "./hooks/useCalendarGrids";

// Puerto de renderYear() — Día/Semana/Mes ahora los resuelve RbcCalendar.tsx
// (react-big-calendar); esta sigue siendo la única vista con grid CSS
// custom, ya que la librería no soporta año nativo.
export function YearGrid({
  appointments,
  blackoutPeriods,
  year,
  onGotoMonth,
  onGotoDay,
}: {
  appointments: Appointment[];
  blackoutPeriods: BlackoutPeriod[];
  year: number;
  onGotoMonth: (monthIndex: number) => void;
  onGotoDay: (iso: string) => void;
}) {
  const { months } = useYearGrid(appointments, blackoutPeriods, year);

  return (
    <div className="cal-year-grid">
      {months.map((month) => (
        <div
          className="cal-year-month"
          key={month.monthIndex}
          onClick={() => onGotoMonth(month.monthIndex)}
          role="button"
          tabIndex={0}
        >
          <div className="cal-year-month-title">{month.name}</div>
          <div className="cal-year-mini-grid">
            {month.miniDays.map((day, i) =>
              day === null ? (
                <div className="cal-year-mini-day" key={i} />
              ) : (
                <div
                  className={`cal-year-mini-day ${day.count > 0 ? "has-appt" : ""} ${day.blackout ? "is-blackout" : ""}`}
                  key={day.iso}
                  role="button"
                  tabIndex={0}
                  title={day.count > 0 ? `${day.count} cita(s)` : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGotoDay(day.iso);
                  }}
                >
                  {day.dayNum}
                  {day.count > 0 ? (
                    <span className="cal-year-mini-day-count">{day.count}</span>
                  ) : null}
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
