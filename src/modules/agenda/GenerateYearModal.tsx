"use client";

import { Modal, ModalHeader } from "@/modules/shared/components/Modal";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";
import { WalkingDogLoader } from "@/modules/shared/components/WalkingDogLoader";
import { formatDateLong } from "@/modules/shared/lib/date-utils";
import type {
  SchedulingPetNote,
  SchedulingWaitlistNote,
} from "@/modules/shared/lib/scheduling-api";

import type { useGenerateYear } from "./hooks/useGenerateYear";

type GenerateYear = ReturnType<typeof useGenerateYear>;

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function NoteList({ title, notes }: { title: string; notes: SchedulingPetNote[] }) {
  if (notes.length === 0) return null;
  return (
    <>
      <p className="modal-body-text">
        <strong>{title}</strong>
      </p>
      <ul className="modal-body-text">
        {notes.map((n) => (
          <li key={`${n.petId}-${n.reason}`}>
            {n.petName}: {n.reason}
          </li>
        ))}
      </ul>
    </>
  );
}

function WaitlistList({ notes }: { notes: SchedulingWaitlistNote[] }) {
  if (notes.length === 0) return null;
  return (
    <>
      <p className="modal-body-text">
        <strong>A lista de espera</strong> (algún ciclo no encontró lugar):
      </p>
      <ul className="modal-body-text">
        {notes.map((n) => (
          <li key={n.petId}>
            {n.petName}: desde el {formatDateLong(n.dueDate)}
          </li>
        ))}
      </ul>
    </>
  );
}

// HU-3.1 — vista previa → confirmar → reporte.
export function GenerateYearModal({ g }: { g: GenerateYear }) {
  if (g.report) {
    const r = g.report;
    return (
      <Modal onClose={g.close} wide>
        <ModalHeader title={`Agenda ${r.targetYear} programada`} onClose={g.close} />
        <p className="modal-body-text">
          Se crearon <strong>{plural(r.created, "cita", "citas")}</strong> para{" "}
          {plural(r.pets.length, "mascota", "mascotas")} entre el 01/01/{r.targetYear} y el 31/12/
          {r.targetYear}.
        </p>
        <NoteList
          title="Necesitan revisión manual (las demás mascotas no se afectaron)"
          notes={r.failed}
        />
        <WaitlistList notes={r.waitlist} />
        <NoteList title="Salteadas" notes={r.skipped} />
        {g.refreshFailed ? (
          <p className="modal-body-text text-small">
            La agenda puede no reflejar las citas nuevas todavía; recargá la página.
          </p>
        ) : null}
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={g.close}>
            Listo
          </button>
        </div>
      </Modal>
    );
  }

  const p = g.preview;
  return (
    <Modal onClose={g.close} wide blocking={g.running}>
      <ModalHeader
        title={p ? `Programar agenda ${p.targetYear}` : "Programar agenda"}
        onClose={g.running ? undefined : g.close}
      />
      {g.previewLoading && !p ? (
        <WalkingDogLoader />
      ) : g.previewError ? (
        <>
          <p className="modal-body-text">No se pudo calcular la vista previa. {g.previewError}</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={g.close}>
              Cerrar
            </button>
            <button className="btn btn-primary" onClick={g.retryPreview}>
              Reintentar
            </button>
          </div>
        </>
      ) : p ? (
        <>
          {p.lastScheduledAt ? (
            <p className="modal-body-text text-small">
              La agenda {p.targetYear} ya se programó el{" "}
              {formatDateLong(p.lastScheduledAt.slice(0, 10))}. Volver a programarla solo agrega lo
              que falte (por ejemplo, mascotas nuevas).
            </p>
          ) : null}
          <p className="modal-body-text">
            {p.appointmentsToCreate === 0 ? (
              <>No hay citas nuevas para crear.</>
            ) : (
              <>
                Se van a crear <strong>{plural(p.appointmentsToCreate, "cita", "citas")}</strong>{" "}
                para {plural(p.pets.length, "mascota", "mascotas")} entre el 01/01/{p.targetYear} y
                el 31/12/{p.targetYear}, a la hora de apertura.
              </>
            )}
          </p>
          <WaitlistList notes={p.waitlist} />
          <NoteList title="Se van a saltear" notes={p.skipped} />
          {g.runError ? <p className="error-msg">{g.runError}</p> : null}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={g.close} disabled={g.running}>
              Cancelar
            </button>
            <button
              className={`btn btn-primary ${g.running ? "btn-loading" : ""}`}
              onClick={g.confirm}
              disabled={g.running || (p.appointmentsToCreate === 0 && p.waitlist.length === 0)}
            >
              {g.running ? <PawPrintsSpinner /> : "Confirmar"}
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
