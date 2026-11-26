"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { servicesApi } from "../lib/services-api";
import type { Service } from "../types";

// El catálogo completo (incluye inactivos, para seguir mostrando el nombre en
// citas viejas). Lo comparten Configuración, el formulario de cita y las
// pantallas que muestran el nombre del servicio.
export function useServices() {
  const query = useQuery({ queryKey: ["services"], queryFn: servicesApi.list });
  const services = useMemo(() => query.data ?? [], [query.data]);
  const servicesById = useMemo(
    () => new Map<string, Service>(services.map((s) => [s.id, s])),
    [services],
  );
  return {
    services,
    servicesById,
    activeServices: services.filter((s) => s.active),
    loading: query.isPending,
    error: query.isError,
    reload: () => void query.refetch(),
  };
}
