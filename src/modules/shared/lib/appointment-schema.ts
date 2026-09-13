import { z } from "zod";

// Reglas de shape únicamente (uuid/fecha/hora no vacíos, duración positiva)
// — blackout/horario/capacidad/overlap los valida el backend
// (AppointmentValidationService), porque necesitan leer shop_config y otras
// citas, no solo el shape del payload.
export const appointmentFormSchema = z.object({
  petId: z.string().min(1, "Elegí una mascota."),
  date: z.string().min(1, "Elegí una fecha."),
  startTime: z.string().min(1, "Elegí un horario."),
  durationMinutes: z
    .string()
    .min(1, "Ingresá la duración.")
    .refine((v) => Number(v) > 0, "La duración tiene que ser mayor a 0."),
  serviceType: z.string().min(1, "Elegí el tipo de servicio."),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
