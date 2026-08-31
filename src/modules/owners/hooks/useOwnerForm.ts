"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { digitsOnly } from "@/modules/shared/lib/date-utils";
import { translateApiError } from "@/modules/shared/lib/api-errors";
import { ownerFormSchema, type OwnerFormValues } from "@/modules/shared/lib/owner-schema";
import { ownersApi, type OwnerInput } from "@/modules/shared/lib/owners-api";
import type { Owner, Weekday } from "@/modules/shared/types";

type Conflict =
  { type: "duplicate"; existing: Owner } | { type: "shared-phone"; existing: Owner } | null;

interface UseOwnerFormArgs {
  owner?: Owner | null;
  // Dueños ya cargados en pantalla (la página actual de la lista, o el
  // resultado de una búsqueda) — el chequeo de duplicados es un aviso
  // best-effort contra lo que ya está en memoria, no una consulta global
  // (no hay constraint del lado del servidor tampoco, así que "guardar de
  // todos modos" siempre está disponible como escape).
  existingOwners: Owner[];
  onSaved?: (owner: Owner) => void;
  onClose: () => void;
}

export function useOwnerForm({ owner = null, existingOwners, onSaved, onClose }: UseOwnerFormArgs) {
  const editing = owner != null;
  const router = useRouter();
  const queryClient = useQueryClient();
  // Estable durante toda la sesión de este form (una key nueva por
  // apertura, no por cada intento de submit) — así un reintento manual
  // después de un timeout/confirmación perdida no crea un dueño duplicado.
  const idempotencyKey = useRef(crypto.randomUUID()).current;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      name: owner?.name ?? "",
      phone: owner?.phone ?? "",
      address: owner?.address ?? "",
      fixedVisitDay: owner?.fixedVisitDay ?? "",
    },
  });

  const [conflict, setConflict] = useState<Conflict>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: OwnerInput) =>
      editing ? ownersApi.update(owner.id, input) : ownersApi.create(input, idempotencyKey),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["owners"] });
      onSaved?.(saved);
      onClose();
    },
    onError: (err: unknown) => setError(translateApiError(err)),
  });

  function buildInput(values: OwnerFormValues): OwnerInput {
    return {
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim() || null,
      fixedVisitDay: (values.fixedVisitDay || null) as Weekday | null,
    };
  }

  function onValid(values: OwnerFormValues) {
    if (!editing) {
      const phoneDigits = digitsOnly(values.phone);
      const trimmedName = values.name.trim().toLowerCase();
      const dup = existingOwners.find(
        (o) => o.name.trim().toLowerCase() === trimmedName && digitsOnly(o.phone) === phoneDigits,
      );
      if (dup) {
        setConflict({ type: "duplicate", existing: dup });
        return;
      }
      const samePhone = existingOwners.find((o) => digitsOnly(o.phone) === phoneDigits);
      if (samePhone) {
        setConflict({ type: "shared-phone", existing: samePhone });
        return;
      }
    }
    setError(null);
    mutation.mutate(buildInput(values));
  }

  function confirmConflict() {
    setConflict(null);
    setError(null);
    mutation.mutate(buildInput(getValues()));
  }

  function openExisting(id: string) {
    onClose();
    router.push(`/owners/${id}`);
  }

  return {
    editing,
    register,
    errors,
    setValue,
    submitting: mutation.isPending,
    error,
    clearError: () => setError(null),
    conflict,
    cancelConflict: () => setConflict(null),
    confirmConflict,
    openExisting,
    handleSubmit: handleSubmit(onValid),
  };
}
