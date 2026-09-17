"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  AggressiveBadge,
  ExceptionBadge,
  PickupBadge,
  ServiceBadge,
  SizeBadge,
  StatusBadge,
} from "./Badge";
import { formatDateLong } from "../lib/date-utils";
import { Modal, ModalHeader } from "./Modal";
import { MapPinIcon } from "./MapPinIcon";
import { PawPrintsSpinner } from "./PawPrintsSpinner";
import { WalkingDogLoader } from "./WalkingDogLoader";
import { WarningIcon } from "./WarningIcon";
import { appointmentsApi } from "../lib/appointments-api";
import { useAppointmentDetailModal } from "../hooks/useAppointmentDetailModal";
import type { Appointment } from "../types";

interface AppointmentDetailModalProps {
  appointmentId: string;
  onClose: () => void;
  onEdit?: (appt: Appointment) => void;
}

// Puerto de openAppointmentDetail(), ahora contra la API real — ver
// useAppointmentDetailModal.ts para el detalle de las 3 queries encadenadas
// y cómo distinguen "no existe" de "error de red" por sección.
export function AppointmentDetailModal({
  appointmentId,
  onClose,
  onEdit,
}: AppointmentDetailModalProps) {
  const queryClient = useQueryClient();
  const {
    loading,
    notFound,
    loadError,
    appt,
    pet,
    owner,
    ownerSectionError,
    loc,
    waLink,
    goToOwner,
  } = useAppointmentDetailModal(appointmentId, onClose);

  const cancelMutation = useMutation({
    mutationFn: () => appointmentsApi.cancel(appointmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
  });

  if (loading) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Detalle de cita" onClose={onClose} />
        <WalkingDogLoader />
      </Modal>
    );
  }

  if (notFound) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Detalle de cita" onClose={onClose} />
        <p className="modal-body-text">Esta cita ya no existe.</p>
      </Modal>
    );
  }

  if (loadError || !appt || !pet) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Detalle de cita" onClose={onClose} />
        <div className="empty-state">
          <span className="empty-state-icon">
            <WarningIcon size={32} />
          </span>
          No se pudo cargar la cita.
        </div>
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
        {ownerSectionError ? (
          <span className="text-small">no se pudo cargar</span>
        ) : owner ? (
          <a
            href={`/owners/${owner.id}`}
            onClick={(e) => {
              e.preventDefault();
              goToOwner();
            }}
          >
            {owner.name}
          </a>
        ) : null}
      </p>
      <p className="text-small">
        {formatDateLong(appt.date)} · {appt.startTime} ({appt.durationMinutes} min)
      </p>
      {appt.flaggedReason ? <p className="text-small">{appt.flaggedReason}</p> : null}
      {pet.needsPickup ? (
        <p className="text-small" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <MapPinIcon size={14} /> {loc?.address || "Ubicación faltante"}
        </p>
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
      {cancelMutation.isError ? (
        <p className="text-small" style={{ color: "var(--color-danger)" }}>
          No se pudo cancelar la cita. Probá de nuevo.
        </p>
      ) : null}
      <div className="modal-actions">
        {appt.status === "scheduled" ? (
          <>
            {onEdit ? (
              <button className="btn btn-secondary" onClick={() => onEdit(appt)}>
                Editar / Reprogramar
              </button>
            ) : null}
            <button
              className="btn btn-destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? <PawPrintsSpinner /> : "Cancelar cita"}
            </button>
          </>
        ) : null}
        <button className="btn btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
