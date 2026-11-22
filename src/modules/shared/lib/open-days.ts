import { fromISODate } from "./date-utils";
import { DAY_OPTIONS } from "./labels";
import type { Weekday } from "../types";

// Espejo de parseOpenWeekdays/isOpenDay del API (appointment-validation.rules.ts):
// los días de la semana que se atiende (Configuración → Horario).

/** Lunes a sábado: lo que usa el API si nunca se configuró otra cosa. */
export const DEFAULT_OPEN_WEEKDAYS: readonly Weekday[] = DAY_OPTIONS.filter((d) => d !== "sunday");

const WEEKDAY_PLURAL: Record<Weekday, string> = {
  monday: "los lunes",
  tuesday: "los martes",
  wednesday: "los miércoles",
  thursday: "los jueves",
  friday: "los viernes",
  saturday: "los sábados",
  sunday: "los domingos",
};

export function weekdayOfISO(iso: string): Weekday {
  const jsDay = fromISODate(iso).getDay(); // 0 = domingo
  return jsDay === 0 ? "sunday" : (DAY_OPTIONS[jsDay - 1] ?? "monday");
}

export function isOpenDayISO(iso: string, openWeekdays: readonly Weekday[]): boolean {
  return openWeekdays.includes(weekdayOfISO(iso));
}

export function closedDayMessage(iso: string): string {
  return `La tienda no atiende ${WEEKDAY_PLURAL[weekdayOfISO(iso)]}. Elegí otro día.`;
}
