import { z } from "zod";

import { toISODate } from "./date-utils";

// HU-5.1 @validation: mismas reglas de rango que valida el API
// (validatePreferredRange en waiting-list.rules.ts), para avisar antes de
// mandar. Elegibilidad (cita activa, ya en la lista) la decide el backend.
export const waitingListFormSchema = z
  .object({
    petId: z.string().min(1, "Elegí una mascota."),
    preferredStartDate: z.string(),
    preferredEndDate: z.string(),
  })
  .refine(
    (v) =>
      !v.preferredStartDate || !v.preferredEndDate || v.preferredEndDate >= v.preferredStartDate,
    {
      path: ["preferredEndDate"],
      message: "La fecha final no puede ser anterior a la inicial.",
    },
  )
  .refine((v) => !v.preferredEndDate || v.preferredEndDate >= toISODate(new Date()), {
    path: ["preferredEndDate"],
    message: "El rango tiene que incluir una fecha futura.",
  });

export type WaitingListFormValues = z.infer<typeof waitingListFormSchema>;
