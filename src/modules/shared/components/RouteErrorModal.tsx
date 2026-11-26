"use client";

import { useEffect } from "react";

import { ErrorModal } from "./ErrorModal";

interface RouteErrorModalProps {
  error: unknown;
  retry: () => void;
}

// UI de los error.tsx de Next: una pantalla que falló al renderizarse muestra
// el mismo modal de error, con "Reintentar" para volver a cargarla.
export function RouteErrorModal({ error, retry }: RouteErrorModalProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorModal
      title="Algo salió mal"
      message="Esta pantalla no se pudo mostrar por un error inesperado. Probá de nuevo; si sigue pasando, recargá la página."
      actionLabel="Reintentar"
      onClose={retry}
    />
  );
}
