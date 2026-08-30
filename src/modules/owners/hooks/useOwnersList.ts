"use client";

import { useState } from "react";

import { mockData } from "@/modules/shared/lib/mock-data";
import { petsOfOwner } from "@/modules/shared/lib/selectors";

// Puerto de la pantalla "Dueños — Lista" (renderOwnersList() en app.js).
export function useOwnersList() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const owners = mockData.owners
    .filter((o) => !q || o.name.toLowerCase().includes(q) || o.phone.includes(q))
    .map((o) => ({ ...o, petCount: petsOfOwner(mockData, o.id).length }));

  return { query, setQuery, owners };
}
