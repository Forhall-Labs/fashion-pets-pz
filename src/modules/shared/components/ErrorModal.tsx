"use client";

import { ErrorIcon } from "./ErrorIcon";
import { Modal } from "./Modal";

interface ErrorModalProps {
  title?: string;
  message: string;
  onClose: () => void;
}

// Modal genérico para errores bloqueantes (login, llamadas a la API, etc.) —
// reusa Modal en vez de un mensaje inline por pantalla. Todo centrado
// (ícono, título, texto, botón) en vez del layout título-izq/cerrar-der
// de ModalHeader, que acá no aplica.
export function ErrorModal({ title = "Ups...", message, onClose }: ErrorModalProps) {
  return (
    <Modal onClose={onClose}>
      <div style={{ position: "relative", textAlign: "center" }}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Cerrar"
          style={{ position: "absolute", top: 0, right: 0 }}
        >
          ×
        </button>
        <div className="error-modal-icon">
          <ErrorIcon />
        </div>
        <h2 className="text-h2">{title}</h2>
      </div>
      <p className="modal-body-text" style={{ textAlign: "center", marginTop: "var(--space-3)" }}>
        {message}
      </p>
      <div className="modal-actions" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>
          Entendido
        </button>
      </div>
    </Modal>
  );
}
