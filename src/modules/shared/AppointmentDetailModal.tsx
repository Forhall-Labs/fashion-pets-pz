"use client";

import {
  AggressiveBadge,
  ExceptionBadge,
  PickupBadge,
  ServiceBadge,
  SizeBadge,
  StatusBadge,
} from "./Badge";
import { formatDateLong } from "./date-utils";
import { Modal, ModalHeader } from "./Modal";
import type { MockData } from "./types";
import { useAppointmentDetailModal } from "./hooks/useAppointmentDetailModal";

interface AppointmentDetailModalProps {
  data: MockData;
  appointmentId: string;
  onClose: () => void;
}

// Puerto de openAppointmentDetail() — solo lectura por ahora. Editar,
// reprogramar y cancelar quedan para la próxima etapa (necesitan mutaciones
// contra la API real, no mock local).
export function AppointmentDetailModal({
  data,
  appointmentId,
  onClose,
}: AppointmentDetailModalProps) {
  const { appt, pet, owner, loc, waLink, goToOwner } = useAppointmentDetailModal(
    data,
    appointmentId,
    onClose,
  );

  if (!appt || !pet || !owner) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Detalle de cita" onClose={onClose} />
        <p className="modal-body-text">Esta cita ya no existe.</p>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Detalle de cita" onClose={onClose} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <StatusBadge status={appt.status} />
        <ServiceBadge type={appt.serviceType} />
        <SizeBadge size={pet.size} />
        {pet.isAggressive ? <AggressiveBadge /> : null}
        {pet.needsPickup ? <PickupBadge /> : null}
        {appt.flaggedReason ? <ExceptionBadge /> : null}
      </div>
      <p>
        <strong>{pet.name}</strong> · dueño/a{" "}
        <a
          href={`/owners/${owner.id}`}
          onClick={(e) => {
            e.preventDefault();
            goToOwner();
          }}
        >
          {owner.name}
        </a>
      </p>
      <p className="text-small">
        {formatDateLong(appt.date)} · {appt.startTime} ({appt.durationMinutes} min)
      </p>
      {appt.flaggedReason ? <p className="text-small">{appt.flaggedReason}</p> : null}
      {pet.needsPickup ? (
        <p className="text-small">📍 {loc?.address || "Ubicación faltante"}</p>
      ) : null}
      <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
        <a
          className={`btn btn-secondary btn-sm ${waLink ? "" : "btn-disabled"}`}
          href={waLink ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!waLink}
          onClick={(e) => {
            if (!waLink) e.preventDefault();
          }}
        >
          Enviar por WhatsApp
        </a>
      </div>
      <p className="text-small" style={{ marginTop: 4 }}>
        Se abrirá WhatsApp con el mensaje listo — vos lo enviás.
      </p>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
