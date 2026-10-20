"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { translateApiError } from "@/modules/shared/lib/api-errors";
import {
  shopConfigApi,
  type ShopConfigImpact,
  type ShopConfigInput,
} from "@/modules/shared/lib/shop-config-api";

export type ImpactKind = "capacity" | "hours";

// Cada sección solo avisa sobre lo que ella cambia: guardar la capacidad no
// debería listar citas que ya estaban fuera de horario desde antes.
function relevantImpact(kind: ImpactKind, impact: ShopConfigImpact): ShopConfigImpact {
  return kind === "capacity"
    ? { outOfHours: [], overCapacityDays: impact.overCapacityDays }
    : { outOfHours: impact.outOfHours, overCapacityDays: [] };
}

function hasImpact(impact: ShopConfigImpact): boolean {
  return impact.outOfHours.length > 0 || impact.overCapacityDays.length > 0;
}

// Flujo compartido de guardado de capacidad (HU-4.2) y horario (HU-4.3):
//   1. escanear el impacto sobre citas futuras (solo lectura),
//   2. si hay impacto, avisar — nunca se cancela ni se mueve nada,
//   3. PATCH, con el spinner hasta que responde el servidor,
//   4. refrescar la agenda (y avisar si ese refresco falla).
// `onCancel`: el Admin descartó el cambio desde un modal — el form vuelve a
// mostrar el valor guardado en vez de quedarse con el que no se guardó.
export function useShopConfigSave(kind: ImpactKind, onCancel?: () => void) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<{
    input: ShopConfigInput;
    impact: ShopConfigImpact;
  } | null>(null);
  const [scanFailedFor, setScanFailedFor] = useState<ShopConfigInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  const scan = useMutation({ mutationFn: shopConfigApi.impact });

  const save = useMutation({
    mutationFn: shopConfigApi.update,
    onSuccess: async (config) => {
      queryClient.setQueryData(["shop-config"], config);
      setPending(null);
      setSaved(true);
      try {
        await queryClient.refetchQueries(
          { queryKey: ["appointments"], type: "active" },
          { throwOnError: true },
        );
      } catch {
        setRefreshFailed(true);
      }
    },
    onError: (err: unknown) => {
      setPending(null);
      setError(translateApiError(err));
    },
  });

  async function submit(input: ShopConfigInput) {
    setSaved(false);
    setScanFailedFor(null);
    let impact: ShopConfigImpact;
    try {
      impact = relevantImpact(
        kind,
        await scan.mutateAsync({
          openTime: input.openTime,
          closeTime: input.closeTime,
          maxPetsPerDay: input.maxPetsPerDay,
        }),
      );
    } catch {
      setScanFailedFor(input);
      return;
    }
    if (hasImpact(impact)) {
      setPending({ input, impact });
      return;
    }
    save.mutate(input);
  }

  function confirmPending() {
    if (pending) save.mutate(pending.input);
  }

  function retryScan() {
    if (scanFailedFor) void submit(scanFailedFor);
  }

  function saveWithoutScan() {
    if (!scanFailedFor) return;
    const input = scanFailedFor;
    setScanFailedFor(null);
    save.mutate(input);
  }

  return {
    submit,
    busy: scan.isPending || save.isPending,
    saving: save.isPending,
    saved,
    pending,
    confirmPending,
    cancelPending: () => {
      setPending(null);
      onCancel?.();
    },
    scanFailed: scanFailedFor != null,
    retryScan,
    saveWithoutScan,
    dismissScanFailed: () => {
      setScanFailedFor(null);
      onCancel?.();
    },
    error,
    clearError: () => setError(null),
    refreshFailed,
    clearRefreshFailed: () => setRefreshFailed(false),
  };
}

export type ShopConfigSave = ReturnType<typeof useShopConfigSave>;
