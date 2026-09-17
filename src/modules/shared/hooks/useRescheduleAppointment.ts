"use client";

import { useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { translateAppointmentError } from "../lib/api-errors";
import { appointmentsApi, type AppointmentInput } from "../lib/appointments-api";
import type { Appointment } from "../types";

interface RescheduleContext {
  previous: [QueryKey, Appointment[] | undefined][];
}

// Reprogramar por drag-and-drop (HU-2.3) es un PATCH normal — mismo
// mutationFn/motor de validación que useAppointmentForm.ts al editar, pero
// sin formulario: se dispara directo desde el drop del calendario.
//
// Actualización optimista: el tile tiene que moverse apenas se suelta, no
// recién cuando vuelve la respuesta del PATCH — un viaje de ida y vuelta se
// siente como un delay inaceptable para un gesto que el usuario ya ve
// resuelto en pantalla. Se parchea a mano el cache de todas las queries
// ["appointments", ...] (una por rango visible + la de "hoy", ver
// useAgendaData.ts) en vez de esperar el refetch; si el backend rechaza el
// move, se revierte al snapshot tomado antes de mutar. El refetch en
// onSettled sigue corriendo igual, para recoger datos que el cliente no
// puede predecir (p.ej. el auto-flag de "desvío de día fijo").
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<
    Appointment,
    unknown,
    { id: string; input: Partial<AppointmentInput> },
    RescheduleContext
  >({
    mutationFn: ({ id, input }) => appointmentsApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ["appointments"] });
      const previous = queryClient.getQueriesData<Appointment[]>({ queryKey: ["appointments"] });
      queryClient.setQueriesData<Appointment[]>({ queryKey: ["appointments"] }, (old) =>
        old?.map((appt) => (appt.id === id ? { ...appt, ...input } : appt)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      setError(translateAppointmentError(err));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return {
    reschedule: (
      id: string,
      input: Partial<AppointmentInput>,
      callbacks?: { onSettled?: () => void },
    ) => {
      setError(null);
      mutation.mutate({ id, input }, { onSettled: callbacks?.onSettled });
    },
    submitting: mutation.isPending,
    error,
    clearError: () => setError(null),
  };
}
