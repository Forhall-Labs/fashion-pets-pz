import type { Appointment, Pet } from "@/modules/shared/types";

interface AppointmentTileProps {
  appt: Appointment;
  pet: Pet;
  onOpen: (id: string) => void;
}

// Puerto de apptTileClasses()/apptTileHTML() de docs/prototype/app.js.
export function AppointmentTile({ appt, pet, onOpen }: AppointmentTileProps) {
  const classes = ["appt-tile"];
  if (appt.serviceType === "quick_service") classes.push("is-quick");
  if (appt.source === "auto_scheduled") classes.push("is-auto");
  if (appt.flaggedReason) classes.push("is-exception");

  return (
    <div
      className={classes.join(" ")}
      title={`${pet.name} — ${appt.startTime}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(appt.id);
      }}
    >
      <span className="appt-time">{appt.startTime}</span>
      {pet.name}
      {appt.status === "cancelled" ? " (cancelada)" : ""}
    </div>
  );
}
