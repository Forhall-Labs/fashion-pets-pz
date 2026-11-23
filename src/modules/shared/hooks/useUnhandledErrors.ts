"use client";

import { useEffect, useState } from "react";

import { isReportableError } from "../lib/unhandled-errors";

// Escucha los errores no atrapados de toda la app. Mientras el modal está
// abierto, los siguientes no lo reabren: un mismo fallo suele disparar varios.
export function useUnhandledErrors() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function report(reason: unknown) {
      if (!isReportableError(reason)) return;
      setOpen(true);
    }
    const onError = (event: ErrorEvent) => report(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => report(event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return { open, close: () => setOpen(false) };
}
