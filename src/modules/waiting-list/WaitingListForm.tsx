"use client";

import { Modal, ModalHeader } from "@/modules/shared/components/Modal";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import type { WaitingEntry } from "@/modules/shared/lib/waiting-list-api";

import { useWaitingListForm } from "./hooks/useWaitingListForm";

interface WaitingListFormProps {
  entry: WaitingEntry | null;
  existing: WaitingEntry[];
  onEditExisting: (entry: WaitingEntry) => void;
  onClose: () => void;
}

export function WaitingListForm(props: WaitingListFormProps) {
  const f = useWaitingListForm(props);
  const { onClose } = props;

  return (
    <Modal onClose={onClose} blocking={f.submitting}>
      <ModalHeader
        title={f.editing ? "Editar entrada" : "Agregar a la lista de espera"}
        onClose={f.submitting ? undefined : onClose}
      />
      <form onSubmit={(e) => void f.submit(e)} noValidate>
        <div className={`field ${f.errors.petId ? "has-error" : ""}`}>
          <label htmlFor="wl-pet">Mascota</label>
          <select
            id="wl-pet"
            value={f.petId}
            disabled={f.editing || f.petsLoading}
            onChange={(e) => void f.choosePet(e.target.value)}
          >
            <option value="">{f.petsLoading ? "Cargando…" : "Seleccioná una mascota…"}</option>
            {f.petOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="error-msg">{f.errors.petId?.message}</span>
        </div>

        {f.duplicate ? (
          <p className="text-small" role="alert">
            Esta mascota ya está en la lista de espera.{" "}
            <button type="button" className="btn btn-text btn-sm" onClick={f.editDuplicate}>
              Editar esa entrada
            </button>
          </p>
        ) : null}
        {f.missingSize ? (
          <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
            Esta mascota no tiene tamaño. Cargáselo en su ficha antes de agregarla.
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="field">
            <label htmlFor="wl-start">Desde (opcional)</label>
            <input type="date" id="wl-start" {...f.register("preferredStartDate")} />
          </div>
          <div className={`field ${f.errors.preferredEndDate ? "has-error" : ""}`}>
            <label htmlFor="wl-end">Hasta (opcional)</label>
            <input type="date" id="wl-end" {...f.register("preferredEndDate")} />
            <span className="error-msg">{f.errors.preferredEndDate?.message}</span>
          </div>
        </div>
        <p className="text-small">
          {f.suggestion ?? "Sin rango, cualquier lugar que se libere le sirve."}
        </p>

        {f.error ? (
          <p className="text-small" role="alert" style={{ color: "var(--color-danger)" }}>
            {f.error}
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={f.submitting}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={f.submitting || Boolean(f.duplicate) || f.missingSize}
          >
            {f.submitting ? <PawPrintsSpinner /> : f.editing ? "Guardar" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
