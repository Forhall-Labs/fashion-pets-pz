import { describe, expect, it } from "vitest";

import { durationFor, serviceNameOf } from "./service-catalog";
import { serviceFormSchema } from "./service-schema";
import type { Service } from "../types";

const BATH: Service = {
  id: "svc-bath",
  name: "Baño",
  durationSmallMinutes: 30,
  durationMediumMinutes: 45,
  durationExtraLargeMinutes: 60,
  active: true,
};
const byId = new Map([[BATH.id, BATH]]);

describe("durationFor", () => {
  it("picks the suggested duration for the pet's size", () => {
    expect(durationFor(BATH, "small")).toBe(30);
    expect(durationFor(BATH, "medium")).toBe(45);
    expect(durationFor(BATH, "extra_large")).toBe(60);
  });
});

describe("serviceNameOf", () => {
  it("names a full groom and a catalog service", () => {
    expect(serviceNameOf({ serviceType: "full_groom", serviceId: null }, byId)).toBe(
      "Grooming completo",
    );
    expect(serviceNameOf({ serviceType: "quick_service", serviceId: "svc-bath" }, byId)).toBe(
      "Baño",
    );
  });

  it("falls back to a generic name while the catalog loads", () => {
    expect(serviceNameOf({ serviceType: "quick_service", serviceId: "x" }, new Map())).toBe(
      "Servicio",
    );
  });
});

describe("serviceFormSchema", () => {
  const valid = {
    name: "Baño",
    durationSmallMinutes: "30",
    durationMediumMinutes: "45",
    durationExtraLargeMinutes: "60",
  };

  it("accepts a name and three whole durations", () => {
    expect(serviceFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ name: " " }, "El nombre es obligatorio."],
    [{ durationSmallMinutes: "0" }, "Debe ser un número entero mayor a 0."],
    [{ durationMediumMinutes: "12.5" }, "Debe ser un número entero mayor a 0."],
    [{ durationExtraLargeMinutes: "" }, "Ingresá los minutos."],
  ])("rejects %j", (patch, message) => {
    const result = serviceFormSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});
