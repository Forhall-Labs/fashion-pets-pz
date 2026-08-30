"use client";

import { formatDateShort } from "@/modules/shared/lib/date-utils";

import { useConfigView } from "./hooks/useConfigView";

// Puerto de "Configuración de Tienda" (renderConfig() en app.js).
export function ConfigView() {
  const { capacity, hours, blackouts } = useConfigView();

  return (
    <section className="screen" data-screen="config">
      <div className="screen-header">
        <h1 className="text-h1">Configuración de tienda</h1>
      </div>

      <div className="config-section card">
        <h2 className="text-h2">Capacidad y servicio rápido</h2>
        <span className="text-small">
          Máximo de mascotas por día y duración del servicio rápido.
        </span>
        <form className="field-row" onSubmit={capacity.submit}>
          <div className={`field ${capacity.error ? "has-error" : ""}`}>
            <label htmlFor="cf-max">Máximo de mascotas por día</label>
            <input
              type="number"
              id="cf-max"
              min={1}
              value={capacity.maxPetsPerDay}
              onChange={(e) => capacity.setMaxPetsPerDay(Number(e.target.value))}
            />
            <span className="error-msg">Ingresá un número entero positivo.</span>
          </div>
          <div className="field">
            <label htmlFor="cf-quick">Duración de servicio rápido (min)</label>
            <input
              type="number"
              id="cf-quick"
              min={1}
              value={capacity.quickServiceMinutes ?? ""}
              onChange={(e) => capacity.setQuickServiceMinutes(Number(e.target.value) || null)}
            />
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>

      <div className="config-section card">
        <h2 className="text-h2">Horario de atención</h2>
        <span className="text-small">Las citas solo pueden agendarse dentro de este horario.</span>
        <form className="field-row" onSubmit={hours.submit}>
          <div className="field">
            <label htmlFor="cf-open">Apertura</label>
            <input
              type="time"
              id="cf-open"
              value={hours.openTime}
              onChange={(e) => hours.setOpenTime(e.target.value)}
            />
          </div>
          <div className={`field ${hours.error ? "has-error" : ""}`}>
            <label htmlFor="cf-close">Cierre</label>
            <input
              type="time"
              id="cf-close"
              value={hours.closeTime}
              onChange={(e) => hours.setCloseTime(e.target.value)}
            />
            <span className="error-msg">El cierre debe ser posterior a la apertura.</span>
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>

      <div className="config-section card">
        <h2 className="text-h2">Períodos de bloqueo (vacaciones)</h2>
        <span className="text-small">Ningún turno se agenda dentro de estas fechas.</span>
        <div className="blackout-list">
          {blackouts.items.length === 0 ? (
            <span className="text-small">Sin períodos configurados.</span>
          ) : (
            blackouts.items.map((b) => (
              <div className="blackout-item" key={b.id}>
                <span>
                  {b.label || "Sin nombre"} — {formatDateShort(b.startDate)} a{" "}
                  {formatDateShort(b.endDate)}
                </span>
                <button className="btn btn-text btn-sm" onClick={() => blackouts.remove(b.id)}>
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
        <form className="field-row" onSubmit={blackouts.form.submit}>
          <div className={`field ${blackouts.form.error === "start" ? "has-error" : ""}`}>
            <label htmlFor="bf-start">Desde</label>
            <input
              type="date"
              id="bf-start"
              value={blackouts.form.start}
              onChange={(e) => blackouts.form.setStart(e.target.value)}
            />
            <span className="error-msg">Elegí una fecha de inicio.</span>
          </div>
          <div className={`field ${blackouts.form.error === "end" ? "has-error" : ""}`}>
            <label htmlFor="bf-end">Hasta</label>
            <input
              type="date"
              id="bf-end"
              value={blackouts.form.end}
              onChange={(e) => blackouts.form.setEnd(e.target.value)}
            />
            <span className="error-msg">La fecha final debe ser igual o posterior al inicio.</span>
          </div>
          <div className="field">
            <label htmlFor="bf-label">Etiqueta</label>
            <input
              id="bf-label"
              placeholder="Ej: Vacaciones de verano"
              value={blackouts.form.label}
              onChange={(e) => blackouts.form.setLabel(e.target.value)}
            />
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary">
              Agregar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
