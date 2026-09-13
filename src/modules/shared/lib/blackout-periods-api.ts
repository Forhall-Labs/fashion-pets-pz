// Cliente de solo lectura — lo consume Agenda (resaltar días bloqueados en
// el calendario). La pantalla de Configuración sigue en estado local (ver
// ConfigView.tsx), no wireada acá.

import type { BlackoutPeriod } from "../types";
import { apiClient } from "./api-client";

export const blackoutPeriodsApi = {
  list: () => apiClient.get<BlackoutPeriod[]>("/blackout-periods"),
};
