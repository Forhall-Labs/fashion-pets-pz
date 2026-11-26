import { z } from "zod";

// Espejo de src/services/dto/service.schema.ts del API (repos separados, sync a mano).
const minutes = z
  .string()
  .trim()
  .min(1, "Ingresá los minutos.")
  .refine((v) => /^\d+$/.test(v) && Number(v) >= 1, "Debe ser un número entero mayor a 0.")
  .refine((v) => Number(v) <= 600, "Máximo 600 minutos.");

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(100, "Máximo 100 caracteres."),
  durationSmallMinutes: minutes,
  durationMediumMinutes: minutes,
  durationExtraLargeMinutes: minutes,
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
