"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { hoursFormSchema, type HoursFormValues } from "@/modules/shared/lib/shop-config-schema";
import { DAY_OPTIONS } from "@/modules/shared/lib/labels";
import type { ShopConfig, Weekday } from "@/modules/shared/types";

import { useShopConfigSave } from "./useShopConfigSave";

// HU-4.3 — horario de atención, más los días que se atiende (2026-11-21).
export function useHoursForm(config: ShopConfig | undefined) {
  const form = useForm<HoursFormValues>({
    resolver: zodResolver(hoursFormSchema),
    values: config
      ? {
          openTime: config.openTime,
          closeTime: config.closeTime,
          openWeekdays: config.openWeekdays,
        }
      : undefined,
    defaultValues: { openTime: "", closeTime: "", openWeekdays: [] },
  });

  // reset() sin argumentos vuelve a `values` (la config guardada).
  const save = useShopConfigSave("hours", () => form.reset());

  const handleSubmit = form.handleSubmit((values) =>
    save.submit({
      openTime: values.openTime,
      closeTime: values.closeTime,
      // En orden de semana, sin importar el orden en que se marcaron.
      openWeekdays: DAY_OPTIONS.filter((d) => values.openWeekdays.includes(d)) as Weekday[],
    }),
  );

  return { register: form.register, errors: form.formState.errors, handleSubmit, save };
}
