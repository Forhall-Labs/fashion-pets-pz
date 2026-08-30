"use client";

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

export const MONTH_WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function startOfGrid(year: number, monthIndex: number) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes primero
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  return gridStart;
}

// Puerto de renderDayOrWeek() — sirve tanto para la vista Día (1 columna)
// como Semana (7 columnas).
export function useDayWeekGrid(data: MockData, days: string[]) {
  const openMin = timeToMinutes(data.shopConfig.openTime);
  const closeMin = timeToMinutes(data.shopConfig.closeTime);
  const hours: number[] = [];
  for (let m = openMin; m < closeMin; m += 60) hours.push(m);

  const dayHeaders = days.map((d) => {
    const dObj = fromISODate(d);
    return { iso: d, label: `${WEEKDAY_SHORT[dObj.getDay()]} ${dObj.getDate()}` };
  });

  const rows = hours.map((hMin) => ({
    hMin,
    label: minutesToTime(hMin),
    cells: days.map((d) => {
      const blackout = isBlackoutDate(data, d);
      const appts = appointmentsOnDate(data, d)
        .filter((a) => {
          const s = timeToMinutes(a.startTime);
          return s >= hMin && s < hMin + 60;
        })
        .map((a) => ({ ...a, pet: getPet(data, a.petId)! }));
      return { key: `${d}-${hMin}`, blackout, appts };
    }),
  }));

  return { dayHeaders, rows };
}

// Puerto de renderMonth().
export function useMonthGrid(data: MockData, year: number, monthIndex: number, todayIso: string) {
  const gridStart = startOfGrid(year, monthIndex);

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = toISODate(d);
    const dayAppts = appointmentsOnDate(data, iso).map((a) => ({
      ...a,
      pet: getPet(data, a.petId)!,
    }));
    return {
      iso,
      dayNum: d.getDate(),
      otherMonth: d.getMonth() !== monthIndex,
      blackout: isBlackoutDate(data, iso),
      isToday: iso === todayIso,
      appts: dayAppts.slice(0, 3),
      moreCount: Math.max(0, dayAppts.length - 3),
    };
  });

  return { weekdayLabels: MONTH_WEEKDAY_LABELS, cells };
}

// Puerto de renderYear().
export function useYearGrid(data: MockData, year: number) {
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
        hasAppt: appointmentsOnDate(data, iso).length > 0,
        blackout: isBlackoutDate(data, iso),
      };
    });
    return { monthIndex: m, name, miniDays };
  });

  return { months };
}
