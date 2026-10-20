"use client";

import { useQuery } from "@tanstack/react-query";

import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import { WalkingDogLoader } from "@/modules/shared/components/WalkingDogLoader";
import { WarningIcon } from "@/modules/shared/components/WarningIcon";
import { shopConfigApi } from "@/modules/shared/lib/shop-config-api";
import type { ShopConfig } from "@/modules/shared/types";

import { BlackoutsSection } from "./BlackoutsSection";
import { useCapacityForm } from "./hooks/useCapacityForm";
import { useHoursForm } from "./hooks/useHoursForm";
import { ShopConfigSaveModals } from "./ShopConfigSaveModals";

// "Configuración de Tienda" (Épica 4) contra la API real — capacidad
// (HU-4.2), horario (HU-4.3) y períodos de bloqueo (HU-4.1).
export function ConfigView() {
  const configQuery = useQuery({ queryKey: ["shop-config"], queryFn: shopConfigApi.get });

  return (
    <section className="screen" data-screen="config">
      <div className="screen-header">
        <h1 className="text-h1">Configuración de tienda</h1>
      </div>

      {configQuery.isPending ? (
        <WalkingDogLoader />
      ) : configQuery.isError ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <WarningIcon size={32} />
          </span>
          No se pudo cargar la configuración.
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => void configQuery.refetch()}>
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <>
          <CapacitySection config={configQuery.data} />
          <HoursSection config={configQuery.data} />
        </>
      )}

      <BlackoutsSection />
    </section>
  );
}

function SaveButton({ busy, saved }: { busy: boolean; saved: boolean }) {
  return (
    <div className="field" style={{ justifyContent: "flex-end" }}>
      <button
        type="submit"
        className={`btn btn-primary ${busy ? "btn-loading" : ""}`}
        disabled={busy}
      >
        {busy ? <PawPrintsSpinner /> : "Guardar"}
      </button>
      {saved && !busy && <span className="hint">Cambios guardados.</span>}
    </div>
  );
}

function CapacitySection({ config }: { config: ShopConfig }) {
  const { register, errors, handleSubmit, save } = useCapacityForm(config);

  return (
    <div className="config-section card">
      <h2 className="text-h2">Capacidad y servicio rápido</h2>
      <span className="text-small">Máximo de mascotas por día y duración del servicio rápido.</span>
      <form className="field-row" onSubmit={handleSubmit} noValidate>
        <div className={`field ${errors.maxPetsPerDay ? "has-error" : ""}`}>
          <label htmlFor="cf-max">Máximo de mascotas por día</label>
          <input id="cf-max" inputMode="numeric" {...register("maxPetsPerDay")} />
          <span className="error-msg">{errors.maxPetsPerDay?.message}</span>
        </div>
        <div className={`field ${errors.quickServiceDurationMinutes ? "has-error" : ""}`}>
          <label htmlFor="cf-quick">Duración de servicio rápido (min)</label>
          <input id="cf-quick" inputMode="numeric" {...register("quickServiceDurationMinutes")} />
          <span className="error-msg">{errors.quickServiceDurationMinutes?.message}</span>
        </div>
        <SaveButton busy={save.busy} saved={save.saved} />
      </form>
      <ShopConfigSaveModals save={save} />
    </div>
  );
}

function HoursSection({ config }: { config: ShopConfig }) {
  const { register, errors, handleSubmit, save } = useHoursForm(config);
  const hoursError = errors.openTime?.message ?? errors.closeTime?.message;

  return (
    <div className="config-section card">
      <h2 className="text-h2">Horario de atención</h2>
      <span className="text-small">Las citas solo pueden agendarse dentro de este horario.</span>
      <form className="field-row" onSubmit={handleSubmit} noValidate>
        <div className={`field ${errors.openTime ? "has-error" : ""}`}>
          <label htmlFor="cf-open">Apertura</label>
          <input type="time" id="cf-open" {...register("openTime")} />
        </div>
        <div className={`field ${hoursError ? "has-error" : ""}`}>
          <label htmlFor="cf-close">Cierre</label>
          <input type="time" id="cf-close" {...register("closeTime")} />
          <span className="error-msg">{hoursError}</span>
        </div>
        <SaveButton busy={save.busy} saved={save.saved} />
      </form>
      <ShopConfigSaveModals save={save} />
    </div>
  );
}
