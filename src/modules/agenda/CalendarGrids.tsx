import { Fragment } from "react";

import type { MockData } from "@/modules/shared/types";

import { AppointmentTile } from "./AppointmentTile";
import { useDayWeekGrid, useMonthGrid, useYearGrid } from "./hooks/useCalendarGrids";

interface GridProps {
  data: MockData;
  onOpenAppointment: (id: string) => void;
}

// Puerto de renderDayOrWeek() — sirve tanto para la vista Día (1 columna)
// como Semana (7 columnas).
export function DayWeekGrid({ data, days, onOpenAppointment }: GridProps & { days: string[] }) {
  const { dayHeaders, rows } = useDayWeekGrid(data, days);

  return (
    <div className="cal-grid" style={{ gridTemplateColumns: `70px repeat(${days.length},1fr)` }}>
      <div className="cal-day-col-header" />
      {dayHeaders.map((h) => (
        <div className="cal-day-col-header" key={h.iso}>
          {h.label}
        </div>
      ))}
      {rows.map((row) => (
        <Fragment key={row.hMin}>
          <div className="cal-hour-label">{row.label}</div>
          {row.cells.map((cell) => (
            <div className={`cal-cell ${cell.blackout ? "is-blackout" : ""}`} key={cell.key}>
              {cell.appts.map((a) => (
                <AppointmentTile key={a.id} appt={a} pet={a.pet} onOpen={onOpenAppointment} />
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

// Puerto de renderMonth().
export function MonthGrid({
  data,
  year,
  monthIndex,
  todayIso,
  onOpenAppointment,
}: GridProps & { year: number; monthIndex: number; todayIso: string }) {
  const { weekdayLabels, cells } = useMonthGrid(data, year, monthIndex, todayIso);

  return (
    <div className="cal-month-grid">
      {weekdayLabels.map((d) => (
        <div className="cal-month-weekday" key={d}>
          {d}
        </div>
      ))}
      {cells.map((cell) => (
        <div
          className={`cal-month-day ${cell.otherMonth ? "is-other-month" : ""} ${cell.blackout ? "is-blackout" : ""} ${cell.isToday ? "is-today" : ""}`}
          key={cell.iso}
        >
          <span className="cal-month-daynum">{cell.dayNum}</span>
          {cell.appts.map((a) => (
            <AppointmentTile key={a.id} appt={a} pet={a.pet} onOpen={onOpenAppointment} />
          ))}
          {cell.moreCount > 0 ? (
            <span className="cal-month-more">+{cell.moreCount} más</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// Puerto de renderYear().
export function YearGrid({
  data,
  year,
  onGotoMonth,
}: {
  data: MockData;
  year: number;
  onGotoMonth: (monthIndex: number) => void;
}) {
  const { months } = useYearGrid(data, year);

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
                  className={`cal-year-mini-day ${day.hasAppt ? "has-appt" : ""} ${day.blackout ? "is-blackout" : ""}`}
                  key={day.iso}
                >
                  {day.dayNum}
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
