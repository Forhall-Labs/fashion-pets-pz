"use client";

import { useState } from "react";

import { formatDateShort } from "@/modules/shared/date-utils";
import { mockData } from "@/modules/shared/mock-data";
import type { BlackoutPeriod } from "@/modules/shared/types";

let blackoutIdCounter = 100;

// Puerto de "Configuración de Tienda" (renderConfig() en app.js). Guarda en
// estado local del componente, no en `mockData` — se resetea al salir de la
// pantalla hasta que haya API real. El modal de conflicto con citas
// existentes (HU-4.1) queda para la próxima etapa.
export function ConfigView() {
  const [maxPetsPerDay, setMaxPetsPerDay] = useState(mockData.shopConfig.maxPetsPerDay);
  const [quickServiceMinutes, setQuickServiceMinutes] = useState(
    mockData.shopConfig.quickServiceDurationMinutes,
  );
  const [openTime, setOpenTime] = useState(mockData.shopConfig.openTime);
  const [closeTime, setCloseTime] = useState(mockData.shopConfig.closeTime);
  const [maxError, setMaxError] = useState(false);
  const [hoursError, setHoursError] = useState(false);

  const [blackouts, setBlackouts] = useState<BlackoutPeriod[]>(mockData.blackoutPeriods);
  const [bfStart, setBfStart] = useState("");
  const [bfEnd, setBfEnd] = useState("");
  const [bfLabel, setBfLabel] = useState("");
  const [bfError, setBfError] = useState<"start" | "end" | null>(null);

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
        <form
          className="field-row"
          onSubmit={(e) => {
            e.preventDefault();
            const invalid = !Number.isInteger(maxPetsPerDay) || maxPetsPerDay <= 0;
            setMaxError(invalid);
          }}
        >
          <div className={`field ${maxError ? "has-error" : ""}`}>
            <label htmlFor="cf-max">Máximo de mascotas por día</label>
            <input
              type="number"
              id="cf-max"
              min={1}
              value={maxPetsPerDay}
              onChange={(e) => setMaxPetsPerDay(Number(e.target.value))}
            />
            <span className="error-msg">Ingresá un número entero positivo.</span>
          </div>
          <div className="field">
            <label htmlFor="cf-quick">Duración de servicio rápido (min)</label>
            <input
              type="number"
              id="cf-quick"
              min={1}
              value={quickServiceMinutes ?? ""}
              onChange={(e) => setQuickServiceMinutes(Number(e.target.value) || null)}
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
        <form
          className="field-row"
          onSubmit={(e) => {
            e.preventDefault();
            const invalid = !openTime || !closeTime || closeTime <= openTime;
            setHoursError(invalid);
          }}
        >
          <div className="field">
            <label htmlFor="cf-open">Apertura</label>
            <input
              type="time"
              id="cf-open"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
            />
          </div>
          <div className={`field ${hoursError ? "has-error" : ""}`}>
            <label htmlFor="cf-close">Cierre</label>
            <input
              type="time"
              id="cf-close"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
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
          {blackouts.length === 0 ? (
            <span className="text-small">Sin períodos configurados.</span>
          ) : (
            blackouts.map((b) => (
              <div className="blackout-item" key={b.id}>
                <span>
                  {b.label || "Sin nombre"} — {formatDateShort(b.startDate)} a{" "}
                  {formatDateShort(b.endDate)}
                </span>
                <button
                  className="btn btn-text btn-sm"
                  onClick={() => setBlackouts((bs) => bs.filter((x) => x.id !== b.id))}
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
        <form
          className="field-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!bfStart) {
              setBfError("start");
              return;
            }
            if (!bfEnd || bfEnd < bfStart) {
              setBfError("end");
              return;
            }
            setBfError(null);
            setBlackouts((bs) => [
              ...bs,
              {
                id: `b-local-${++blackoutIdCounter}`,
                startDate: bfStart,
                endDate: bfEnd,
                label: bfLabel || null,
              },
            ]);
            setBfStart("");
            setBfEnd("");
            setBfLabel("");
          }}
        >
          <div className={`field ${bfError === "start" ? "has-error" : ""}`}>
            <label htmlFor="bf-start">Desde</label>
            <input
              type="date"
              id="bf-start"
              value={bfStart}
              onChange={(e) => setBfStart(e.target.value)}
            />
            <span className="error-msg">Elegí una fecha de inicio.</span>
          </div>
          <div className={`field ${bfError === "end" ? "has-error" : ""}`}>
            <label htmlFor="bf-end">Hasta</label>
            <input
              type="date"
              id="bf-end"
              value={bfEnd}
              onChange={(e) => setBfEnd(e.target.value)}
            />
            <span className="error-msg">La fecha final debe ser igual o posterior al inicio.</span>
          </div>
          <div className="field">
            <label htmlFor="bf-label">Etiqueta</label>
            <input
              id="bf-label"
              placeholder="Ej: Vacaciones de verano"
              value={bfLabel}
              onChange={(e) => setBfLabel(e.target.value)}
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
