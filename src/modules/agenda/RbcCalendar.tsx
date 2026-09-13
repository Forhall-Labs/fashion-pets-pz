"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import type { Appointment, Pet } from "@/modules/shared/types";

import { appointmentTileClasses, useAppointmentTile } from "./hooks/useAppointmentTile";

// Wrapper de react-big-calendar para Día/Semana/Mes (la vista Año sigue
// siendo el grid custom de CalendarGrids.tsx — react-big-calendar no la
// soporta nativo, ver docs/ui-spec.md). El toolbar propio de RBC va
// deshabilitado: la navegación (prev/next/"Hoy"/tabs) la maneja el
// agenda-toolbar existente en AgendaView.tsx, este componente es 100%
// controlado por props (view/date).
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

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

interface RbcCalendarProps {
  view: "day" | "week" | "month";
  date: Date;
  appointments: Appointment[];
  petsById: Map<string, Pet>;
  onOpenAppointment: (id: string) => void;
}

export function RbcCalendar({
  view,
  date,
  appointments,
  petsById,
  onOpenAppointment,
}: RbcCalendarProps) {
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

  return (
    <Calendar
      localizer={localizer}
      culture="es"
      events={events}
      view={view as View}
      views={["day", "week", "month"]}
      date={date}
      toolbar={false}
      onSelectEvent={(event) => onOpenAppointment((event as RbcEvent).id)}
      eventPropGetter={(event) => eventPropGetter(event as RbcEvent)}
      components={{ event: EventContent }}
      style={{ height: 640 }}
    />
  );
}
