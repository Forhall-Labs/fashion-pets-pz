"use client";

import { useEffect, useState } from "react";

import { timeToMinutes } from "@/modules/shared/lib/date-utils";
import type { Appointment, Pet } from "@/modules/shared/types";

function currentMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// Panel lateral de "hoy" — un log del día, no solo lo que falta: citas
// programadas que todavía no terminaron (las que están en curso también se
// ven; desaparecen solas cuando pasa su hora de fin) MÁS cualquier cita
// cancelada hoy (a cualquier hora, incluso si ya pasó) — así queda visible
// que se canceló, no solo que "no hay nada más". Independiente de qué mes/día esté mirando el usuario
// en el calendario principal (useAgendaData.ts trae las citas de hoy
// aparte, con su propio fetch). nowMinutes se recalcula cada minuto (no en
// cada render) para no comparar contra "ahora" congelado desde que se abrió
// la pantalla.
export function useTodayAgendaPanel(appointments: Appointment[], petsById: Map<string, Pet>) {
  const [open, setOpen] = useState(true);
  const [nowMinutes, setNowMinutes] = useState(currentMinutes);

  useEffect(() => {
    const id = setInterval(() => setNowMinutes(currentMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const endsAt = (a: Appointment) => timeToMinutes(a.startTime) + a.durationMinutes;
  const items = appointments
    .filter((a) => a.status === "cancelled" || (a.status === "scheduled" && endsAt(a) > nowMinutes))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    .map((appt) => ({ appt, pet: petsById.get(appt.petId) }))
    .filter((x): x is { appt: Appointment; pet: Pet } => !!x.pet);

  // Con la lista vacía, distingue "no hubo citas" de "ya pasaron todas":
  // "Sin novedades" a secas daba a entender lo primero.
  const finished = appointments.filter((a) => a.status !== "cancelled" && endsAt(a) <= nowMinutes);
  const emptyMessage =
    finished.length === 0
      ? "No hay citas hoy."
      : finished.length === 1
        ? "No quedan citas por hoy: ya pasó la única del día."
        : `No quedan citas por hoy: ya pasaron las ${finished.length} del día.`;

  return { open, toggle: () => setOpen((v) => !v), items, emptyMessage };
}
