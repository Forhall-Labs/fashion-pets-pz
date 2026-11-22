import { describe, expect, it } from "vitest";

import {
  MAX_URL_LENGTH,
  whatsAppForAllUpcoming,
  whatsAppForAppointment,
  type UpcomingForWhatsApp,
  type WhatsAppResult,
} from "./whatsapp";

const OWNER = { name: "María", phone: "+506 8888-0101" };
const REX: UpcomingForWhatsApp = {
  pet: { name: "Rex" },
  date: "2026-09-10",
};
const MILO: UpcomingForWhatsApp = {
  pet: { name: "Milo" },
  date: "2026-09-11",
};

function texts(result: WhatsAppResult): string[] {
  if (!result.ok) throw new Error(`esperaba ok, vino: ${result.error}`);
  return result.messages.map((m) => m.text);
}

describe("whatsAppForAppointment (HU-7.1)", () => {
  it("pre-fills the chat for one full-groom appointment, with the owner's number", () => {
    const result = whatsAppForAppointment(REX, OWNER);

    expect(result.ok && result.messages).toHaveLength(1);
    expect(result.ok && result.messages[0].url).toMatch(/^https:\/\/wa\.me\/50688880101\?text=/);
    expect(texts(result)[0]).toBe(
      "Hola María! Te recordamos que Rex tiene cita el Jueves 10 de Septiembre 2026. ¡Te esperamos en la peluquería! 🐾",
    );
  });

  it("says only the pet and the day: never the time nor the service", () => {
    const [text] = texts(
      whatsAppForAppointment(
        { ...REX, startTime: "10:00", serviceType: "quick_service" } as UpcomingForWhatsApp,
        OWNER,
      ),
    );

    expect(text).toContain("Rex tiene cita el Jueves 10 de Septiembre 2026");
    expect(text).not.toContain("10:00");
    expect(text).not.toMatch(/servicio|grooming/i);
    expect(text).not.toContain("2026-09-10");
  });

  it("names the missing detail instead of composing an incomplete message", () => {
    expect(whatsAppForAppointment({ ...REX, date: "" }, OWNER)).toEqual({
      ok: false,
      error: "A la cita de Rex le falta la fecha.",
    });
  });

  it("asks for a phone number when the owner has none", () => {
    const result = whatsAppForAppointment(REX, { ...OWNER, phone: "" });
    expect(result.ok === false && result.error).toMatch(/no tiene teléfono/);
  });

  it("rejects a phone number with letters", () => {
    const result = whatsAppForAppointment(REX, { ...OWNER, phone: "8888-ABCD" });
    expect(result.ok === false && result.error).toMatch(/formato del teléfono no es válido/);
  });

  it("assumes Costa Rica (+506) for an 8-digit local number", () => {
    const result = whatsAppForAppointment(REX, { ...OWNER, phone: "8888-0101" });
    expect(result.ok && result.messages[0].url).toMatch(/^https:\/\/wa\.me\/50688880101\?/);
  });

  it("rejects a too-short number", () => {
    const result = whatsAppForAppointment(REX, { ...OWNER, phone: "8888-010" });
    expect(result.ok === false && result.error).toMatch(/formato del teléfono no es válido/);
  });

  it("accepts a number written with 506 but no plus sign", () => {
    expect(whatsAppForAppointment(REX, { ...OWNER, phone: "506 8888 0101" }).ok).toBe(true);
  });
});

describe("whatsAppForAllUpcoming (HU-7.1)", () => {
  it("lists every upcoming appointment in a single chat", () => {
    const five = [1, 2, 3, 4, 5].map((d) => ({ ...REX, date: `2026-10-0${d}` }));
    const result = whatsAppForAllUpcoming(OWNER, five);

    expect(result.ok && result.messages).toHaveLength(1);
    for (const d of [1, 2, 3, 4, 5]) expect(texts(result)[0]).toContain(`${d} de Octubre 2026`);
  });

  it("lists each pet with its day only", () => {
    const [text] = texts(whatsAppForAllUpcoming(OWNER, [REX, MILO]));

    expect(text).toContain("• Rex: Jueves 10 de Septiembre 2026");
    expect(text).toContain("• Milo: Viernes 11 de Septiembre 2026");
  });

  it("explains there is nothing to send when there are no upcoming appointments", () => {
    expect(whatsAppForAllUpcoming(OWNER, [])).toEqual({
      ok: false,
      error: "Este dueño no tiene próximas citas.",
    });
  });

  it("composes exactly the single-appointment message when only one is upcoming", () => {
    expect(whatsAppForAllUpcoming(OWNER, [REX])).toEqual(whatsAppForAppointment(REX, OWNER));
  });

  it("splits an over-long reminder by whole appointments, numbering each part", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      pet: { name: `Mascota con nombre largo ${i + 1}` },
      date: `2027-${String((i % 12) + 1).padStart(2, "0")}-15`,
    }));
    const result = whatsAppForAllUpcoming(OWNER, many);
    if (!result.ok) throw new Error(result.error);

    expect(result.messages.length).toBeGreaterThan(1);
    for (const message of result.messages)
      expect(message.url.length).toBeLessThanOrEqual(MAX_URL_LENGTH);
    const all = result.messages.map((m) => m.text).join("\n");
    for (const pet of many) expect(all).toContain(`• ${pet.pet.name}: `);
    expect(result.messages[0].text).toContain(`(1/${result.messages.length})`);
  });

  it("fails on the first appointment with a missing detail", () => {
    const result = whatsAppForAllUpcoming(OWNER, [REX, { ...MILO, date: "2026-13" }]);
    expect(result).toEqual({ ok: false, error: "A la cita de Milo le falta la fecha." });
  });
});
