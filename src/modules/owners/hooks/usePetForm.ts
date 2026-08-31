"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TODAY_ISO } from "@/modules/shared/lib/mock-data";
import { translateApiError } from "@/modules/shared/lib/api-errors";
import { appointmentsApi } from "@/modules/shared/lib/appointments-api";
import { petsApi, type PetInput } from "@/modules/shared/lib/pets-api";
import type { GroomingFrequency, Pet, PetSize } from "@/modules/shared/types";

type Stage = "form" | "aggressive-confirm" | "frequency-conflict";

interface UsePetFormArgs {
  pet?: Pet | null;
  ownerId: string;
  onSaved?: (pet: Pet) => void;
  onClose: () => void;
}

export function usePetForm({ pet = null, ownerId, onSaved, onClose }: UsePetFormArgs) {
  const editing = pet != null;
  const queryClient = useQueryClient();

  const [name, setName] = useState(pet?.name ?? "");
  const [breed, setBreed] = useState(pet?.breed ?? "");
  const [size, setSize] = useState<PetSize | "">(pet?.size ?? "");
  const [isAggressive, setIsAggressive] = useState(pet?.isAggressive ?? false);
  const [needsPickup, setNeedsPickup] = useState(pet?.needsPickup ?? false);
  const [locationAddress, setLocationAddress] = useState(pet?.locationAddress ?? "");
  const [groomingFrequency, setGroomingFrequency] = useState<GroomingFrequency | "">(
    pet?.groomingFrequency ?? "",
  );
  const [avgServiceDuration, setAvgServiceDuration] = useState(
    pet?.avgServiceDuration != null ? String(pet.avgServiceDuration) : "",
  );

  const [nameError, setNameError] = useState(false);
  const [breedError, setBreedError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [futureAppointmentCount, setFutureAppointmentCount] = useState(0);
  const [checkingConflict, setCheckingConflict] = useState(false);

  function buildInput(): PetInput {
    return {
      ownerId,
      name: name.trim(),
      breed: breed.trim(),
      size: size as PetSize,
      isAggressive,
      needsPickup,
      locationAddress: locationAddress.trim() || null,
      groomingFrequency: groomingFrequency || null,
      avgServiceDuration: avgServiceDuration ? Number(avgServiceDuration) : null,
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
        await Promise.all(future.map((a) => appointmentsApi.cancel(a.id)));
      }
      return editing ? petsApi.update(pet.id, input) : petsApi.create(input);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["owners"] });
      void queryClient.invalidateQueries({ queryKey: ["pets", { ownerId }] });
      onSaved?.(saved);
      onClose();
      setStage("form");
    },
    onError: (err: unknown) => {
      setError(translateApiError(err));
      setStage("form");
    },
  });

  function toggleAggressive(checked: boolean) {
    if (checked) {
      setStage("aggressive-confirm");
      return;
    }
    setIsAggressive(false);
  }

  function confirmAggressive() {
    setIsAggressive(true);
    setStage("form");
  }

  function cancelAggressive() {
    setStage("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedBreed = breed.trim();
    const nameInvalid = !trimmedName;
    const breedInvalid = !trimmedBreed;
    const sizeInvalid = !size;
    setNameError(nameInvalid);
    setBreedError(breedInvalid);
    setSizeError(sizeInvalid);
    if (nameInvalid || breedInvalid || sizeInvalid) return;

    setError(null);
    const input = buildInput();
    const newFrequency = groomingFrequency || null;
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

  function keepAppointments() {
    mutation.mutate({ input: buildInput(), cancelFutureAppointments: false });
  }

  function regenerateAppointments() {
    mutation.mutate({ input: buildInput(), cancelFutureAppointments: true });
  }

  return {
    editing,
    name,
    setName,
    breed,
    setBreed,
    size,
    setSize,
    isAggressive,
    toggleAggressive,
    needsPickup,
    setNeedsPickup,
    locationAddress,
    setLocationAddress,
    groomingFrequency,
    setGroomingFrequency,
    avgServiceDuration,
    setAvgServiceDuration,
    nameError,
    breedError,
    sizeError,
    submitting: mutation.isPending || checkingConflict,
    error,
    clearError: () => setError(null),
    stage,
    confirmAggressive,
    cancelAggressive,
    futureAppointmentCount,
    keepAppointments,
    regenerateAppointments,
    cancelFrequencyConflict: () => setStage("form"),
    handleSubmit,
  };
}
