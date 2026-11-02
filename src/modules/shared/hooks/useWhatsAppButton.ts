"use client";

import { useState } from "react";

import type { WhatsAppResult } from "../lib/whatsapp";

export function useWhatsAppButton(result: WhatsAppResult | null) {
  const [error, setError] = useState<string | null>(null);
  // Índice del mensaje que el navegador no dejó abrir (popup bloqueado, sin
  // app ni navegador que maneje el link) — para ofrecer copiarlo.
  const [blocked, setBlocked] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const messages = result?.ok ? result.messages : [];

  function open(index: number) {
    setCopied(false);
    setBlocked(null);
    if (!result) return;
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    const win = window.open(result.messages[index].url, "_blank");
    if (!win) {
      setBlocked(index);
      return;
    }
    win.opener = null;
  }

  async function copy(index: number) {
    if (!result?.ok) return;
    try {
      await navigator.clipboard.writeText(result.messages[index].text);
      setCopied(true);
    } catch {
      setError(
        "No se pudo copiar el mensaje. Copialo a mano desde acá:\n" + result.messages[index].text,
      );
    }
  }

  return { error, blocked, copied, messages, open, copy };
}
