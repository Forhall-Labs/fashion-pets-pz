"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { toISODate } from "@/modules/shared/lib/date-utils";
import { googleMapsUrl, MapLinkError, wazeUrl } from "@/modules/shared/lib/maps-links";
import { pickupsApi, pickupSignature, type PickupRoute } from "@/modules/shared/lib/pickups-api";
import type { Appointment } from "@/modules/shared/types";

// Bajo "appointments" a propósito: cancelar, mover o editar una cita
// invalida ["appointments"] y con eso también refresca las recogidas.
export const pickupsQueryKey = (date: string) => ["appointments", "pickups", date] as const;

// Épica 6 (HU-6.1–6.3) contra la API real: la lista y la ruta las arma el
// backend (pickups.rules.ts); acá queda el estado de pantalla y abrir mapas.
export function usePickupsView() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [route, setRoute] = useState<PickupRoute | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [blockedLink, setBlockedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingStale, setCheckingStale] = useState(false);
  const [openAppointmentId, setOpenAppointmentId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const pickupsQuery = useQuery({
    queryKey: pickupsQueryKey(date),
    queryFn: () => pickupsApi.list(date),
  });
  const routeMutation = useMutation({
    mutationFn: () => pickupsApi.route(date),
    onSuccess: (next) => setRoute(next),
  });

  const pickups = pickupsQuery.data ?? [];
  const currentRoute = route?.date === date ? route : null;
  const stale = currentRoute !== null && currentRoute.signature !== pickupSignature(pickups);
  const showingRoute = currentRoute !== null && !stale;

  function resetMapState() {
    setMapError(null);
    setBlockedLink(null);
    setCopied(false);
  }

  function changeDate(next: string) {
    setDate(next);
    setRoute(null);
    routeMutation.reset();
    resetMapState();
  }

  function generateRoute() {
    resetMapState();
    routeMutation.mutate();
  }

  // HU-6.3 "Route data is stale": antes de abrir el mapa se vuelve a pedir la
  // lista. La pestaña se abre de entrada (dentro del click, para que el
  // navegador no la bloquee) y se cierra si la ruta quedó vieja.
  async function openMap(build: () => string) {
    resetMapState();
    if (!currentRoute) return;
    let url: string;
    try {
      url = build();
    } catch (error) {
      setMapError(
        error instanceof MapLinkError ? error.message : "No se pudo armar el link del mapa.",
      );
      return;
    }
    const win = window.open("", "_blank");
    if (win) win.opener = null;

    setCheckingStale(true);
    const fresh = await pickupsQuery.refetch();
    setCheckingStale(false);
    if (!fresh.data || pickupSignature(fresh.data) !== currentRoute.signature) {
      win?.close();
      if (!fresh.data) setMapError("No se pudo confirmar que la ruta siga al día. Probá de nuevo.");
      return;
    }
    if (!win) {
      setBlockedLink(url);
      return;
    }
    win.location.href = url;
  }

  function openGoogleMaps() {
    if (!currentRoute) return;
    return openMap(() => googleMapsUrl(currentRoute.stops));
  }

  function openWaze(stopIndex = 0) {
    const stop = currentRoute?.stops[stopIndex];
    if (!stop) return;
    return openMap(() => wazeUrl(stop));
  }

  async function copyBlockedLink() {
    if (!blockedLink) return;
    try {
      await navigator.clipboard.writeText(blockedLink);
      setCopied(true);
    } catch {
      setMapError(`No se pudo copiar. Este es el link: ${blockedLink}`);
    }
  }

  return {
    date,
    changeDate,
    pickups,
    loading: pickupsQuery.isLoading,
    loadError: pickupsQuery.isError,
    reload: () => void pickupsQuery.refetch(),
    route: currentRoute,
    stale,
    showingRoute,
    generateRoute,
    generating: routeMutation.isPending,
    routeError: routeMutation.isError,
    openWaze,
    openGoogleMaps,
    checkingStale,
    mapError,
    blockedLink,
    copied,
    copyBlockedLink,
    openAppointmentId,
    openAppointment: setOpenAppointmentId,
    closeAppointment: () => setOpenAppointmentId(null),
    editingAppointment,
    setEditingAppointment,
  };
}
