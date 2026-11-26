"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useServices } from "@/modules/shared/hooks/useServices";
import { translateBusinessRuleError } from "@/modules/shared/lib/api-errors";
import { serviceFormSchema, type ServiceFormValues } from "@/modules/shared/lib/service-schema";
import { servicesApi, type ServiceInput } from "@/modules/shared/lib/services-api";
import type { Service } from "@/modules/shared/types";

const EMPTY_FORM: ServiceFormValues = {
  name: "",
  durationSmallMinutes: "",
  durationMediumMinutes: "",
  durationExtraLargeMinutes: "",
};

function toFormValues(s: Service): ServiceFormValues {
  return {
    name: s.name,
    durationSmallMinutes: String(s.durationSmallMinutes),
    durationMediumMinutes: String(s.durationMediumMinutes),
    durationExtraLargeMinutes: String(s.durationExtraLargeMinutes),
  };
}

// Épica 8 — catálogo de servicios: alta, edición y activar/desactivar (no se
// borra: puede haber citas que lo usan).
export function useServicesSection() {
  const queryClient = useQueryClient();
  const { services, loading, error: loadError, reload } = useServices();
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // null = cerrado; "new" = alta; un Service = edición.
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const saveMutation = useMutation({
    mutationFn: (input: Partial<ServiceInput>) =>
      editing && editing !== "new"
        ? servicesApi.update(editing.id, input)
        : servicesApi.create(input as ServiceInput, idempotencyKey.current),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditing(null);
    },
    onError: (err: unknown) => setError(translateBusinessRuleError(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (s: Service) => servicesApi.update(s.id, { active: !s.active }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["services"] }),
    onError: (err: unknown) => setError(translateBusinessRuleError(err)),
  });

  function openNew() {
    idempotencyKey.current = crypto.randomUUID();
    form.reset(EMPTY_FORM);
    setEditing("new");
  }

  function openEdit(s: Service) {
    form.reset(toFormValues(s));
    setEditing(s);
  }

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);
    saveMutation.mutate({
      name: values.name.trim(),
      durationSmallMinutes: Number(values.durationSmallMinutes),
      durationMediumMinutes: Number(values.durationMediumMinutes),
      durationExtraLargeMinutes: Number(values.durationExtraLargeMinutes),
    });
  });

  return {
    services,
    loading,
    loadError,
    reload,
    editing,
    openNew,
    openEdit,
    close: () => setEditing(null),
    register: form.register,
    errors: form.formState.errors,
    handleSubmit,
    saving: saveMutation.isPending,
    toggleActive: (s: Service) => toggleMutation.mutate(s),
    togglingId: toggleMutation.isPending ? toggleMutation.variables?.id : undefined,
    error,
    clearError: () => setError(null),
  };
}
