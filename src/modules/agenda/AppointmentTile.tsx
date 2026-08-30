import type { Appointment, Pet } from "@/modules/shared/types";

import { useAppointmentTile } from "./hooks/useAppointmentTile";

interface AppointmentTileProps {
  appt: Appointment;
  pet: Pet;
  onOpen: (id: string) => void;
}

// Puerto de apptTileClasses()/apptTileHTML() de docs/prototype/app.js.
export function AppointmentTile({ appt, pet, onOpen }: AppointmentTileProps) {
  const { className, title, cancelledSuffix, handleClick } = useAppointmentTile(appt, pet, onOpen);

  return (
    <div className={className} title={title} onClick={handleClick}>
      <span className="appt-time">{appt.startTime}</span>
      {pet.name}
      {cancelledSuffix}
    </div>
  );
}
