"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { isDateBlackedOut, timeOfDay, toISODate } from "@/modules/shared/lib/date-utils";
import type { Appointment, BlackoutPeriod, Pet } from "@/modules/shared/types";

import { appointmentTileClasses, useAppointmentTile } from "./hooks/useAppointmentTile";

// Wrapper de react-big-calendar para Día/Semana/Mes (la vista Año sigue
// siendo el grid custom de CalendarGrids.tsx — react-big-calendar no la
// soporta nativo, ver docs/ui-spec.md). El toolbar propio de RBC va
// deshabilitado: la navegación (prev/next/"Hoy"/tabs) la maneja el
// agenda-toolbar existente en AgendaView.tsx, este componente es 100%
// controlado por props (view/date).
//
// El addon oficial de drag-and-drop (withDragAndDrop) no depende de
// react-dnd ni de ninguna librería externa — EventWrapper conecta
// onMouseDown y onTouchStart al mismo handler, así que mouse y touch ya
// vienen resueltos sin agregar dnd-kit (verificado contra el código
// instalado, node_modules/react-big-calendar/lib/addons/dragAndDrop).
const DnDCalendar = withDragAndDrop<RbcEvent>(Calendar);

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

export interface RbcEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: { appt: Appointment; pet: Pet };
}

function EventContent({ event }: { event: RbcEvent }) {
  const { appt, pet } = event.resource;
  const { cancelledSuffix } = useAppointmentTile(appt, pet, () => {});
  return (
    <>
      <span className="appt-time">{appt.startTime}</span>
      {pet.name}
      {cancelledSuffix}
    </>
  );
}

function eventPropGetter(event: RbcEvent) {
  return { className: appointmentTileClasses(event.resource.appt).join(" ") };
}

// dayPropGetter cubre tanto la celda de Mes como la columna de fondo de
// Día/Semana en el time-grid — un solo prop resalta blackout en las 3
// vistas. Mismo patrón visual (rayado) que ya usaba .cal-cell.is-blackout
// en el grid custom viejo y .cal-year-mini-day.is-blackout en Año.
function makeDayPropGetter(blackoutPeriods: BlackoutPeriod[]) {
  return (date: Date) => {
    if (!isDateBlackedOut(toISODate(date), blackoutPeriods)) return {};
    return { className: "is-blackout" };
  };
}

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

interface RbcCalendarProps {
  view: "day" | "week" | "month";
  date: Date;
  appointments: Appointment[];
  petsById: Map<string, Pet>;
  blackoutPeriods: BlackoutPeriod[];
  onOpenAppointment: (id: string) => void;
  onReschedule: (id: string, input: { date: string; startTime: string }) => void;
  onDrillDown: (date: Date) => void;
}

// Solo citas activas se pueden arrastrar — refuerza en la UI la misma
// guardia que AppointmentsService.update() aplica del lado del backend
// (una cita cancelada/completada no se puede reprogramar).
function draggableAccessor(event: RbcEvent) {
  return event.resource.appt.status === "scheduled";
}

export function RbcCalendar({
  view,
  date,
  appointments,
  petsById,
  blackoutPeriods,
  onOpenAppointment,
  onReschedule,
  onDrillDown,
}: RbcCalendarProps) {
  const dayPropGetter = useMemo(() => makeDayPropGetter(blackoutPeriods), [blackoutPeriods]);
  const events = useMemo<RbcEvent[]>(() => {
    const result: RbcEvent[] = [];
    for (const appt of appointments) {
      const pet = petsById.get(appt.petId);
      if (!pet) continue; // pet borrado: no se pinta un tile roto en el grid
      const start = toDateTime(appt.date, appt.startTime);
      result.push({
        id: appt.id,
        title: pet.name,
        start,
        end: new Date(start.getTime() + appt.durationMinutes * 60_000),
        resource: { appt, pet },
      });
    }
    return result;
  }, [appointments, petsById]);

  function handleEventDrop({ event, start }: EventInteractionArgs<RbcEvent>) {
    const startDate = new Date(start);
    onReschedule(event.id, { date: toISODate(startDate), startTime: timeOfDay(startDate) });
  }

  return (
    <DnDCalendar
      localizer={localizer}
      culture="es"
      events={events}
      view={view as View}
      views={["day", "week", "month"]}
      date={date}
      toolbar={false}
      onSelectEvent={(event) => onOpenAppointment((event as RbcEvent).id)}
      eventPropGetter={(event) => eventPropGetter(event as RbcEvent)}
      dayPropGetter={dayPropGetter}
      components={{ event: EventContent }}
      style={{ height: 640 }}
      draggableAccessor={draggableAccessor}
      resizable={false}
      onEventDrop={handleEventDrop}
      onDrillDown={(drillDate) => onDrillDown(drillDate)}
    />
  );
}
