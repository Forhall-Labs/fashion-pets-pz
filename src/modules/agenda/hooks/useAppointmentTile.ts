"use client";

import type { MouseEvent } from "react";

import type { Appointment, Pet } from "@/modules/shared/types";

// Función plana (no hook) para poder usarla también desde eventPropGetter
// de RbcCalendar.tsx, que no es un componente ni un hook — llamar ahí a
// useAppointmentTile violaría react-hooks/rules-of-hooks aunque la función
// en sí no use ningún hook real internamente.
export function appointmentTileClasses(appt: Appointment): string[] {
  const classes = ["appt-tile"];
  if (appt.serviceType === "quick_service") classes.push("is-quick");
  if (appt.source === "auto_scheduled") classes.push("is-auto");
  if (appt.flaggedReason) classes.push("is-exception");
  return classes;
}

// Puerto de apptTileClasses()/apptTileHTML() de docs/prototype/app.js.
export function useAppointmentTile(appt: Appointment, pet: Pet, onOpen: (id: string) => void) {
  const classes = appointmentTileClasses(appt);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onOpen(appt.id);
  }

  return {
    className: classes.join(" "),
    title: `${pet.name} — ${appt.startTime}`,
    cancelledSuffix: appt.status === "cancelled" ? " (cancelada)" : "",
    handleClick,
  };
}
