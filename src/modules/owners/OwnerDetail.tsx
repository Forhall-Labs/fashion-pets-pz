"use client";

import { useState } from "react";
import Link from "next/link";

import {
  AggressiveBadge,
  FrequencyBadge,
  IncompleteBadge,
  LocationMissingBadge,
  PickupBadge,
  SizeBadge,
} from "@/modules/shared/components/Badge";
import { formatDateShort } from "@/modules/shared/lib/date-utils";
import { DAY_LABEL } from "@/modules/shared/lib/labels";
import { isIncomplete } from "@/modules/shared/lib/selectors";
import { AppointmentDetailModal } from "@/modules/shared/components/AppointmentDetailModal";
import { WalkingDogLoader } from "@/modules/shared/components/WalkingDogLoader";
import { mockData } from "@/modules/shared/lib/mock-data";
import type { Pet } from "@/modules/shared/types";

import { OwnerForm } from "./OwnerForm";
import { PetForm } from "./PetForm";
import { useOwnerDetail } from "./hooks/useOwnerDetail";

// Puerto de "Ficha del Dueño" (renderOwnerDetail() en app.js).
export function OwnerDetail({ ownerId }: { ownerId: string }) {
  const {
    owner,
    pets,
    upcoming,
    waLink,
    loading,
    notFound,
    error,
    openAppointmentId,
    openAppointment,
    closeAppointment,
  } = useOwnerDetail(ownerId);
  const [editingOwner, setEditingOwner] = useState(false);
  const [petModal, setPetModal] = useState<"new" | Pet | null>(null);

  if (loading) {
    return (
      <section className="screen" data-screen="owner-detail">
        <WalkingDogLoader />
      </section>
    );
  }

  if (notFound || (!owner && !error)) {
    return (
      <section className="screen" data-screen="owner-detail">
        <div className="screen-header">
          <Link href="/owners" className="btn btn-ghost btn-sm">
            ← Dueños
          </Link>
        </div>
        <div className="empty-state">Dueño no encontrado.</div>
      </section>
    );
  }

  if (error || !owner) {
    return (
      <section className="screen" data-screen="owner-detail">
        <div className="screen-header">
          <Link href="/owners" className="btn btn-ghost btn-sm">
            ← Dueños
          </Link>
        </div>
        <div className="empty-state">
          <span className="empty-state-icon">⚠️</span>
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="screen" data-screen="owner-detail">
      <div className="screen-header">
        <Link href="/owners" className="btn btn-ghost btn-sm">
          ← Dueños
        </Link>
      </div>

      <div className="owner-detail-grid">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="text-h2">{owner.name}</h2>
            <button className="btn btn-text btn-sm" onClick={() => setEditingOwner(true)}>
              Editar
            </button>
          </div>
          <p className="text-small">{owner.phone}</p>
          <p className="text-small">{owner.address || "Sin dirección registrada"}</p>
          <p className="text-small">
            Día fijo de visita:{" "}
            {owner.fixedVisitDay ? DAY_LABEL[owner.fixedVisitDay] : "Sin preferencia"}
          </p>
          <a
            className={`btn btn-secondary btn-sm ${waLink ? "" : "btn-disabled"}`}
            style={{ marginTop: 8 }}
            href={waLink ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!waLink}
            onClick={(e) => {
              if (!waLink) e.preventDefault();
            }}
          >
            Enviar por WhatsApp (todas las próximas)
          </a>
          <p className="text-small" style={{ marginTop: 4 }}>
            Se abrirá WhatsApp con el mensaje listo — vos lo enviás.
          </p>
          {upcoming.length ? (
            <>
              <h3 className="text-h3" style={{ marginTop: 16 }}>
                Próximas citas
              </h3>
              {upcoming.map((a) => (
                <div
                  className="data-row"
                  style={{ padding: "8px 10px", cursor: "pointer" }}
                  key={a.id}
                  onClick={() => openAppointment(a.id)}
                >
                  <span className="text-small">
                    {a.pet.name} · {formatDateShort(a.date)} {a.startTime}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-small" style={{ marginTop: 16 }}>
              Sin próximas citas.
            </p>
          )}
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 className="text-h2">Mascotas</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setPetModal("new")}>
              + Agregar mascota
            </button>
          </div>
          <div className="data-table">
            {pets.length === 0 ? (
              <div className="empty-state">Sin mascotas todavía.</div>
            ) : (
              pets.map((p) => {
                const resolvedLocation = p.locationAddress || owner.address;
                const locationMissing = p.needsPickup && !resolvedLocation;
                return (
                  <div className="card pet-card" key={p.id}>
                    <div className="pet-card-main">
                      <strong>{p.name}</strong>
                      <span className="text-small">{p.breed}</span>
                      <span className="text-small">
                        Ubicación: {resolvedLocation || "Sin ubicación"}
                      </span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        <SizeBadge size={p.size} />
                        {p.isAggressive ? <AggressiveBadge /> : null}
                        {p.needsPickup ? <PickupBadge /> : null}
                        {isIncomplete(p) ? <IncompleteBadge /> : null}
                        {locationMissing ? <LocationMissingBadge /> : null}
                        {p.groomingFrequency ? (
                          <FrequencyBadge frequency={p.groomingFrequency} />
                        ) : null}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPetModal(p)}>
                      Editar
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {openAppointmentId ? (
        <AppointmentDetailModal
          data={mockData}
          appointmentId={openAppointmentId}
          onClose={closeAppointment}
        />
      ) : null}

      {editingOwner && (
        <OwnerForm owner={owner} existingOwners={[]} onClose={() => setEditingOwner(false)} />
      )}
      {petModal && (
        <PetForm
          pet={petModal === "new" ? null : petModal}
          owner={owner}
          existingPets={pets}
          onClose={() => setPetModal(null)}
        />
      )}
    </section>
  );
}
