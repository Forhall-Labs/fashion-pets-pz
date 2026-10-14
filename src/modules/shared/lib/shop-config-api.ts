import type { ShopConfig } from "../types";
import { apiClient, toQueryString } from "./api-client";

// La API serializa las horas como "HH:MM:SS"; el resto del frontend (inputs
// type="time", comparaciones de string) trabaja con "HH:MM".
function normalize(config: ShopConfig): ShopConfig {
  return {
    ...config,
    openTime: config.openTime.slice(0, 5),
    closeTime: config.closeTime.slice(0, 5),
  };
}

export type ShopConfigInput = Partial<ShopConfig>;

export interface ShopConfigImpact {
  outOfHours: {
    id: string;
    petId: string;
    petName: string | null;
    date: string;
    startTime: string;
    durationMinutes: number;
  }[];
  overCapacityDays: { date: string; count: number }[];
}

export interface ShopConfigImpactParams {
  openTime?: string;
  closeTime?: string;
  maxPetsPerDay?: number;
}

export const shopConfigApi = {
  get: () => apiClient.get<ShopConfig>("/shop-config").then(normalize),
  update: (input: ShopConfigInput) =>
    apiClient.patch<ShopConfig>("/shop-config", input).then(normalize),
  // HU-4.2/4.3: qué citas futuras quedarían en infracción con estos valores.
  impact: (params: ShopConfigImpactParams) =>
    apiClient
      .get<ShopConfigImpact>(`/shop-config/impact${toQueryString({ ...params })}`)
      .then((impact) => ({
        ...impact,
        outOfHours: impact.outOfHours.map((a) => ({ ...a, startTime: a.startTime.slice(0, 5) })),
      })),
};
