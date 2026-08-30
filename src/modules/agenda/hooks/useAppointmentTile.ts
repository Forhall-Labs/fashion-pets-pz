"use client";

import type { MouseEvent } from "react";

import type { Appointment, Pet } from "@/modules/shared/types";

// Puerto de apptTileClasses()/apptTileHTML() de docs/prototype/app.js.
export function useAppointmentTile(appt: Appointment, pet: Pet, onOpen: (id: string) => void) {
  const classes = ["appt-tile"];
  if (appt.serviceType === "quick_service") classes.push("is-quick");
  if (appt.source === "auto_scheduled") classes.push("is-auto");
  if (appt.flaggedReason) classes.push("is-exception");

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
