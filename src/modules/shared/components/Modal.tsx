"use client";

import { type ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  wide?: boolean;
  blocking?: boolean;
  children: ReactNode;
}

// Puerto de openModal()/closeModal() de docs/prototype/app.js — sin portal
// (alcanza con position:fixed acá, no hay ancestros con `transform`).
export function Modal({ onClose, wide, blocking, children }: ModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !blocking) onClose();
      }}
    >
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <div className="modal-header">
      <h2 className="text-h2">{title}</h2>
      {onClose ? (
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      ) : null}
    </div>
  );
}
