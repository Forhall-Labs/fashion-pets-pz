"use client";

import { useState } from "react";

import { mockData } from "@/modules/shared/mock-data";
import type { BlackoutPeriod } from "@/modules/shared/types";

let blackoutIdCounter = 100;

// Puerto de "Configuración de Tienda" (renderConfig() en app.js). Guarda en
// estado local del componente, no en `mockData` — se resetea al salir de la
// pantalla hasta que haya API real. El modal de conflicto con citas
// existentes (HU-4.1) queda para la próxima etapa.
export function useConfigView() {
  const [maxPetsPerDay, setMaxPetsPerDay] = useState(mockData.shopConfig.maxPetsPerDay);
  const [quickServiceMinutes, setQuickServiceMinutes] = useState(
    mockData.shopConfig.quickServiceDurationMinutes,
  );
  const [maxError, setMaxError] = useState(false);

  const [openTime, setOpenTime] = useState(mockData.shopConfig.openTime);
  const [closeTime, setCloseTime] = useState(mockData.shopConfig.closeTime);
  const [hoursError, setHoursError] = useState(false);

  const [blackouts, setBlackouts] = useState<BlackoutPeriod[]>(mockData.blackoutPeriods);
  const [bfStart, setBfStart] = useState("");
  const [bfEnd, setBfEnd] = useState("");
  const [bfLabel, setBfLabel] = useState("");
  const [bfError, setBfError] = useState<"start" | "end" | null>(null);

  function submitCapacity(e: React.FormEvent) {
    e.preventDefault();
    const invalid = !Number.isInteger(maxPetsPerDay) || maxPetsPerDay <= 0;
    setMaxError(invalid);
  }

  function submitHours(e: React.FormEvent) {
    e.preventDefault();
    const invalid = !openTime || !closeTime || closeTime <= openTime;
    setHoursError(invalid);
  }

  function removeBlackout(id: string) {
    setBlackouts((bs) => bs.filter((x) => x.id !== id));
  }

  function submitBlackout(e: React.FormEvent) {
    e.preventDefault();
    if (!bfStart) {
      setBfError("start");
      return;
    }
    if (!bfEnd || bfEnd < bfStart) {
      setBfError("end");
      return;
    }
    setBfError(null);
    setBlackouts((bs) => [
      ...bs,
      {
        id: `b-local-${++blackoutIdCounter}`,
        startDate: bfStart,
        endDate: bfEnd,
        label: bfLabel || null,
      },
    ]);
    setBfStart("");
    setBfEnd("");
    setBfLabel("");
  }

  return {
    capacity: {
      maxPetsPerDay,
      setMaxPetsPerDay,
      quickServiceMinutes,
      setQuickServiceMinutes,
      error: maxError,
      submit: submitCapacity,
    },
    hours: {
      openTime,
      setOpenTime,
      closeTime,
      setCloseTime,
      error: hoursError,
      submit: submitHours,
    },
    blackouts: {
      items: blackouts,
      remove: removeBlackout,
      form: {
        start: bfStart,
        setStart: setBfStart,
        end: bfEnd,
        setEnd: setBfEnd,
        label: bfLabel,
        setLabel: setBfLabel,
        error: bfError,
        submit: submitBlackout,
      },
    },
  };
}
