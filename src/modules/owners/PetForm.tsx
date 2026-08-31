"use client";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";
import { Modal, ModalHeader } from "@/modules/shared/components/Modal";
import { IncompleteBadge } from "@/modules/shared/components/Badge";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import { FREQ_LABEL, SIZE_LABEL } from "@/modules/shared/lib/labels";
import type { GroomingFrequency, Owner, Pet, PetSize } from "@/modules/shared/types";

import { usePetForm } from "./hooks/usePetForm";

interface PetFormProps {
  pet?: Pet | null;
  owner: Owner;
  existingPets: Pet[];
  onSaved?: (pet: Pet) => void;
  onClose: () => void;
}

const SIZE_OPTIONS: PetSize[] = ["small", "medium", "extra_large"];
const FREQ_OPTIONS: GroomingFrequency[] = [
  "twice_a_month",
  "once_a_month",
  "once_every_two_months",
];

// Puerto de openPetForm() (docs/prototype/app.js:762-860) — form de
// creación/edición de mascota, con la confirmación de "es agresivo", el
// aviso de nombre duplicado y el conflicto de frecuencia con citas futuras
// (HU-1.3).
export function PetForm({ pet = null, owner, existingPets, onSaved, onClose }: PetFormProps) {
  const {
    editing,
    register,
    errors,
    name,
    isAggressive,
    toggleAggressive,
    incomplete,
    submitting,
    error,
    clearError,
    stage,
    confirmAggressive,
    cancelAggressive,
    duplicateName,
    cancelDuplicateName,
    confirmDuplicateName,
    futureAppointmentCount,
    keepAppointments,
    regenerateAppointments,
    cancelFrequencyConflict,
    handleSubmit,
  } = usePetForm({ pet, ownerId: owner.id, existingPets, onSaved, onClose });

  if (stage === "aggressive-confirm") {
    return (
      <Modal onClose={cancelAggressive} blocking>
        <ModalHeader title="Confirmar mascota agresiva" />
        <p className="modal-body-text">
          Vas a marcar esta mascota como agresiva. Esto agrega una nota visible de manejo especial
          en su ficha y en cada cita. ¿Confirmás?
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={cancelAggressive}>
            Cancelar
          </button>
          <button className="btn btn-destructive" onClick={confirmAggressive}>
            Entendido, marcar como agresivo
          </button>
        </div>
      </Modal>
    );
  }

  if (stage === "duplicate-name") {
    return (
      <Modal onClose={cancelDuplicateName} blocking>
        <ModalHeader title="Posible mascota duplicada" />
        <p className="modal-body-text">
          Ya existe una mascota llamada <strong>{duplicateName}</strong> para este dueño. ¿Confirmás
          que es intencional?
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={cancelDuplicateName}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={confirmDuplicateName}>
            Guardar de todos modos
          </button>
        </div>
      </Modal>
    );
  }

  if (stage === "frequency-conflict") {
    const plural = futureAppointmentCount === 1 ? "" : "s";
    return (
      <Modal onClose={cancelFrequencyConflict} blocking>
        <ModalHeader title="¿Mantener o regenerar citas futuras?" />
        <p className="modal-body-text">
          {name} tiene {futureAppointmentCount} cita{plural} futura{plural} generada{plural} con la
          frecuencia anterior. ¿Qué querés hacer?
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={keepAppointments}>
            Mantener citas existentes
          </button>
          <button className="btn btn-primary" onClick={regenerateAppointments}>
            Regenerar citas futuras
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal onClose={onClose}>
        <ModalHeader
          title={`${editing ? "Editar mascota" : "Agregar mascota"} — ${owner.name}`}
          onClose={onClose}
        />
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className={`field ${errors.name ? "has-error" : ""}`}>
              <label htmlFor="pf-name">Nombre</label>
              <input id="pf-name" {...register("name")} />
              <span className="error-msg">{errors.name?.message}</span>
            </div>
            <div className={`field ${errors.breed ? "has-error" : ""}`}>
              <label htmlFor="pf-breed">Raza</label>
              <input id="pf-breed" {...register("breed")} />
              <span className="error-msg">{errors.breed?.message}</span>
            </div>
          </div>
          <div className={`field ${errors.size ? "has-error" : ""}`}>
            <label htmlFor="pf-size">Tamaño</label>
            <select id="pf-size" {...register("size")}>
              <option value="">Seleccioná un tamaño…</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {SIZE_LABEL[s]}
                </option>
              ))}
            </select>
            <span className="error-msg">{errors.size?.message}</span>
          </div>
          <div className="checkbox-field">
            <input
              type="checkbox"
              id="pf-aggressive"
              checked={isAggressive}
              onChange={(e) => toggleAggressive(e.target.checked)}
            />
            <label htmlFor="pf-aggressive">Es agresivo</label>
          </div>
          <div className="checkbox-field">
            <input type="checkbox" id="pf-pickup" {...register("needsPickup")} />
            <label htmlFor="pf-pickup">Necesita pickup</label>
          </div>
          <div className="field">
            <label htmlFor="pf-location">Ubicación</label>
            <input
              id="pf-location"
              {...register("locationAddress")}
              placeholder="Dejar vacío para usar la del dueño"
            />
            <span className="hint">Dueño: {owner.address || "sin dirección"}</span>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="pf-freq">Frecuencia de grooming</label>
              <select id="pf-freq" {...register("groomingFrequency")}>
                <option value="">Sin definir</option>
                {FREQ_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {FREQ_LABEL[f]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pf-duration">Duración promedio (min)</label>
              <input type="number" id="pf-duration" min={1} {...register("avgServiceDuration")} />
            </div>
          </div>
          {incomplete && (
            <p>
              <IncompleteBadge />
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${submitting ? "btn-loading" : ""}`}
              disabled={submitting}
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
