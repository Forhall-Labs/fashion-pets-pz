"use client";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";
import { Modal, ModalHeader } from "@/modules/shared/components/Modal";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import { DAY_LABEL, DAY_OPTIONS } from "@/modules/shared/lib/labels";
import type { Owner, Weekday } from "@/modules/shared/types";

import { useOwnerForm } from "./hooks/useOwnerForm";

interface OwnerFormProps {
  owner?: Owner | null;
  existingOwners: Owner[];
  onSaved?: (owner: Owner) => void;
  onClose: () => void;
}

// Puerto de openOwnerForm() (docs/prototype/app.js:628-705) — form de
// creación/edición de dueño, con los modales de duplicado/teléfono
// compartido al crear.
export function OwnerForm({ owner = null, existingOwners, onSaved, onClose }: OwnerFormProps) {
  const {
    editing,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    fixedVisitDay,
    setFixedVisitDay,
    nameError,
    phoneError,
    submitting,
    error,
    clearError,
    conflict,
    cancelConflict,
    confirmConflict,
    openExisting,
    handleSubmit,
  } = useOwnerForm({ owner, existingOwners, onSaved, onClose });

  if (conflict?.type === "duplicate") {
    return (
      <Modal onClose={cancelConflict} blocking>
        <ModalHeader title="Posible dueño duplicado" />
        <p className="modal-body-text">
          Ya existe un dueño con el mismo nombre y teléfono:{" "}
          <strong>{conflict.existing.name}</strong> ({conflict.existing.phone}).
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => openExisting(conflict.existing.id)}>
            Abrir existente
          </button>
          <button className="btn btn-destructive" onClick={cancelConflict}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={confirmConflict}>
            Guardar de todos modos
          </button>
        </div>
      </Modal>
    );
  }

  if (conflict?.type === "shared-phone") {
    return (
      <Modal onClose={cancelConflict} blocking>
        <ModalHeader title="Teléfono ya registrado" />
        <p className="modal-body-text">
          El teléfono {phone} ya está asociado a <strong>{conflict.existing.name}</strong>. ¿Es un
          teléfono compartido del hogar o un error?
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={cancelConflict}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={confirmConflict}>
            Es un teléfono compartido — guardar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal onClose={onClose}>
        <ModalHeader title={editing ? "Editar dueño" : "Nuevo dueño"} onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div className={`field ${nameError ? "has-error" : ""}`}>
            <label htmlFor="of-name">Nombre</label>
            <input id="of-name" value={name} onChange={(e) => setName(e.target.value)} />
            <span className="error-msg">El nombre es obligatorio (máximo 300 caracteres).</span>
          </div>
          <div className={`field ${phoneError ? "has-error" : ""}`}>
            <label htmlFor="of-phone">Teléfono</label>
            <input id="of-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <span className="error-msg">Ingresá un teléfono válido (7 a 15 dígitos).</span>
          </div>
          <div className="field">
            <label htmlFor="of-address">Dirección</label>
            <input id="of-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <span className="hint">Se usa como ubicación por defecto de sus mascotas.</span>
          </div>
          <div className="field">
            <label htmlFor="of-day">Día fijo de visita</label>
            <select
              id="of-day"
              value={fixedVisitDay}
              onChange={(e) => setFixedVisitDay(e.target.value as Weekday | "")}
            >
              <option value="">Sin preferencia</option>
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
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
