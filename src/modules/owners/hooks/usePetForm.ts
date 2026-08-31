"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TODAY_ISO } from "@/modules/shared/lib/mock-data";
import { translateApiError } from "@/modules/shared/lib/api-errors";
import { appointmentsApi } from "@/modules/shared/lib/appointments-api";
import { petFormSchema, type PetFormValues } from "@/modules/shared/lib/pet-schema";
import { petsApi, type PetInput } from "@/modules/shared/lib/pets-api";
import type { GroomingFrequency, Pet, PetSize } from "@/modules/shared/types";

type Stage = "form" | "aggressive-confirm" | "duplicate-name" | "frequency-conflict";

interface UsePetFormArgs {
  pet?: Pet | null;
  ownerId: string;
  // Todas las mascotas de este dueño (useOwnerDetail ya las trae completas,
  // sin paginar) — a diferencia del duplicate-check de useOwnerForm, acá no
  // hay caveat de "solo la página cargada".
  existingPets: Pet[];
  onSaved?: (pet: Pet) => void;
  onClose: () => void;
}

// Marca un fallo de cancelación parcial al "regenerar" — distinto de un
// error de guardado normal, así onError puede armar un mensaje específico
// en vez del genérico de translateApiError().
class PartialCancelError extends Error {
  constructor(
    public readonly failed: number,
    public readonly total: number,
  ) {
    super(`PARTIAL_CANCEL:${failed}/${total}`);
  }
}

export function usePetForm({
  pet = null,
  ownerId,
  existingPets,
  onSaved,
  onClose,
}: UsePetFormArgs) {
  const editing = pet != null;
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID()).current;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: pet?.name ?? "",
      breed: pet?.breed ?? "",
      size: pet?.size ?? "",
      isAggressive: pet?.isAggressive ?? false,
      needsPickup: pet?.needsPickup ?? false,
      locationAddress: pet?.locationAddress ?? "",
      groomingFrequency: pet?.groomingFrequency ?? "",
      avgServiceDuration: pet?.avgServiceDuration != null ? String(pet.avgServiceDuration) : "",
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [futureAppointmentCount, setFutureAppointmentCount] = useState(0);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<PetFormValues | null>(null);

  function buildInput(values: PetFormValues): PetInput {
    return {
      ownerId,
      name: values.name.trim(),
      breed: values.breed.trim(),
      size: values.size as PetSize,
      isAggressive: values.isAggressive,
      needsPickup: values.needsPickup,
      locationAddress: values.locationAddress.trim() || null,
      groomingFrequency: (values.groomingFrequency || null) as GroomingFrequency | null,
      avgServiceDuration: values.avgServiceDuration ? Number(values.avgServiceDuration) : null,
    };
  }

  const mutation = useMutation({
    mutationFn: async ({
      input,
      cancelFutureAppointments,
    }: {
      input: PetInput;
      cancelFutureAppointments: boolean;
    }) => {
      if (cancelFutureAppointments && pet) {
        const appts = await appointmentsApi.list();
        const future = appts.filter(
          (a) => a.petId === pet.id && a.status === "scheduled" && a.date >= TODAY_ISO,
        );
        const results = await Promise.allSettled(future.map((a) => appointmentsApi.cancel(a.id)));
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          throw new PartialCancelError(failed, future.length);
        }
      }
      return editing ? petsApi.update(pet.id, input) : petsApi.create(input, idempotencyKey);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["owners"] });
      void queryClient.invalidateQueries({ queryKey: ["pets", { ownerId }] });
      onSaved?.(saved);
      onClose();
      setStage("form");
    },
    onError: (err: unknown) => {
      if (err instanceof PartialCancelError) {
        setError(
          `Se cancelaron ${err.failed} de ${err.total} citas futuras y la frecuencia no se guardó. ` +
            `Revisá las citas de ${pet?.name ?? "la mascota"} manualmente antes de reintentar.`,
        );
      } else {
        setError(translateApiError(err));
      }
      setStage("form");
    },
  });

  function toggleAggressive(checked: boolean) {
    if (checked) {
      setStage("aggressive-confirm");
      return;
    }
    setValue("isAggressive", false);
  }

  function confirmAggressive() {
    setValue("isAggressive", true);
    setStage("form");
  }

  function cancelAggressive() {
    setStage("form");
  }

  async function proceedAfterDuplicateCheck(values: PetFormValues) {
    setError(null);
    const input = buildInput(values);
    const newFrequency = values.groomingFrequency || null;
    const frequencyChanged = editing && pet.groomingFrequency !== newFrequency;

    if (!frequencyChanged) {
      mutation.mutate({ input, cancelFutureAppointments: false });
      return;
    }

    setCheckingConflict(true);
    try {
      const appts = await appointmentsApi.list();
      const future = appts.filter(
        (a) => a.petId === pet.id && a.status === "scheduled" && a.date >= TODAY_ISO,
      );
      if (future.length > 0) {
        setFutureAppointmentCount(future.length);
        setStage("frequency-conflict");
        return;
      }
    } catch (err) {
      setError(translateApiError(err));
      return;
    } finally {
      setCheckingConflict(false);
    }

    mutation.mutate({ input, cancelFutureAppointments: false });
  }

  async function onValid(values: PetFormValues) {
    const trimmedName = values.name.trim().toLowerCase();
    const dup = existingPets.find(
      (p) => p.id !== pet?.id && p.name.trim().toLowerCase() === trimmedName,
    );
    if (dup) {
      setPendingValues(values);
      setDuplicateName(dup.name);
      setStage("duplicate-name");
      return;
    }
    await proceedAfterDuplicateCheck(values);
  }

  function cancelDuplicateName() {
    setPendingValues(null);
    setDuplicateName(null);
    setStage("form");
  }

  async function confirmDuplicateName() {
    setStage("form");
    if (pendingValues) {
      await proceedAfterDuplicateCheck(pendingValues);
    }
    setPendingValues(null);
    setDuplicateName(null);
  }

  function keepAppointments() {
    mutation.mutate({ input: buildInput(getValues()), cancelFutureAppointments: false });
  }

  function regenerateAppointments() {
    mutation.mutate({ input: buildInput(getValues()), cancelFutureAppointments: true });
  }

  return {
    editing,
    register,
    errors,
    setValue,
    name: watch("name"),
    isAggressive: watch("isAggressive"),
    toggleAggressive,
    incomplete: !watch("groomingFrequency") || !watch("avgServiceDuration"),
    submitting: mutation.isPending || checkingConflict,
    error,
    clearError: () => setError(null),
    stage,
    confirmAggressive,
    cancelAggressive,
    duplicateName,
    cancelDuplicateName,
    confirmDuplicateName,
    futureAppointmentCount,
    keepAppointments,
    regenerateAppointments,
    cancelFrequencyConflict: () => setStage("form"),
    handleSubmit: handleSubmit(onValid),
  };
}
