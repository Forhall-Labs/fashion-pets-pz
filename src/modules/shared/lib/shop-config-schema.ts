import { z } from "zod";

// Espejo de UpdateShopConfigDto / CreateBlackoutPeriodDto del backend
// (Fashion_Pets_PZ-API) — los repos no comparten código, se mantienen en
// sync a mano. Mensajes separados por caso porque HU-4.2 pide uno distinto
// para cero, negativo, no numérico y decimal.

function positiveIntegerIssue(value: string): string | null {
  if (!/^-?\d+(\.\d+)?$/.test(value)) return "Debe ser un valor numérico.";
  const n = Number(value);
  if (!Number.isInteger(n)) return "Debe ser un número entero, sin decimales.";
  if (n < 0) return "Debe ser un número positivo.";
  if (n === 0) return "Debe ser un número entero positivo (mayor a 0).";
  return null;
}

export const capacityFormSchema = z.object({
  maxPetsPerDay: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const issue =
        value === "" ? "Ingresá el máximo de mascotas por día." : positiveIntegerIssue(value);
      if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue });
    }),
  // Opcional: vacío = servicio rápido todavía sin configurar (HU-5.4).
  quickServiceDurationMinutes: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const issue = value === "" ? null : positiveIntegerIssue(value);
      if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue });
    }),
});

export type CapacityFormValues = z.infer<typeof capacityFormSchema>;

const REQUIRED_HOURS = "La apertura y el cierre son obligatorios.";

export const hoursFormSchema = z
  .object({
    openTime: z.string().min(1, REQUIRED_HOURS),
    closeTime: z.string().min(1, REQUIRED_HOURS),
  })
  .refine((v) => !v.openTime || !v.closeTime || v.closeTime > v.openTime, {
    path: ["closeTime"],
    message: "El cierre debe ser posterior a la apertura.",
  });

export type HoursFormValues = z.infer<typeof hoursFormSchema>;

export const blackoutFormSchema = z
  .object({
    startDate: z.string().min(1, "Elegí una fecha de inicio."),
    endDate: z.string().min(1, "Elegí una fecha de fin."),
    label: z.string().trim().max(200, "Máximo 200 caracteres."),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "La fecha final debe ser igual o posterior al inicio.",
  });

export type BlackoutFormValues = z.infer<typeof blackoutFormSchema>;
