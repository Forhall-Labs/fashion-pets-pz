"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { digitsOnly } from "@/modules/shared/lib/date-utils";
import { translateApiError } from "@/modules/shared/lib/api-errors";
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

const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;
const NAME_MAX_LENGTH = 300;

export function useOwnerForm({ owner = null, existingOwners, onSaved, onClose }: UseOwnerFormArgs) {
  const editing = owner != null;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState(owner?.name ?? "");
  const [phone, setPhone] = useState(owner?.phone ?? "");
  const [address, setAddress] = useState(owner?.address ?? "");
  const [fixedVisitDay, setFixedVisitDay] = useState<Weekday | "">(owner?.fixedVisitDay ?? "");
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [conflict, setConflict] = useState<Conflict>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: OwnerInput) =>
      editing ? ownersApi.update(owner.id, input) : ownersApi.create(input),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["owners"] });
      onSaved?.(saved);
      onClose();
    },
    onError: (err: unknown) => setError(translateApiError(err)),
  });

  function buildInput(): OwnerInput {
    return {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || null,
      fixedVisitDay: fixedVisitDay || null,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const phoneDigits = digitsOnly(phone);
    const nameInvalid = !trimmedName || trimmedName.length > NAME_MAX_LENGTH;
    const phoneInvalid =
      phoneDigits.length < PHONE_MIN_DIGITS || phoneDigits.length > PHONE_MAX_DIGITS;
    setNameError(nameInvalid);
    setPhoneError(phoneInvalid);
    if (nameInvalid || phoneInvalid) return;

    if (!editing) {
      const dup = existingOwners.find(
        (o) =>
          o.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          digitsOnly(o.phone) === phoneDigits,
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
    mutation.mutate(buildInput());
  }

  function confirmConflict() {
    setConflict(null);
    setError(null);
    mutation.mutate(buildInput());
  }

  function openExisting(id: string) {
    onClose();
    router.push(`/owners/${id}`);
  }

  return {
    editing,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    fixedVisitDay,
    setFixedVisitDay,
    nameError,
    phoneError,
    submitting: mutation.isPending,
    error,
    clearError: () => setError(null),
    conflict,
    cancelConflict: () => setConflict(null),
    confirmConflict,
    openExisting,
    handleSubmit,
  };
}
