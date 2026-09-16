"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { translateAppointmentError } from "../lib/api-errors";
import { appointmentsApi, type AppointmentInput } from "../lib/appointments-api";

// Reprogramar por drag-and-drop (HU-2.3) es un PATCH normal — mismo
// mutationFn/motor de validación que useAppointmentForm.ts al editar, pero
// sin formulario: se dispara directo desde el drop del calendario. Sin
// actualización optimista a propósito — el tile arrastrado se pinta desde
// el cache de React Query (ver RbcCalendar.tsx), así que si el PATCH falla
// el tile simplemente sigue donde el cache ya lo tenía: "revierte a su
// posición original" (HU-2.3 @negative/@error) sale gratis, sin nada que
// deshacer a mano.
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AppointmentInput> }) =>
      appointmentsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: unknown) => setError(translateAppointmentError(err)),
  });

  return {
    reschedule: (id: string, input: Partial<AppointmentInput>) => {
      setError(null);
      mutation.mutate({ id, input });
    },
    error,
    clearError: () => setError(null),
  };
}
