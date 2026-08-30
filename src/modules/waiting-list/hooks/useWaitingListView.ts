"use client";

import { mockData, TODAY_ISO } from "@/modules/shared/mock-data";
import { daysBetween, getOwner, getPet } from "@/modules/shared/selectors";

// Puerto de la pantalla "Lista de Espera" (renderWaitingList() en app.js).
export function useWaitingListView() {
  const active = mockData.waitingList
    .filter((w) => w.status === "active")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((w) => {
      const pet = getPet(mockData, w.petId)!;
      const owner = getOwner(mockData, pet.ownerId)!;
      return { ...w, pet, owner, waitingDays: daysBetween(w.createdAt, TODAY_ISO) };
    });

  return { active };
}
