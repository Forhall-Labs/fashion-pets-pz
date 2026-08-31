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
// creación/edición de mascota, con la confirmación de "es agresivo" y el
// conflicto de frecuencia con citas futuras (HU-1.3).
export function PetForm({ pet = null, owner, onSaved, onClose }: PetFormProps) {
  const {
    editing,
    name,
    setName,
    breed,
    setBreed,
    size,
    setSize,
    isAggressive,
    toggleAggressive,
    needsPickup,
    setNeedsPickup,
    locationAddress,
    setLocationAddress,
    groomingFrequency,
    setGroomingFrequency,
    avgServiceDuration,
    setAvgServiceDuration,
    nameError,
    breedError,
    sizeError,
    submitting,
    error,
    clearError,
    stage,
    confirmAggressive,
    cancelAggressive,
    futureAppointmentCount,
    keepAppointments,
    regenerateAppointments,
    cancelFrequencyConflict,
    handleSubmit,
  } = usePetForm({ pet, ownerId: owner.id, onSaved, onClose });

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

  const incomplete = !groomingFrequency || !avgServiceDuration;

  return (
    <>
      <Modal onClose={onClose}>
        <ModalHeader
          title={`${editing ? "Editar mascota" : "Agregar mascota"} — ${owner.name}`}
          onClose={onClose}
        />
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className={`field ${nameError ? "has-error" : ""}`}>
              <label htmlFor="pf-name">Nombre</label>
              <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
              <span className="error-msg">El nombre es obligatorio.</span>
            </div>
            <div className={`field ${breedError ? "has-error" : ""}`}>
              <label htmlFor="pf-breed">Raza</label>
              <input id="pf-breed" value={breed} onChange={(e) => setBreed(e.target.value)} />
              <span className="error-msg">La raza es obligatoria.</span>
            </div>
          </div>
          <div className={`field ${sizeError ? "has-error" : ""}`}>
            <label htmlFor="pf-size">Tamaño</label>
            <select id="pf-size" value={size} onChange={(e) => setSize(e.target.value as PetSize)}>
              <option value="">Seleccioná un tamaño…</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {SIZE_LABEL[s]}
                </option>
              ))}
            </select>
            <span className="error-msg">Elegí un tamaño.</span>
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
            <input
              type="checkbox"
              id="pf-pickup"
              checked={needsPickup}
              onChange={(e) => setNeedsPickup(e.target.checked)}
            />
            <label htmlFor="pf-pickup">Necesita pickup</label>
          </div>
          <div className="field">
            <label htmlFor="pf-location">Ubicación</label>
            <input
              id="pf-location"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="Dejar vacío para usar la del dueño"
            />
            <span className="hint">Dueño: {owner.address || "sin dirección"}</span>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="pf-freq">Frecuencia de grooming</label>
              <select
                id="pf-freq"
                value={groomingFrequency}
                onChange={(e) => setGroomingFrequency(e.target.value as GroomingFrequency | "")}
              >
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
              <input
                type="number"
                id="pf-duration"
                min={1}
                value={avgServiceDuration}
                onChange={(e) => setAvgServiceDuration(e.target.value)}
              />
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
