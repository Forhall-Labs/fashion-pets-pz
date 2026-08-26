import { Fragment } from "react";

import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  fromISODate,
  minutesToTime,
  timeToMinutes,
  toISODate,
} from "@/modules/shared/date-utils";
import { appointmentsOnDate, getPet, isBlackoutDate } from "@/modules/shared/selectors";
import type { MockData } from "@/modules/shared/types";

import { AppointmentTile } from "./AppointmentTile";

interface GridProps {
  data: MockData;
  onOpenAppointment: (id: string) => void;
}

// Puerto de renderDayOrWeek() — sirve tanto para la vista Día (1 columna)
// como Semana (7 columnas).
export function DayWeekGrid({ data, days, onOpenAppointment }: GridProps & { days: string[] }) {
  const openMin = timeToMinutes(data.shopConfig.openTime);
  const closeMin = timeToMinutes(data.shopConfig.closeTime);
  const hours: number[] = [];
  for (let m = openMin; m < closeMin; m += 60) hours.push(m);

  return (
    <div className="cal-grid" style={{ gridTemplateColumns: `70px repeat(${days.length},1fr)` }}>
      <div className="cal-day-col-header" />
      {days.map((d) => {
        const dObj = fromISODate(d);
        return (
          <div className="cal-day-col-header" key={d}>
            {WEEKDAY_SHORT[dObj.getDay()]} {dObj.getDate()}
          </div>
        );
      })}
      {hours.map((hMin) => (
        <Fragment key={hMin}>
          <div className="cal-hour-label">{minutesToTime(hMin)}</div>
          {days.map((d) => {
            const blackout = isBlackoutDate(data, d);
            const cellAppts = appointmentsOnDate(data, d).filter((a) => {
              const s = timeToMinutes(a.startTime);
              return s >= hMin && s < hMin + 60;
            });
            return (
              <div className={`cal-cell ${blackout ? "is-blackout" : ""}`} key={`${d}-${hMin}`}>
                {cellAppts.map((a) => (
                  <AppointmentTile
                    key={a.id}
                    appt={a}
                    pet={getPet(data, a.petId)!}
                    onOpen={onOpenAppointment}
                  />
                ))}
              </div>
            );
          })}
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
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes primero
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  return (
    <div className="cal-month-grid">
      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
        <div className="cal-month-weekday" key={d}>
          {d}
        </div>
      ))}
      {cells.map((d) => {
        const iso = toISODate(d);
        const otherMonth = d.getMonth() !== monthIndex;
        const blackout = isBlackoutDate(data, iso);
        const dayAppts = appointmentsOnDate(data, iso);
        const isToday = iso === todayIso;
        return (
          <div
            className={`cal-month-day ${otherMonth ? "is-other-month" : ""} ${blackout ? "is-blackout" : ""} ${isToday ? "is-today" : ""}`}
            key={iso}
          >
            <span className="cal-month-daynum">{d.getDate()}</span>
            {dayAppts.slice(0, 3).map((a) => (
              <AppointmentTile
                key={a.id}
                appt={a}
                pet={getPet(data, a.petId)!}
                onOpen={onOpenAppointment}
              />
            ))}
            {dayAppts.length > 3 ? (
              <span className="cal-month-more">+{dayAppts.length - 3} más</span>
            ) : null}
          </div>
        );
      })}
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
  return (
    <div className="cal-year-grid">
      {MONTH_NAMES.map((name, m) => {
        const firstOfMonth = new Date(year, m, 1);
        const startOffset = (firstOfMonth.getDay() + 6) % 7;
        const gridStart = new Date(firstOfMonth);
        gridStart.setDate(firstOfMonth.getDate() - startOffset);
        const miniDays = Array.from({ length: 42 }, (_, i) => {
          const d = new Date(gridStart);
          d.setDate(gridStart.getDate() + i);
          return d;
        });
        return (
          <div
            className="cal-year-month"
            key={m}
            onClick={() => onGotoMonth(m)}
            role="button"
            tabIndex={0}
          >
            <div className="cal-year-month-title">{name}</div>
            <div className="cal-year-mini-grid">
              {miniDays.map((d, i) => {
                if (d.getMonth() !== m) return <div className="cal-year-mini-day" key={i} />;
                const iso = toISODate(d);
                const has = appointmentsOnDate(data, iso).length > 0;
                const blackout = isBlackoutDate(data, iso);
                return (
                  <div
                    className={`cal-year-mini-day ${has ? "has-appt" : ""} ${blackout ? "is-blackout" : ""}`}
                    key={iso}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
