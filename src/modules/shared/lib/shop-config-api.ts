// Cliente de solo lectura — lo consume Agenda (horario/capacidad para
// validar drops y autocompletar duración). La pantalla de Configuración en
// sí sigue en estado local (ver ConfigView.tsx), no wireada acá.

import type { ShopConfig } from "../types";
import { apiClient } from "./api-client";

export const shopConfigApi = {
  get: () => apiClient.get<ShopConfig>("/shop-config"),
};
