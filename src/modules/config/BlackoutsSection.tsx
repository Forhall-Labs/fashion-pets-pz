"use client";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";
import { Modal, ModalHeader } from "@/modules/shared/components/Modal";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import { formatDateLong, formatDateShort } from "@/modules/shared/lib/date-utils";
import type { BlackoutPeriod } from "@/modules/shared/types";

import { useBlackouts } from "./hooks/useBlackouts";
import { CalendarRefreshWarning } from "./ShopConfigSaveModals";

function rangeLabel(p: Pick<BlackoutPeriod, "startDate" | "endDate">): string {
  return p.startDate === p.endDate
    ? formatDateShort(p.startDate)
    : `${formatDateShort(p.startDate)} a ${formatDateShort(p.endDate)}`;
}

// HU-4.1 — períodos de bloqueo (vacaciones).
export function BlackoutsSection() {
  const b = useBlackouts();

  return (
    <div className="config-section card">
      <h2 className="text-h2">Períodos de bloqueo (vacaciones)</h2>
      <span className="text-small">Ninguna cita se agenda dentro de estas fechas.</span>
      <div className="blackout-list">
        {b.loading ? (
          <span className="text-small">Cargando…</span>
        ) : b.loadError ? (
          <span className="text-small">
            No se pudieron cargar los períodos.{" "}
            <button className="btn btn-text btn-sm" onClick={b.reload}>
              Reintentar
            </button>
          </span>
        ) : b.periods.length === 0 ? (
          <span className="text-small">Sin períodos configurados.</span>
        ) : (
          b.periods.map((p) => (
            <div className="blackout-item" key={p.id}>
              <span>
                {p.label || "Sin nombre"} — {rangeLabel(p)}
                {b.editingId === p.id && <strong> (editando)</strong>}
              </span>
              <span>
                <button className="btn btn-text btn-sm" onClick={() => b.startEdit(p)}>
                  Editar
                </button>
                <button className="btn btn-text btn-sm" onClick={() => b.requestDelete(p)}>
                  Eliminar
                </button>
              </span>
            </div>
          ))
        )}
      </div>
      <form className="field-row" onSubmit={b.handleSubmit} noValidate>
        <div className={`field ${b.errors.startDate ? "has-error" : ""}`}>
          <label htmlFor="bf-start">Desde</label>
          <input type="date" id="bf-start" {...b.register("startDate")} />
          <span className="error-msg">{b.errors.startDate?.message}</span>
        </div>
        <div className={`field ${b.errors.endDate ? "has-error" : ""}`}>
          <label htmlFor="bf-end">Hasta</label>
          <input type="date" id="bf-end" {...b.register("endDate")} />
          <span className="error-msg">{b.errors.endDate?.message}</span>
        </div>
        <div className={`field ${b.errors.label ? "has-error" : ""}`}>
          <label htmlFor="bf-label">Etiqueta</label>
          <input id="bf-label" placeholder="Ej: Vacaciones de verano" {...b.register("label")} />
          <span className="error-msg">{b.errors.label?.message}</span>
        </div>
        <div className="field" style={{ justifyContent: "flex-end", flexDirection: "row", gap: 8 }}>
          {b.editingId && (
            <button type="button" className="btn btn-ghost" onClick={b.cancelEdit}>
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={`btn btn-primary ${b.busy ? "btn-loading" : ""}`}
            disabled={b.busy}
          >
            {b.busy ? <PawPrintsSpinner /> : b.editingId ? "Guardar" : "Agregar"}
          </button>
        </div>
      </form>

      <BlackoutStepModal b={b} />
      {b.error && (
        <ErrorModal title="No se pudo guardar" message={b.error} onClose={b.clearError} />
      )}
      {b.refreshFailed && !b.step && <CalendarRefreshWarning onClose={b.clearRefreshFailed} />}
    </div>
  );
}

function BlackoutStepModal({ b }: { b: ReturnType<typeof useBlackouts> }) {
  const { step } = b;
  if (!step) return null;

  if (step.type === "past") {
    return (
      <Modal onClose={b.closeStep} blocking>
        <ModalHeader title="Ese rango ya pasó" />
        <p className="modal-body-text">
          Las fechas elegidas ({rangeLabel(step.values)}) están completamente en el pasado, así que
          el bloqueo no va a tener efecto sobre citas nuevas. ¿Guardarlo igual?
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={b.closeStep} disabled={b.busy}>
            Revisar fechas
          </button>
          <button
            className={`btn btn-primary ${b.busy ? "btn-loading" : ""}`}
            onClick={b.confirmPast}
            disabled={b.busy}
          >
            {b.busy ? <PawPrintsSpinner /> : "Guardar igual"}
          </button>
        </div>
      </Modal>
    );
  }

  if (step.type === "overlap") {
    return (
      <Modal onClose={b.closeStep} blocking>
        <ModalHeader title="Se superpone con otro bloqueo" />
        <p className="modal-body-text">{rangeLabel(step.values)} se superpone con:</p>
        <ul className="modal-body-text">
          {step.periods.map((p) => (
            <li key={p.id}>
              {p.label || "Sin nombre"} — {rangeLabel(p)}
            </li>
          ))}
        </ul>
        <p className="modal-body-text">
          Podés unirlos en un solo período que cubra todas las fechas, o volver y ajustar las
          fechas.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={b.closeStep} disabled={b.busy}>
            Ajustar fechas
          </button>
          <button
            className={`btn btn-primary ${b.busy ? "btn-loading" : ""}`}
            onClick={b.mergeOverlap}
            disabled={b.busy}
          >
            {b.busy ? <PawPrintsSpinner /> : "Unir en uno"}
          </button>
        </div>
      </Modal>
    );
  }

  if (step.type === "appointments") {
    const n = step.appointments.length;
    return (
      <Modal onClose={b.closeStep} blocking>
        <ModalHeader title={n === 1 ? "1 cita en conflicto" : `${n} citas en conflicto`} />
        <p className="modal-body-text">
          {n === 1 ? "Esta cita agendada cae" : `Estas ${n} citas agendadas caen`} dentro del
          bloqueo ({rangeLabel(step.draft)}):
        </p>
        <ul className="modal-body-text">
          {step.appointments.map((a) => (
            <li key={a.id}>
              {a.petName ?? "Mascota"} — {formatDateLong(a.date)}, {a.startTime.slice(0, 5)}
            </li>
          ))}
        </ul>
        <p className="modal-body-text">¿Qué hacemos con ellas?</p>
        <div className="modal-actions" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={b.closeStep} disabled={b.saving}>
            Volver
          </button>
          <button
            className={`btn btn-secondary ${b.savingResolution === "reschedule" ? "btn-loading" : ""}`}
            onClick={() => b.resolveAppointments("reschedule")}
            disabled={b.saving}
            title="Mueve cada cita al día libre más cercano después del bloqueo"
          >
            {b.savingResolution === "reschedule" ? (
              <PawPrintsSpinner />
            ) : (
              "Reprogramar automáticamente"
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => b.resolveAppointments("keep")}
            disabled={b.saving}
          >
            {b.savingResolution === "keep" ? <PawPrintsSpinner /> : "Dejarlas como excepción"}
          </button>
          <button
            className={`btn btn-destructive ${b.savingResolution === "cancel" ? "btn-loading" : ""}`}
            onClick={() => b.resolveAppointments("cancel")}
            disabled={b.saving}
          >
            {b.savingResolution === "cancel" ? <PawPrintsSpinner /> : "Cancelarlas"}
          </button>
        </div>
      </Modal>
    );
  }

  if (step.type === "delete") {
    return (
      <Modal onClose={b.closeStep} blocking>
        <ModalHeader title="Eliminar período de bloqueo" />
        <p className="modal-body-text">
          ¿Eliminar <strong>{step.period.label || "Sin nombre"}</strong> ({rangeLabel(step.period)}
          )? Esas fechas vuelven a quedar disponibles para agendar.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={b.closeStep} disabled={b.deleting}>
            Cancelar
          </button>
          <button
            className={`btn btn-destructive ${b.deleting ? "btn-loading" : ""}`}
            onClick={b.confirmDelete}
            disabled={b.deleting}
          >
            {b.deleting ? <PawPrintsSpinner /> : "Eliminar"}
          </button>
        </div>
      </Modal>
    );
  }

  // partial-failure — HU-4.1 @error: el bloqueo quedó guardado pero alguna
  // cita no se pudo resolver; el backend ya la marcó para revisión manual.
  return (
    <Modal onClose={b.closeStep}>
      <ModalHeader title="Bloqueo guardado, con pendientes" onClose={b.closeStep} />
      <p className="modal-body-text">
        El bloqueo se guardó, pero{" "}
        {step.failed === 1
          ? "1 cita no se pudo resolver"
          : `${step.failed} citas no se pudieron resolver`}{" "}
        y quedaron marcadas como <strong>&quot;Necesita reprogramación manual&quot;</strong>. Las
        vas a ver con esa nota en la Agenda.
      </p>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={b.closeStep}>
          Entendido
        </button>
      </div>
    </Modal>
  );
}
