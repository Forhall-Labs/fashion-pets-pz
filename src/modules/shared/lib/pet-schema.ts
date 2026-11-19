import { z } from "zod";

// Mismas reglas que Fashion_Pets_PZ-API/src/pets/dto/pet.schema.ts — repos
// separados, sync a mano. `breed` es requerido acá y en el backend (antes
// solo se validaba en el frontend, ver .planning/LOG.md 2026-08-31).
export const petFormSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio."),
    breed: z.string().trim().min(1, "La raza es obligatoria."),
    size: z.string().min(1, "Elegí un tamaño."),
    isAggressive: z.boolean(),
    needsPickup: z.boolean(),
    // Ubicación propia (opcional): si no se marca, la mascota usa la del dueño.
    hasOwnLocation: z.boolean(),
    locationAddress: z.string().trim(),
    point: z.object({ lat: z.number(), lng: z.number() }).nullable(),
    groomingFrequency: z.string(),
    avgServiceDuration: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.hasOwnLocation && !v.point && !v.locationAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["point"],
        message: "Marcá el punto en el mapa o escribí una dirección.",
      });
    }
  });

export type PetFormValues = z.infer<typeof petFormSchema>;
