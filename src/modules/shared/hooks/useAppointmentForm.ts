"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { translateAppointmentError } from "../lib/api-errors";
import { appointmentFormSchema, type AppointmentFormValues } from "../lib/appointment-schema";
import { appointmentsApi, type AppointmentInput } from "../lib/appointments-api";
import { fromISODate, minutesToTime, timeToMinutes } from "../lib/date-utils";
import { DAY_LABEL, DAY_OPTIONS } from "../lib/labels";
import { ownersApi } from "../lib/owners-api";
import { petsApi } from "../lib/pets-api";
import { shopConfigApi } from "../lib/shop-config-api";
import type { Appointment, ServiceType, Weekday } from "../types";

function weekdayOf(iso: string): Weekday {
  const jsDay = fromISODate(iso).getDay(); // 0=domingo..6=sábado
  return jsDay === 0 ? "sunday" : DAY_OPTIONS[jsDay - 1];
}

interface UseAppointmentFormArgs {
  appointment?: Appointment | null;
  presetDate?: string;
  presetPetId?: string;
  onSaved?: (appt: Appointment) => void;
  onClose: () => void;
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
    // 100 es el máximo que acepta PaginationQueryDto (@Max(100) en el
    // backend) — ver la misma nota en useAgendaData.ts.
    queryKey: ["pets", { limit: 100 }],
    queryFn: () => petsApi.list({ limit: 100 }),
  });
  // Se pide en paralelo con petsQuery (no encadenada) solo para armar
  // "Nombre — Dueño" en el select y desambiguar mascotas con el mismo
  // nombre en dueños distintos (caso real: dos "Chocolate"). Un solo
  // request extra, reusa GET /owners tal cual ya existe — no hace falta
  // tocar el backend ni pedir el dueño mascota por mascota.
  const ownersQuery = useQuery({
    queryKey: ["owners", { limit: 100 }],
    queryFn: () => ownersApi.list({ limit: 100 }),
  });
  const ownersById = useMemo(
    () => new Map(ownersQuery.data?.data.map((o) => [o.id, o]) ?? []),
    [ownersQuery.data],
  );
  const petOptions = useMemo(
    () =>
      (petsQuery.data?.data ?? []).map((p) => ({
        id: p.id,
        label: ownersById.has(p.ownerId)
          ? `${p.name} — ${ownersById.get(p.ownerId)!.name}`
          : p.name,
      })),
    [petsQuery.data, ownersById],
  );
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
  // Si el usuario ya tipeó una duración a mano, no la pisamos al cambiar de
  // mascota/tipo de servicio. Antes esto se inferría de "¿el campo tiene
  // algún valor?", lo que rompía el autocompletado en el segundo cambio: al
  // elegir la mascota ya quedaba un valor cargado, así que cambiar el tipo
  // de servicio después nunca volvía a autocompletar.
  const [durationTouched, setDurationTouched] = useState(false);

  const petId = watch("petId");
  const serviceType = watch("serviceType") as ServiceType;
  const startTime = watch("startTime");
  const durationMinutesInput = watch("durationMinutes");
  const date = watch("date");

  // Espejo client-side de la primera regla de AppointmentValidationService
  // (horario comercial) — se calcula en vivo con lo que ya tenemos cargado
  // (shopConfigQuery) para avisar en el momento, en vez de que el usuario
  // se entere recién al guardar y ver el modal de error del backend. Las
  // otras 3 reglas (blackout/capacidad/overlap) necesitan datos que este
  // formulario no trae hoy (períodos de blackout, conteo del día, citas de
  // la mascota) — esas se quedan como venían, validadas solo por el backend.
  const hoursError = (() => {
    const config = shopConfigQuery.data;
    const duration = Number(durationMinutesInput);
    if (
      !config ||
      !startTime ||
      !durationMinutesInput ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return null;
    }
    const start = timeToMinutes(startTime);
    const end = start + duration;
    const open = timeToMinutes(config.openTime);
    const close = timeToMinutes(config.closeTime);
    if (start < open || end > close) {
      return `Ese horario cae fuera del horario de atención (${minutesToTime(open)}–${minutesToTime(close)}).`;
    }
    return null;
  })();

  // Espejo client-side de la nota de "desvío de día fijo" que
  // AppointmentsService.update() aplica sola al mover una cita (ver
  // appointments.service.ts del backend) — se muestra en el momento, en el
  // mismo lugar que hoursError, pero NO bloquea Guardar: el backend permite
  // este caso, solo lo marca. Solo aplica al editar/reprogramar (`editing`)
  // porque es lo único que el backend efectivamente marca hoy — mostrarlo
  // también al crear diría algo que después el guardado no cumple.
  const dayDeviationWarning = (() => {
    if (!editing || !date) return null;
    const pet = petsQuery.data?.data.find((p) => p.id === petId);
    const owner = pet ? ownersById.get(pet.ownerId) : undefined;
    if (!owner?.fixedVisitDay) return null;
    if (weekdayOf(date) === owner.fixedVisitDay) return null;
    return `Se desvía del día fijo de ${owner.name} (${DAY_LABEL[owner.fixedVisitDay]}).`;
  })();

  function autofillDuration(nextPetId: string, nextServiceType: ServiceType) {
    if (durationTouched) return;
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
    registerDuration: register("durationMinutes", { onChange: () => setDurationTouched(true) }),
    errors,
    petOptions,
    // Combinado a propósito: si solo mirara petsQuery, el select mostraría
    // los nombres pelados un instante y les pegaría "— Dueño" después, en
    // vez de aparecer ya completos (mismo tipo de parpadeo que el detalle
    // de cita, arreglado en useAppointmentDetailModal.ts).
    petsLoading: petsQuery.isLoading || ownersQuery.isLoading,
    petId,
    serviceType,
    quickServiceDisabled: shopConfigQuery.data
      ? shopConfigQuery.data.quickServiceDurationMinutes == null
      : false,
    handlePetChange,
    handleServiceTypeChange,
    hoursError,
    dayDeviationWarning,
    submitting: mutation.isPending,
    error,
    clearError: () => setError(null),
    handleSubmit: handleSubmit(onValid),
  };
}
