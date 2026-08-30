import { renderHook } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockData } from "@/modules/shared/lib/mock-data";

import { useAppointmentDetailModal } from "./useAppointmentDetailModal";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const push = vi.fn();
const onClose = vi.fn();

beforeEach(() => {
  push.mockClear();
  onClose.mockClear();
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

describe("useAppointmentDetailModal", () => {
  it("resolves the appointment, pet, owner and a WhatsApp link for a known appointment", () => {
    const { result } = renderHook(() => useAppointmentDetailModal(mockData, "a1", onClose));

    expect(result.current.appt?.id).toBe("a1");
    expect(result.current.pet?.name).toBe("Rex");
    expect(result.current.owner?.name).toBe("María Fernández");
    expect(result.current.waLink).toContain("wa.me");
  });

  it("returns nothing for an appointment that no longer exists", () => {
    const { result } = renderHook(() =>
      useAppointmentDetailModal(mockData, "does-not-exist", onClose),
    );

    expect(result.current.appt).toBeUndefined();
    expect(result.current.pet).toBeNull();
    expect(result.current.owner).toBeNull();
    expect(result.current.waLink).toBeNull();
  });

  it("closes the modal and navigates to the owner's page", () => {
    const { result } = renderHook(() => useAppointmentDetailModal(mockData, "a1", onClose));

    result.current.goToOwner();

    expect(onClose).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/owners/o1");
  });

  it("does nothing when there is no owner to navigate to", () => {
    const { result } = renderHook(() =>
      useAppointmentDetailModal(mockData, "does-not-exist", onClose),
    );

    result.current.goToOwner();

    expect(onClose).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
