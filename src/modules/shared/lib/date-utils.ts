// Helpers de fecha/hora en formato ISO (yyyy-mm-dd) y HH:MM — sin
// dependencias externas, igual que en el prototipo (docs/prototype/app.js).

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function addMonths(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setMonth(d.getMonth() + n);
  return toISODate(d);
}

export const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatDateLong(iso: string): string {
  const d = fromISODate(iso);
  return `${WEEKDAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}.`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
}

export function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function digitsOnly(s: string | null | undefined): string {
  return String(s ?? "").replace(/\D/g, "");
}
