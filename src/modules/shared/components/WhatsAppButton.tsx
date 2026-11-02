"use client";

import { useWhatsAppButton } from "../hooks/useWhatsAppButton";
import type { WhatsAppResult } from "../lib/whatsapp";

interface WhatsAppButtonProps {
  result: WhatsAppResult | null;
  label: string;
}

// HU-7.1: el botón siempre se puede tocar — si falta algo (teléfono, fecha,
// citas) el motivo aparece al tocarlo, en vez de un link deshabilitado sin
// explicación. Si el navegador no abre WhatsApp, ofrece copiar el mensaje.
export function WhatsAppButton({ result, label }: WhatsAppButtonProps) {
  const { error, blocked, copied, messages, open, copy } = useWhatsAppButton(result);
  const multipart = messages.length > 1;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(multipart ? messages : [null]).map((_, i) => (
          <button
            key={i}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => open(i)}
            disabled={!result}
          >
            {multipart ? `${label} — mensaje ${i + 1} de ${messages.length}` : label}
          </button>
        ))}
      </div>
      {multipart ? (
        <p className="text-small" style={{ marginTop: 4 }}>
          El recordatorio es largo, así que se dividió en {messages.length} mensajes.
        </p>
      ) : null}
      {error ? (
        <p
          className="text-small"
          role="alert"
          style={{ marginTop: 4, color: "var(--color-danger)", whiteSpace: "pre-wrap" }}
        >
          {error}
        </p>
      ) : null}
      {blocked !== null ? (
        <p
          className="text-small"
          role="alert"
          style={{ marginTop: 4, color: "var(--color-danger)" }}
        >
          No se pudo abrir WhatsApp.{" "}
          <button type="button" className="btn btn-text btn-sm" onClick={() => copy(blocked)}>
            {copied ? "Mensaje copiado" : "Copiar mensaje"}
          </button>
        </p>
      ) : null}
      <p className="text-small" style={{ marginTop: 4 }}>
        Se abrirá WhatsApp con el mensaje listo — vos lo enviás.
      </p>
    </div>
  );
}
