"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { hoursFormSchema, type HoursFormValues } from "@/modules/shared/lib/shop-config-schema";
import type { ShopConfig } from "@/modules/shared/types";

import { useShopConfigSave } from "./useShopConfigSave";

// HU-4.3 — horario de atención.
export function useHoursForm(config: ShopConfig | undefined) {
  const form = useForm<HoursFormValues>({
    resolver: zodResolver(hoursFormSchema),
    values: config ? { openTime: config.openTime, closeTime: config.closeTime } : undefined,
    defaultValues: { openTime: "", closeTime: "" },
  });

  // reset() sin argumentos vuelve a `values` (la config guardada).
  const save = useShopConfigSave("hours", () => form.reset());

  const handleSubmit = form.handleSubmit((values) => save.submit(values));

  return { register: form.register, errors: form.formState.errors, handleSubmit, save };
}
