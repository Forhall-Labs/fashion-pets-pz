import { z } from "zod";

import { digitsOnly } from "./date-utils";

// Mismas reglas que Fashion_Pets_PZ-API/src/owners/dto/owner.schema.ts —
// los repos no comparten código, así que esta copia se mantiene en sync a
// mano. Mantenerlas alineadas evita el tipo de bug que motivó esto: el
// límite de nombre era 300 acá y 200 en el backend.
export const ownerFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200, "Máximo 200 caracteres."),
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio.")
    .refine((v) => {
      const digits = digitsOnly(v).length;
      return digits >= 7 && digits <= 15;
    }, "Ingresá un teléfono válido (7 a 15 dígitos)."),
  address: z.string().trim(),
  fixedVisitDay: z.string(),
});

export type OwnerFormValues = z.infer<typeof ownerFormSchema>;
