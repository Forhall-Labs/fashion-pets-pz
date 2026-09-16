import { FREQ_LABEL, SERVICE_LABEL, SIZE_LABEL, STATUS_LABEL } from "../lib/labels";
import type { AppointmentStatus, GroomingFrequency, PetSize, ServiceType } from "../types";

import { CarIcon } from "./CarIcon";
import { MapPinIcon } from "./MapPinIcon";
import { WarningIcon } from "./WarningIcon";

export function SizeBadge({ size }: { size: PetSize }) {
  return <span className="badge badge-size">{SIZE_LABEL[size]}</span>;
}

export function FrequencyBadge({ frequency }: { frequency: GroomingFrequency }) {
  return <span className="badge badge-size">{FREQ_LABEL[frequency]}</span>;
}

export function ServiceBadge({ type }: { type: ServiceType }) {
  return <span className="badge badge-service">{SERVICE_LABEL[type]}</span>;
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge badge-status-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function SuggestedBadge() {
  return <span className="badge badge-suggested">Sugerido por el sistema</span>;
}

export function AggressiveBadge() {
  return (
    <span className="badge badge-aggressive">
      <WarningIcon size={14} /> Agresivo
    </span>
  );
}

export function PickupBadge() {
  return (
    <span className="badge badge-pickup">
      <CarIcon size={14} /> Necesita pickup
    </span>
  );
}

export function IncompleteBadge() {
  return <span className="badge badge-incomplete">Incompleto para agendar</span>;
}

export function LocationMissingBadge() {
  return (
    <span className="badge badge-incomplete">
      <MapPinIcon size={14} /> Ubicación faltante
    </span>
  );
}

export function ExceptionBadge() {
  return <span className="badge badge-exception">Excepción de bloqueo</span>;
}
