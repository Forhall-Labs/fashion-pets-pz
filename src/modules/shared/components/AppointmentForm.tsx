"use client";

import { ErrorModal } from "./ErrorModal";
import { Modal, ModalHeader } from "./Modal";
import { PawPrintsSpinner } from "./PawPrintsSpinner";
import { SERVICE_LABEL } from "../lib/labels";
import type { Appointment, ServiceType } from "../types";
import { useAppointmentForm } from "../hooks/useAppointmentForm";

interface AppointmentFormProps {
  appointment?: Appointment | null;
  presetDate?: string;
  presetPetId?: string;
  onSaved?: (appt: Appointment) => void;
  onClose: () => void;
}

const SERVICE_OPTIONS: ServiceType[] = ["full_groom", "quick_service"];

// Puerto de openAppointmentForm() (docs/prototype/app.js:517-599) contra la
// API real — crea o edita una cita, con autocompletado de duración según la
// mascota o el tipo de servicio.
export function AppointmentForm({
  appointment = null,
  presetDate,
  presetPetId,
  onSaved,
  onClose,
}: AppointmentFormProps) {
  const {
    editing,
    register,
    registerDuration,
    errors,
    petOptions,
    petsLoading,
    petId,
    serviceType,
    quickServiceDisabled,
    handlePetChange,
    handleServiceTypeChange,
    hoursError,
    dayDeviationWarning,
    submitting,
    error,
    clearError,
    handleSubmit,
  } = useAppointmentForm({ appointment, presetDate, presetPetId, onSaved, onClose });

  return (
    <>
      <Modal onClose={onClose}>
        <ModalHeader
          title={editing ? "Editar / reprogramar cita" : "Nueva cita"}
          onClose={onClose}
        />
        <form onSubmit={handleSubmit}>
          <div className={`field ${errors.petId ? "has-error" : ""}`}>
            <label htmlFor="af-pet">Mascota</label>
            <select
              id="af-pet"
              value={petId}
              onChange={(e) => handlePetChange(e.target.value)}
              disabled={petsLoading}
            >
              <option value="">Seleccioná una mascota…</option>
              {petOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="error-msg">{errors.petId?.message}</span>
          </div>

          <div className={`field ${errors.serviceType ? "has-error" : ""}`}>
            <label htmlFor="af-service-type">Tipo de servicio</label>
            <select
              id="af-service-type"
              value={serviceType}
              onChange={(e) => handleServiceTypeChange(e.target.value as ServiceType)}
            >
              {SERVICE_OPTIONS.map((s) => (
                <option key={s} value={s} disabled={s === "quick_service" && quickServiceDisabled}>
                  {SERVICE_LABEL[s]}
                </option>
              ))}
            </select>
            {quickServiceDisabled ? (
              <span className="hint">
                Configurá primero la duración del servicio rápido en Configuración.
              </span>
            ) : null}
            <span className="error-msg">{errors.serviceType?.message}</span>
          </div>

          <div className="field-row">
            <div
              className={`field ${errors.date ? "has-error" : dayDeviationWarning ? "has-warning" : ""}`}
            >
              <label htmlFor="af-date">Fecha</label>
              <input type="date" id="af-date" {...register("date")} />
              {errors.date?.message ? (
                <span className="error-msg">{errors.date.message}</span>
              ) : dayDeviationWarning ? (
                <span className="hint-warning">{dayDeviationWarning}</span>
              ) : null}
            </div>
            <div className={`field ${errors.startTime || hoursError ? "has-error" : ""}`}>
              <label htmlFor="af-time">Horario</label>
              <input type="time" id="af-time" {...register("startTime")} />
              <span className="error-msg">{errors.startTime?.message ?? hoursError}</span>
            </div>
            <div className={`field ${errors.durationMinutes ? "has-error" : ""}`}>
              <label htmlFor="af-duration">Duración (min)</label>
              <input type="number" id="af-duration" min={1} {...registerDuration} />
              <span className="error-msg">{errors.durationMinutes?.message}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${submitting ? "btn-loading" : ""}`}
              disabled={submitting || !!hoursError}
              title={hoursError ?? undefined}
            >
              {submitting ? <PawPrintsSpinner /> : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
      {error && <ErrorModal title="No se pudo guardar" message={error} onClose={clearError} />}
    </>
  );
}
