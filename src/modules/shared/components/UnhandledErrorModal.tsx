"use client";

import { useUnhandledErrors } from "../hooks/useUnhandledErrors";
import { UNHANDLED_ERROR_MESSAGE } from "../lib/unhandled-errors";

import { ErrorModal } from "./ErrorModal";

// Montado una vez en el layout raíz: avisa de cualquier error no atrapado en
// vez de que la acción falle en silencio.
export function UnhandledErrorModal() {
  const { open, close } = useUnhandledErrors();
  if (!open) return null;
  return <ErrorModal title="Algo salió mal" message={UNHANDLED_ERROR_MESSAGE} onClose={close} />;
}
