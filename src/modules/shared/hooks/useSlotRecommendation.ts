"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { translateAppointmentError } from "../lib/api-errors";
import { appointmentsApi } from "../lib/appointments-api";
import { SIZE_LABEL } from "../lib/labels";
import { petsApi } from "../lib/pets-api";
import type { VacatedSlot } from "../lib/vacated-slot";
import { waitingListApi } from "../lib/waiting-list-api";
import type { PetSize } from "../types";
import { usePetOptions } from "./usePetOptions";

export const SIZE_MISMATCH_FLAG = "Excepción de tamaño";

const sizeLabel = (size: string | null | undefined) =>
  size && size in SIZE_LABEL ? SIZE_LABEL[size as PetSize] : "sin tamaño";

// HU-5.2/5.3: qué hacer con un lugar recién liberado. Recomienda desde la
// lista de espera (por tamaño de la mascota que lo tenía), y el Admin decide:
// aprobar la primera u otra candidata, reservar otra mascota a mano o dejarlo
// libre. Nada se agenda sin su click.
export function useSlotRecommendation(slot: VacatedSlot, onDone: () => void) {
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID()).current;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"recommend" | "manual">("recommend");
  const [manualPetId, setManualPetId] = useState("");
  const [mismatchConfirmed, setMismatchConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleReason, setStaleReason] = useState<string | null>(null);

  const previousPetQuery = useQuery({
    queryKey: ["pets", slot.previousPetId],
    queryFn: () => petsApi.get(slot.previousPetId),
    retry: false,
  });
  // Si la mascota que tenía el lugar ya no existe, el lugar va sin tamaño y
  // el API lo manda a revisión manual (HU-5.2 @validation).
  const slotSize = previousPetQuery.isError ? null : (previousPetQuery.data?.size ?? null);
  const recommendationQuery = useQuery({
    queryKey: ["waiting-list", "recommendations", slot.date, slot.startTime, slotSize],
    queryFn: () => waitingListApi.recommendations({ date: slot.date, size: slotSize }),
    enabled: !previousPetQuery.isLoading,
  });
  const waitingQuery = useQuery({ queryKey: ["waiting-list"], queryFn: waitingListApi.list });
  const { pets, petOptions } = usePetOptions();

  const recommendation = recommendationQuery.data ?? null;
  const candidates =
    recommendation && "candidates" in recommendation ? recommendation.candidates : [];
  const chosenId = selectedId ?? candidates[0]?.id ?? null;
  const manualPet = pets.find((p) => p.id === manualPetId) ?? null;
  const sizeMismatch = manualPet !== null && slotSize !== null && manualPet.size !== slotSize;
  const manualEntry = waitingQuery.data?.find((e) => e.petId === manualPetId) ?? null;

  function finish(result?: { staleReason: string | null }) {
    void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    void queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    if (result?.staleReason) {
      setStaleReason(result.staleReason);
      return;
    }
    onDone();
  }

  const slotInput = {
    date: slot.date,
    startTime: slot.startTime,
    durationMinutes: slot.durationMinutes,
  };

  const approveMutation = useMutation({
    mutationFn: (entryId: string) => waitingListApi.approve(entryId, slotInput),
    onSuccess: finish,
    onError: (err) => {
      setError(translateAppointmentError(err));
      void queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    },
  });
  const manualMutation = useMutation({
    mutationFn: () => {
      if (!manualPet) throw new Error("Elegí una mascota.");
      // Una mascota que está en la lista de espera se agenda por la
      // aprobación, así también sale de la lista.
      if (manualEntry && !sizeMismatch) return waitingListApi.approve(manualEntry.id, slotInput);
      return appointmentsApi
        .create(
          {
            petId: manualPet.id,
            ...slotInput,
            serviceType: "full_groom",
            flaggedReason: sizeMismatch
              ? `${SIZE_MISMATCH_FLAG}: lugar de ${sizeLabel(slotSize)}, mascota ${sizeLabel(manualPet.size)}.`
              : null,
          },
          idempotencyKey,
        )
        .then(() => ({ staleReason: null }));
    },
    onSuccess: finish,
    onError: (err) => setError(translateAppointmentError(err)),
  });

  function approve() {
    if (!chosenId) return;
    setError(null);
    approveMutation.mutate(chosenId);
  }

  function bookManually() {
    setError(null);
    if (!manualPet) {
      setError("Elegí una mascota.");
      return;
    }
    if (sizeMismatch && !mismatchConfirmed) {
      setError("El tamaño no coincide con el lugar: confirmalo para seguir.");
      return;
    }
    manualMutation.mutate();
  }

  return {
    slot,
    slotSizeLabel: sizeLabel(slotSize),
    loading: previousPetQuery.isLoading || recommendationQuery.isLoading,
    loadError: recommendationQuery.isError,
    retry: () => void recommendationQuery.refetch(),
    recommendation,
    candidates,
    chosenId,
    select: setSelectedId,
    approve,
    mode,
    startManual: () => {
      setError(null);
      setMode("manual");
    },
    backToRecommendations: () => {
      setError(null);
      setMode("recommend");
    },
    petOptions,
    manualPetId,
    chooseManualPet: (id: string) => {
      setManualPetId(id);
      setMismatchConfirmed(false);
    },
    manualPetSizeLabel: manualPet ? sizeLabel(manualPet.size) : null,
    sizeMismatch,
    mismatchConfirmed,
    setMismatchConfirmed,
    bookManually,
    busy: approveMutation.isPending || manualMutation.isPending,
    error,
    staleReason,
    leaveOpen: onDone,
  };
}
