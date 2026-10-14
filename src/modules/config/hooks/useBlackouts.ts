"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { translateApiError } from "@/modules/shared/lib/api-errors";
import {
  blackoutPeriodsApi,
  type BlackoutConflicts,
  type ConflictResolution,
} from "@/modules/shared/lib/blackout-periods-api";
import { toISODate } from "@/modules/shared/lib/date-utils";
import {
  blackoutFormSchema,
  type BlackoutFormValues,
} from "@/modules/shared/lib/shop-config-schema";
import type { BlackoutPeriod } from "@/modules/shared/types";

// Lo que efectivamente se va a guardar: un período nuevo (targetId null), la
// edición de uno existente, o la unión con bloqueos solapados (targetId = el
// que sobrevive, deleteIds = los que quedan absorbidos por la unión).
export interface BlackoutDraft {
  startDate: string;
  endDate: string;
  label: string | null;
  targetId: string | null;
  deleteIds: string[];
}

export type BlackoutStep =
  | { type: "past"; values: BlackoutFormValues }
  | { type: "overlap"; values: BlackoutFormValues; periods: BlackoutPeriod[] }
  | { type: "appointments"; draft: BlackoutDraft; appointments: BlackoutConflicts["appointments"] }
  | { type: "delete"; period: BlackoutPeriod }
  | { type: "partial-failure"; failed: number }
  | null;

const EMPTY_FORM: BlackoutFormValues = { startDate: "", endDate: "", label: "" };

// HU-4.1 — períodos de bloqueo. Antes de guardar se encadenan los avisos que
// pide la HU, en este orden: rango en el pasado → solapamiento con otro
// bloqueo (unir/ajustar) → citas dentro del rango (cancelar/excepción/
// reprogramar). Cada paso es un modal; el período recién se guarda al final.
export function useBlackouts() {
  const queryClient = useQueryClient();
  const periodsQuery = useQuery({
    queryKey: ["blackout-periods"],
    queryFn: blackoutPeriodsApi.list,
  });

  const form = useForm<BlackoutFormValues>({
    resolver: zodResolver(blackoutFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<BlackoutStep>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const checkConflicts = useMutation({ mutationFn: blackoutPeriodsApi.conflicts });

  async function afterWrite() {
    await queryClient.invalidateQueries({ queryKey: ["blackout-periods"] });
    try {
      await queryClient.refetchQueries(
        { queryKey: ["appointments"], type: "active" },
        { throwOnError: true },
      );
    } catch {
      setRefreshFailed(true);
    }
  }

  const persist = useMutation({
    mutationFn: async ({
      draft,
      resolution,
    }: {
      draft: BlackoutDraft;
      resolution?: ConflictResolution;
    }) => {
      const input = {
        startDate: draft.startDate,
        endDate: draft.endDate,
        label: draft.label,
        conflictResolution: resolution,
      };
      const result = draft.targetId
        ? await blackoutPeriodsApi.update(draft.targetId, input)
        : await blackoutPeriodsApi.create(input);
      for (const id of draft.deleteIds) await blackoutPeriodsApi.remove(id);
      return result;
    },
    onSuccess: async (result) => {
      form.reset(EMPTY_FORM);
      setEditingId(null);
      setStep(
        result.failed.length > 0 ? { type: "partial-failure", failed: result.failed.length } : null,
      );
      await afterWrite();
    },
    onError: (err: unknown) => {
      setStep(null);
      setError(translateApiError(err));
    },
  });

  const removal = useMutation({
    mutationFn: blackoutPeriodsApi.remove,
    onSuccess: async (_, id) => {
      setStep(null);
      if (editingId === id) cancelEdit();
      await afterWrite();
    },
    onError: (err: unknown) => {
      setStep(null);
      setError(translateApiError(err));
    },
  });

  async function fetchConflicts(range: { startDate: string; endDate: string; excludeId?: string }) {
    try {
      return await checkConflicts.mutateAsync(range);
    } catch (err) {
      setStep(null);
      setError(translateApiError(err));
      return null;
    }
  }

  async function goToAppointments(draft: BlackoutDraft, excludeId?: string) {
    const conflicts = await fetchConflicts({
      startDate: draft.startDate,
      endDate: draft.endDate,
      excludeId,
    });
    if (!conflicts) return;
    if (conflicts.appointments.length > 0) {
      setStep({ type: "appointments", draft, appointments: conflicts.appointments });
    } else {
      persist.mutate({ draft });
    }
  }

  async function checkOverlapAndContinue(values: BlackoutFormValues) {
    const conflicts = await fetchConflicts({
      startDate: values.startDate,
      endDate: values.endDate,
      excludeId: editingId ?? undefined,
    });
    if (!conflicts) return;
    if (conflicts.overlappingPeriods.length > 0) {
      setStep({ type: "overlap", values, periods: conflicts.overlappingPeriods });
      return;
    }
    const draft: BlackoutDraft = {
      startDate: values.startDate,
      endDate: values.endDate,
      label: values.label || null,
      targetId: editingId,
      deleteIds: [],
    };
    if (conflicts.appointments.length > 0) {
      setStep({ type: "appointments", draft, appointments: conflicts.appointments });
    } else {
      persist.mutate({ draft });
    }
  }

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);
    // HU-4.1 @validation: rango entero en el pasado → avisar antes de guardar.
    if (values.endDate < toISODate(new Date())) {
      setStep({ type: "past", values });
      return;
    }
    void checkOverlapAndContinue(values);
  });

  function confirmPast() {
    if (step?.type !== "past") return;
    void checkOverlapAndContinue(step.values);
  }

  // "Unir en uno": el primer período solapado absorbe la unión de todas las
  // fechas; los demás (y el que se estaba editando, si era otro) se borran.
  function mergeOverlap() {
    if (step?.type !== "overlap") return;
    const { values, periods } = step;
    const [target, ...rest] = periods;
    const starts = [values.startDate, ...periods.map((p) => p.startDate)].sort();
    const ends = [values.endDate, ...periods.map((p) => p.endDate)].sort();
    const draft: BlackoutDraft = {
      startDate: starts[0],
      endDate: ends[ends.length - 1],
      label: values.label || target.label,
      targetId: target.id,
      deleteIds: [
        ...rest.map((p) => p.id),
        ...(editingId && editingId !== target.id ? [editingId] : []),
      ],
    };
    void goToAppointments(draft, target.id);
  }

  function resolveAppointments(resolution: ConflictResolution) {
    if (step?.type !== "appointments") return;
    persist.mutate({ draft: step.draft, resolution });
  }

  function startEdit(period: BlackoutPeriod) {
    setEditingId(period.id);
    form.reset({
      startDate: period.startDate,
      endDate: period.endDate,
      label: period.label ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    form.reset(EMPTY_FORM);
  }

  return {
    periods: periodsQuery.data ?? [],
    loading: periodsQuery.isPending,
    loadError: periodsQuery.isError,
    reload: () => void periodsQuery.refetch(),
    register: form.register,
    errors: form.formState.errors,
    handleSubmit,
    editingId,
    startEdit,
    cancelEdit,
    busy: checkConflicts.isPending || persist.isPending,
    saving: persist.isPending,
    step,
    closeStep: () => setStep(null),
    confirmPast,
    mergeOverlap,
    resolveAppointments,
    requestDelete: (period: BlackoutPeriod) => setStep({ type: "delete", period }),
    confirmDelete: () => step?.type === "delete" && removal.mutate(step.period.id),
    deleting: removal.isPending,
    error,
    clearError: () => setError(null),
    refreshFailed,
    clearRefreshFailed: () => setRefreshFailed(false),
  };
}
