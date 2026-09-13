"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "../lib/api-client";
import { translateApiError } from "../lib/api-errors";
import { appointmentFormSchema, type AppointmentFormValues } from "../lib/appointment-schema";
import { appointmentsApi, type AppointmentInput } from "../lib/appointments-api";
import { petsApi } from "../lib/pets-api";
import { shopConfigApi } from "../lib/shop-config-api";
import type { Appointment, ServiceType } from "../types";

interface UseAppointmentFormArgs {
  appointment?: Appointment | null;
  presetDate?: string;
  presetPetId?: string;
  onSaved?: (appt: Appointment) => void;
  onClose: () => void;
}

// 409 de AppointmentValidationService trae un mensaje específico y
// accionable (horario/capacidad/blackout/overlap) — se muestra tal cual en
// vez del genérico de translateApiError().
function translateAppointmentError(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return err.messages.join(" ");
  }
  return translateApiError(err);
}

// Puerto de openAppointmentForm() (docs/prototype/app.js:517-599) contra la
// API real — crea o edita una cita. La validación de negocio (horario,
// capacidad, blackout, overlap) la hace el backend; acá solo se valida el
// shape (appointment-schema.ts) y se autocompleta la duración.
export function useAppointmentForm({
  appointment = null,
  presetDate,
  presetPetId,
  onSaved,
  onClose,
}: UseAppointmentFormArgs) {
  const editing = appointment != null;
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID()).current;

  const petsQuery = useQuery({
    queryKey: ["pets", { limit: 200 }],
    queryFn: () => petsApi.list({ limit: 200 }),
  });
  const shopConfigQuery = useQuery({ queryKey: ["shop-config"], queryFn: shopConfigApi.get });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      petId: appointment?.petId ?? presetPetId ?? "",
      date: appointment?.date ?? presetDate ?? "",
      startTime: appointment?.startTime ?? "",
      durationMinutes:
        appointment?.durationMinutes != null ? String(appointment.durationMinutes) : "",
      serviceType: appointment?.serviceType ?? "full_groom",
    },
  });

  const [error, setError] = useState<string | null>(null);

  const petId = watch("petId");
  const serviceType = watch("serviceType") as ServiceType;

  function autofillDuration(nextPetId: string, nextServiceType: ServiceType) {
    if (watch("durationMinutes")) return; // no pisa un valor que el usuario ya tocó
    if (nextServiceType === "quick_service") {
      const quick = shopConfigQuery.data?.quickServiceDurationMinutes;
      if (quick) setValue("durationMinutes", String(quick));
      return;
    }
    const pet = petsQuery.data?.data.find((p) => p.id === nextPetId);
    if (pet?.avgServiceDuration) setValue("durationMinutes", String(pet.avgServiceDuration));
  }

  function handlePetChange(nextPetId: string) {
    setValue("petId", nextPetId, { shouldValidate: true });
    autofillDuration(nextPetId, serviceType);
  }

  function handleServiceTypeChange(nextServiceType: ServiceType) {
    setValue("serviceType", nextServiceType, { shouldValidate: true });
    autofillDuration(petId, nextServiceType);
  }

  const mutation = useMutation({
    mutationFn: (input: AppointmentInput) =>
      editing
        ? appointmentsApi.update(appointment.id, input)
        : appointmentsApi.create(input, idempotencyKey),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onSaved?.(saved);
      onClose();
    },
    onError: (err: unknown) => setError(translateAppointmentError(err)),
  });

  function onValid(values: AppointmentFormValues) {
    setError(null);
    mutation.mutate({
      petId: values.petId,
      date: values.date,
      startTime: values.startTime,
      durationMinutes: Number(values.durationMinutes),
      serviceType: values.serviceType as ServiceType,
    });
  }

  return {
    editing,
    register,
    errors,
    pets: petsQuery.data?.data ?? [],
    petsLoading: petsQuery.isLoading,
    petId,
    serviceType,
    quickServiceDisabled: shopConfigQuery.data
      ? shopConfigQuery.data.quickServiceDurationMinutes == null
      : false,
    handlePetChange,
    handleServiceTypeChange,
    submitting: mutation.isPending,
    error,
    clearError: () => setError(null),
    handleSubmit: handleSubmit(onValid),
  };
}
