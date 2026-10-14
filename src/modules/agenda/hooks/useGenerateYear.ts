"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { translateApiError, translateAppointmentError } from "@/modules/shared/lib/api-errors";
import { schedulingApi } from "@/modules/shared/lib/scheduling-api";

// HU-3.1 — "Programar agenda <año>": vista previa (corrida en seco, no
// escribe nada) → confirmar → spinner hasta que el servidor termina →
// reporte. El modal no se cierra mientras corre (convención de toda la app).
export function useGenerateYear() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const preview = useQuery({
    queryKey: ["scheduling-preview"],
    queryFn: schedulingApi.preview,
    enabled: open,
    // Cada apertura vuelve a planificar sobre el estado actual.
    staleTime: 0,
    gcTime: 0,
  });

  const run = useMutation({
    mutationFn: schedulingApi.run,
    onSuccess: async () => {
      try {
        await queryClient.refetchQueries(
          { queryKey: ["appointments"], type: "active" },
          { throwOnError: true },
        );
      } catch {
        setRefreshFailed(true);
      }
    },
  });

  function close() {
    if (run.isPending) return;
    setOpen(false);
    setRefreshFailed(false);
    run.reset();
  }

  return {
    open,
    start: () => setOpen(true),
    close,
    preview: preview.data ?? null,
    previewLoading: preview.isFetching,
    previewError: preview.isError ? translateApiError(preview.error) : null,
    retryPreview: () => void preview.refetch(),
    confirm: () => run.mutate(),
    running: run.isPending,
    report: run.data ?? null,
    // El 409 del candado ("ya hay una programación en curso") se muestra tal cual.
    runError: run.isError ? translateAppointmentError(run.error) : null,
    refreshFailed,
  };
}
