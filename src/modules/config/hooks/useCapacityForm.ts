"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  capacityFormSchema,
  type CapacityFormValues,
} from "@/modules/shared/lib/shop-config-schema";
import type { ShopConfig } from "@/modules/shared/types";

import { useShopConfigSave } from "./useShopConfigSave";

// HU-4.2 — capacidad diaria (+ duración del servicio rápido, misma card).
export function useCapacityForm(config: ShopConfig | undefined) {
  const form = useForm<CapacityFormValues>({
    resolver: zodResolver(capacityFormSchema),
    // `values` re-sincroniza el form cuando llega (o cambia) la config.
    values: config
      ? {
          maxPetsPerDay: String(config.maxPetsPerDay),
          quickServiceDurationMinutes: config.quickServiceDurationMinutes?.toString() ?? "",
        }
      : undefined,
    defaultValues: { maxPetsPerDay: "", quickServiceDurationMinutes: "" },
  });

  // reset() sin argumentos vuelve a `values` (la config guardada).
  const save = useShopConfigSave("capacity", () => form.reset());

  const handleSubmit = form.handleSubmit((values) =>
    save.submit({
      maxPetsPerDay: Number(values.maxPetsPerDay),
      ...(values.quickServiceDurationMinutes
        ? { quickServiceDurationMinutes: Number(values.quickServiceDurationMinutes) }
        : {}),
    }),
  );

  return { register: form.register, errors: form.formState.errors, handleSubmit, save };
}
