"use client";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";
import { Modal, ModalHeader } from "@/modules/shared/components/Modal";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import { formatDateLong } from "@/modules/shared/lib/date-utils";

import type { ShopConfigSave } from "./hooks/useShopConfigSave";

// Modales del flujo de guardado de capacidad/horario (useShopConfigSave):
// aviso de impacto, fallo del escaneo, error de guardado y fallo del refresco
// de la agenda. Compartido por CapacitySection y HoursSection.
export function ShopConfigSaveModals({ save }: { save: ShopConfigSave }) {
  if (save.pending) {
    const { outOfHours, overCapacityDays } = save.pending.impact;
    return (
      <Modal onClose={save.cancelPending} blocking>
        <ModalHeader title="Hay citas afectadas por este cambio" />
        {outOfHours.length > 0 && (
          <>
            <p className="modal-body-text">
              {outOfHours.length === 1
                ? "Esta cita quedaría fuera del nuevo horario de atención:"
                : `Estas ${outOfHours.length} citas quedarían fuera del nuevo horario de atención:`}
            </p>
            <ul className="modal-body-text">
              {outOfHours.map((a) => (
                <li key={a.id}>
                  {a.petName ?? "Mascota"} — {formatDateLong(a.date)}, {a.startTime}
                </li>
              ))}
            </ul>
          </>
        )}
        {overCapacityDays.length > 0 && (
          <>
            <p className="modal-body-text">
              {overCapacityDays.length === 1
                ? "Este día quedaría por encima de la nueva capacidad:"
                : `Estos ${overCapacityDays.length} días quedarían por encima de la nueva capacidad:`}
            </p>
            <ul className="modal-body-text">
              {overCapacityDays.map((d) => (
                <li key={d.date}>
                  {formatDateLong(d.date)} — {d.count} citas
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="modal-body-text">
          Ninguna cita se cancela ni se mueve: quedan como están y las podés reprogramar a mano.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={save.cancelPending} disabled={save.saving}>
            Cancelar
          </button>
          <button
            className={`btn btn-primary ${save.saving ? "btn-loading" : ""}`}
            onClick={save.confirmPending}
            disabled={save.saving}
          >
            {save.saving ? <PawPrintsSpinner /> : "Guardar igual"}
          </button>
        </div>
      </Modal>
    );
  }

  if (save.scanFailed) {
    return (
      <Modal onClose={save.dismissScanFailed} blocking>
        <ModalHeader title="No se pudo revisar el impacto" />
        <p className="modal-body-text">
          No pudimos revisar si el cambio afecta citas ya agendadas. Podés reintentar la revisión, o
          guardar sin revisar.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={save.dismissScanFailed} disabled={save.busy}>
            Cancelar
          </button>
          <button className="btn btn-secondary" onClick={save.saveWithoutScan} disabled={save.busy}>
            Guardar sin revisar
          </button>
          <button
            className={`btn btn-primary ${save.busy ? "btn-loading" : ""}`}
            onClick={save.retryScan}
            disabled={save.busy}
          >
            {save.busy ? <PawPrintsSpinner /> : "Reintentar revisión"}
          </button>
        </div>
      </Modal>
    );
  }

  if (save.error) {
    return <ErrorModal title="No se pudo guardar" message={save.error} onClose={save.clearError} />;
  }

  if (save.refreshFailed) {
    return <CalendarRefreshWarning onClose={save.clearRefreshFailed} />;
  }

  return null;
}

// HU-4.1/4.2/4.3 @error: el cambio se guardó pero la agenda no se pudo refrescar.
export function CalendarRefreshWarning({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Cambio guardado" onClose={onClose} />
      <p className="modal-body-text">
        El cambio se guardó, pero el calendario puede no reflejarlo todavía. Recargá la Agenda en un
        momento.
      </p>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Entendido
        </button>
      </div>
    </Modal>
  );
}
