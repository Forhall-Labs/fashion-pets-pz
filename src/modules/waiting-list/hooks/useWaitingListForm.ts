"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usePetOptions } from "@/modules/shared/hooks/usePetOptions";
import { translateAppointmentError } from "@/modules/shared/lib/api-errors";
import {
  waitingListFormSchema,
  type WaitingListFormValues,
} from "@/modules/shared/lib/waiting-list-schema";
import { waitingListApi, type WaitingEntry } from "@/modules/shared/lib/waiting-list-api";

interface Args {
  entry: WaitingEntry | null;
  /** Para ofrecer editar en vez de duplicar (HU-5.1 "already on the list"). */
  existing: WaitingEntry[];
  onEditExisting: (entry: WaitingEntry) => void;
  onClose: () => void;
}

// Alta/edición de una entrada de la lista de espera (HU-5.1).
export function useWaitingListForm({ entry, existing, onEditExisting, onClose }: Args) {
  const editing = entry !== null;
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID()).current;
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { pets, petOptions, loading: petsLoading } = usePetOptions();

  const { register, handleSubmit, setValue, watch, formState } = useForm<WaitingListFormValues>({
    resolver: zodResolver(waitingListFormSchema),
    defaultValues: {
      petId: entry?.petId ?? "",
      preferredStartDate: entry?.preferredStartDate ?? "",
      preferredEndDate: entry?.preferredEndDate ?? "",
    },
  });
  const petId = watch("petId");
  const pet = pets.find((p) => p.id === petId) ?? null;
  const duplicate = editing ? null : (existing.find((e) => e.petId === petId) ?? null);
  // `size` es obligatorio en el tipo, pero un dato viejo puede venir vacío.
  const missingSize = pet !== null && !pet.size;

  async function choosePet(nextPetId: string) {
    setValue("petId", nextPetId, { shouldValidate: true });
    setSuggestion(null);
    if (!nextPetId || editing) return;
    // HU-5.1: con día fijo, se sugiere un rango alineado a ese día — solo si
    // el Admin todavía no cargó uno.
    try {
      const range = await waitingListApi.suggestedRange(nextPetId);
      if (range && !watch("preferredStartDate") && !watch("preferredEndDate")) {
        setValue("preferredStartDate", range.start);
        setValue("preferredEndDate", range.end);
        setSuggestion("Rango sugerido según el día fijo de visita del dueño. Podés cambiarlo.");
      }
    } catch {
      // Sin sugerencia no pasa nada: el rango es opcional.
    }
  }

  const mutation = useMutation({
    mutationFn: (values: WaitingListFormValues) => {
      const range = {
        preferredStartDate: values.preferredStartDate || null,
        preferredEndDate: values.preferredEndDate || null,
      };
      return editing
        ? waitingListApi.update(entry.id, range)
        : waitingListApi.create({ petId: values.petId, ...range }, idempotencyKey);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      onClose();
    },
    onError: (err) => setError(translateAppointmentError(err)),
  });

  const submit = handleSubmit((values) => {
    setError(null);
    if (missingSize) {
      setError("Esta mascota no tiene tamaño. Cargáselo en su ficha antes de agregarla.");
      return;
    }
    if (duplicate) return;
    mutation.mutate(values);
  });

  return {
    editing,
    register,
    errors: formState.errors,
    petOptions,
    petsLoading,
    petId,
    choosePet,
    duplicate,
    editDuplicate: () => duplicate && onEditExisting(duplicate),
    missingSize,
    suggestion,
    submit,
    // isPending y no un flag propio: mientras espera al servidor el botón
    // queda deshabilitado, así un doble click no manda dos altas.
    submitting: mutation.isPending,
    error,
  };
}
