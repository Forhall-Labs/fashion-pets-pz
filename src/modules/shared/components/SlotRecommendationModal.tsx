"use client";

import { formatDateLong } from "../lib/date-utils";
import { SIZE_LABEL } from "../lib/labels";
import { dismissVacatedSlot, useVacatedSlot, type VacatedSlot } from "../lib/vacated-slot";
import type { PetSize } from "../types";
import { useSlotRecommendation } from "../hooks/useSlotRecommendation";
import { Modal, ModalHeader } from "./Modal";
import { PawPrintsSpinner } from "./PawPrintsSpinner";
import { WalkingDogLoader } from "./WalkingDogLoader";

function waitingSince(createdAt: string) {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 86_400_000));
  return `esperando hace ${days} día${days === 1 ? "" : "s"}`;
}

// HU-5.2/5.3: la recomendación para un lugar liberado. Se abre sola desde
// <VacatedSlotHost/> después de cancelar o mover una cita.
export function SlotRecommendationModal({
  slot,
  onDone,
}: {
  slot: VacatedSlot;
  onDone: () => void;
}) {
  const r = useSlotRecommendation(slot, onDone);
  const title = "Se liberó un lugar";
  const when = `${formatDateLong(slot.date)} a las ${slot.startTime}`;

  if (r.staleReason) {
    return (
      <Modal onClose={onDone}>
        <ModalHeader title={title} onClose={onDone} />
        <p>La cita quedó agendada.</p>
        <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
          {r.staleReason}
        </p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onDone}>
            Entendido
          </button>
        </div>
      </Modal>
    );
  }

  const errorLine = r.error ? (
    <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
      {r.error}
    </p>
  ) : null;

  if (r.mode === "manual") {
    return (
      <Modal onClose={onDone} blocking={r.busy}>
        <ModalHeader title="Reservar otra mascota" onClose={r.busy ? undefined : onDone} />
        <p className="text-small">
          {when} · lugar de tamaño {r.slotSizeLabel}
        </p>
        <div className="field">
          <label htmlFor="sr-pet">Mascota</label>
          <select
            id="sr-pet"
            value={r.manualPetId}
            onChange={(e) => r.chooseManualPet(e.target.value)}
          >
            <option value="">Seleccioná una mascota…</option>
            {r.petOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {r.sizeMismatch ? (
          <div className="checkbox-field" role="alert">
            <input
              type="checkbox"
              id="sr-mismatch"
              checked={r.mismatchConfirmed}
              onChange={(e) => r.setMismatchConfirmed(e.target.checked)}
            />
            <label htmlFor="sr-mismatch">
              El tamaño no coincide (lugar {r.slotSizeLabel}, mascota {r.manualPetSizeLabel}).
              Reservar igual y marcarlo como excepción.
            </label>
          </div>
        ) : null}
        {errorLine}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={r.backToRecommendations} disabled={r.busy}>
            Volver
          </button>
          <button className="btn btn-primary" onClick={r.bookManually} disabled={r.busy}>
            {r.busy ? <PawPrintsSpinner /> : "Reservar"}
          </button>
        </div>
      </Modal>
    );
  }

  const rec = r.recommendation;
  return (
    <Modal onClose={onDone} blocking={r.busy}>
      <ModalHeader title={title} onClose={r.busy ? undefined : onDone} />
      <p className="text-small">
        {when} · tamaño {r.slotSizeLabel}
      </p>

      {r.loading ? (
        <WalkingDogLoader label="Buscando en la lista de espera…" />
      ) : r.loadError ? (
        <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
          No se pudo consultar la lista de espera. El lugar sigue libre.{" "}
          <button className="btn btn-text btn-sm" onClick={r.retry}>
            Reintentar
          </button>
        </p>
      ) : rec?.status === "manual_review" ? (
        <p className="text-small" role="alert">
          Sin recomendación automática: {rec.reason} Revisalo a mano.
        </p>
      ) : rec?.status === "open_no_match" ? (
        <p className="text-small">
          Nadie de tamaño {r.slotSizeLabel} en la lista de espera para esa fecha. El lugar queda
          libre, sin coincidencias.
        </p>
      ) : rec ? (
        <fieldset className="field" style={{ border: 0, padding: 0 }}>
          <legend className="text-small">
            {rec.ranked
              ? "Recomendadas, primero la que espera hace más tiempo:"
              : "Candidatas sin ordenar (no se pudo ordenar por antigüedad):"}
          </legend>
          {r.candidates.map((c, i) => (
            <div className="checkbox-field" key={c.id}>
              <input
                type="radio"
                name="sr-candidate"
                id={`sr-${c.id}`}
                checked={r.chosenId === c.id}
                onChange={() => r.select(c.id)}
              />
              <label htmlFor={`sr-${c.id}`}>
                <strong>{c.petName}</strong> ({c.ownerName}) ·{" "}
                {SIZE_LABEL[c.size as PetSize] ?? c.size} · {waitingSince(c.createdAt)}
                {i === 0 && rec.ranked ? " · recomendada" : ""}
              </label>
            </div>
          ))}
        </fieldset>
      ) : null}

      {rec && rec.status !== "manual_review" && rec.flagged.length ? (
        <p className="text-small">
          Fuera de la recomendación por datos a corregir:{" "}
          {rec.flagged.map((f) => `${f.petName} (${f.reason})`).join("; ")}
        </p>
      ) : null}
      {errorLine}

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={r.leaveOpen} disabled={r.busy}>
          Dejar libre
        </button>
        <button className="btn btn-secondary" onClick={r.startManual} disabled={r.busy}>
          Reservar otra mascota
        </button>
        {r.candidates.length ? (
          <button className="btn btn-primary" onClick={r.approve} disabled={r.busy}>
            {r.busy ? <PawPrintsSpinner /> : "Aprobar"}
          </button>
        ) : null}
      </div>
    </Modal>
  );
}

/** En el shell: muestra la recomendación de cada lugar liberado, de a uno. */
export function VacatedSlotHost() {
  const slot = useVacatedSlot();
  if (!slot) return null;
  // key: un lugar nuevo arranca con estado limpio.
  return (
    <SlotRecommendationModal
      key={`${slot.date}-${slot.startTime}-${slot.previousPetId}`}
      slot={slot}
      onDone={dismissVacatedSlot}
    />
  );
}
