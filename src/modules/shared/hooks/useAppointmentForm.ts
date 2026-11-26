"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { translateAppointmentError } from "../lib/api-errors";
import { appointmentFormSchema, type AppointmentFormValues } from "../lib/appointment-schema";
import { appointmentsApi, type AppointmentInput } from "../lib/appointments-api";
import { fromISODate, minutesToTime, timeToMinutes } from "../lib/date-utils";
import { DAY_LABEL, DAY_OPTIONS, FULL_GROOM_LABEL } from "../lib/labels";
import { closedDayMessage, DEFAULT_OPEN_WEEKDAYS, isOpenDayISO } from "../lib/open-days";
import { durationFor } from "../lib/service-catalog";
import { waitingListApi } from "../lib/waiting-list-api";
import { shopConfigApi } from "../lib/shop-config-api";
import type { Appointment, Weekday } from "../types";
import { usePetOptions } from "./usePetOptions";
import { useServices } from "./useServices";

// Valor del selector "Servicio" para el grooming completo; el resto de las
// opciones son ids de servicios del catálogo.
export const FULL_GROOM = "full_groom";

function initialService(appointment: Appointment | null): string {
  if (!appointment || appointment.serviceType === "full_groom") return FULL_GROOM;
  return appointment.serviceId ?? "";
}

function weekdayOf(iso: string): Weekday {
  const jsDay = fromISODate(iso).getDay(); // 0=domingo..6=sábado
  return jsDay === 0 ? "sunday" : DAY_OPTIONS[jsDay - 1];
}

interface UseAppointmentFormArgs {
  appointment?: Appointment | null;
  presetDate?: string;
  presetPetId?: string;
  waitingEntryId?: string;
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
  waitingEntryId,
  onSaved,
  onClose,
}: UseAppointmentFormArgs) {
  const editing = appointment != null;
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID()).current;

  const { pets, ownersById, petOptions, loading: petsLoading } = usePetOptions();
  const shopConfigQuery = useQuery({ queryKey: ["shop-config"], queryFn: shopConfigApi.get });
  const { activeServices, servicesById } = useServices();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      petId: appointment?.petId ?? presetPetId ?? "",
      date: appointment?.date ?? presetDate ?? "",
      startTime: appointment?.startTime ?? "",
      durationMinutes:
        appointment?.durationMinutes != null ? String(appointment.durationMinutes) : "",
      service: initialService(appointment),
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
  const service = watch("service");
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
  // Espejo de la regla de días de atención del backend: se avisa al elegir
  // la fecha y bloquea Guardar, como hoursError.
  const openWeekdays = shopConfigQuery.data?.openWeekdays ?? DEFAULT_OPEN_WEEKDAYS;
  const closedDayError = date && !isOpenDayISO(date, openWeekdays) ? closedDayMessage(date) : null;

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
    const pet = pets.find((p) => p.id === petId);
    const owner = pet ? ownersById.get(pet.ownerId) : undefined;
    if (!owner?.fixedVisitDay) return null;
    if (weekdayOf(date) === owner.fixedVisitDay) return null;
    return `Se desvía del día fijo de ${owner.name} (${DAY_LABEL[owner.fixedVisitDay]}).`;
  })();

  // Grooming completo: la duración promedio de la mascota. Servicio del
  // catálogo: la sugerida para su tamaño. Siempre editable a mano.
  function autofillDuration(nextPetId: string, nextService: string) {
    if (durationTouched) return;
    const pet = pets.find((p) => p.id === nextPetId);
    if (nextService === FULL_GROOM) {
      if (pet?.avgServiceDuration) setValue("durationMinutes", String(pet.avgServiceDuration));
      return;
    }
    const catalogService = servicesById.get(nextService);
    if (pet && catalogService) {
      setValue("durationMinutes", String(durationFor(catalogService, pet.size)));
    }
  }

  // Mascota precargada (p. ej. desde el panel de lista de espera): la
  // duración se completa apenas llegan los datos de las mascotas.
  const presetPet = !editing && presetPetId ? pets.find((p) => p.id === presetPetId) : undefined;
  useEffect(() => {
    if (presetPet?.avgServiceDuration && !getValues("durationMinutes")) {
      setValue("durationMinutes", String(presetPet.avgServiceDuration));
    }
  }, [presetPet, getValues, setValue]);

  function handlePetChange(nextPetId: string) {
    setValue("petId", nextPetId, { shouldValidate: true });
    autofillDuration(nextPetId, service);
  }

  function handleServiceChange(nextService: string) {
    setValue("service", nextService, { shouldValidate: true });
    autofillDuration(petId, nextService);
  }

  // Grooming + los servicios activos. Si la cita ya tenía un servicio que
  // después se desactivó, se sigue mostrando para no perderlo al editar.
  const serviceOptions = useMemo(() => {
    const current = appointment?.serviceId ? servicesById.get(appointment.serviceId) : undefined;
    const catalog = current && !current.active ? [...activeServices, current] : activeServices;
    // La aprobación de lista de espera siempre agenda grooming completo.
    if (waitingEntryId) return [{ value: FULL_GROOM, label: FULL_GROOM_LABEL }];
    return [
      { value: FULL_GROOM, label: FULL_GROOM_LABEL },
      ...catalog.map((s) => ({
        value: s.id,
        label: s.active ? s.name : `${s.name} (desactivado)`,
      })),
    ];
  }, [activeServices, servicesById, appointment?.serviceId, waitingEntryId]);

  const mutation = useMutation({
    mutationFn: (input: AppointmentInput) =>
      editing
        ? appointmentsApi.update(appointment.id, input)
        : waitingEntryId
          ? // Desde el panel de lista de espera: la aprobación crea la cita
            // (grooming completo, origen "lista de espera") y saca la entrada.
            waitingListApi
              .approve(waitingEntryId, {
                date: input.date,
                startTime: input.startTime,
                durationMinutes: input.durationMinutes,
              })
              .then((r) => r.appointment)
          : appointmentsApi.create(input, idempotencyKey),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (waitingEntryId) void queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
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
      serviceType: values.service === FULL_GROOM ? "full_groom" : "quick_service",
      serviceId: values.service === FULL_GROOM ? null : values.service,
    });
  }

  return {
    editing,
    register,
    registerDuration: register("durationMinutes", { onChange: () => setDurationTouched(true) }),
    errors,
    petOptions,
    petsLoading,
    petId,
    service,
    serviceOptions,
    noCatalogServices: !waitingEntryId && activeServices.length === 0,
    fromWaitingList: !!waitingEntryId,
    handlePetChange,
    handleServiceChange,
    hoursError,
    closedDayError,
    dayDeviationWarning,
    submitting: mutation.isPending,
    error,
    clearError: () => setError(null),
    handleSubmit: handleSubmit(onValid),
  };
}
