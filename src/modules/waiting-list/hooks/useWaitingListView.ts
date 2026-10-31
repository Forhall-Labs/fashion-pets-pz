"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { waitingListApi, type WaitingEntry } from "@/modules/shared/lib/waiting-list-api";

export function waitingDays(createdAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - Date.parse(createdAt)) / 86_400_000));
}

// Pantalla "Lista de espera" (HU-5.1) contra la API real.
export function useWaitingListView() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ entry: WaitingEntry | null } | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["waiting-list"], queryFn: waitingListApi.list });
  const removeMutation = useMutation({
    mutationFn: waitingListApi.remove,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["waiting-list"] }),
    onError: () => setRemoveError("No se pudo quitar de la lista. Probá de nuevo."),
  });

  return {
    entries: query.data ?? [],
    loading: query.isLoading,
    loadError: query.isError,
    reload: () => void query.refetch(),
    form,
    openNew: () => setForm({ entry: null }),
    openEdit: (entry: WaitingEntry) => setForm({ entry }),
    closeForm: () => setForm(null),
    remove: (id: string) => {
      setRemoveError(null);
      removeMutation.mutate(id);
    },
    removingId: removeMutation.isPending ? removeMutation.variables : null,
    removeError,
  };
}
