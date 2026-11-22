import { describe, expect, it } from "vitest";
import { addDays, isTodayInBuenosAires, toBuenosAiresDate } from "@/lib/time";

describe("toBuenosAiresDate", () => {
  it("convierte a la fecha de Buenos Aires (UTC-3)", () => {
    // 02:00 UTC del 22/11 todavía es 21/11 en Buenos Aires
    expect(toBuenosAiresDate(new Date("2026-11-22T02:00:00Z"))).toEqual({
      year: 2026,
      month: 11,
      day: 21,
      weekday: 6,
    });
  });
});

describe("addDays", () => {
  it("cruza fin de mes y de año", () => {
    expect(addDays({ year: 2026, month: 12, day: 31, weekday: 4 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
      weekday: 5,
    });
  });
});

describe("isTodayInBuenosAires", () => {
  const now = new Date("2026-11-22T15:00:00Z"); // 12:00 en BA

  it("acepta un instante del mismo día en BA", () => {
    expect(isTodayInBuenosAires("2026-11-22T03:30:00Z", now)).toBe(true);
  });

  it("rechaza la noche anterior aunque en UTC sea el mismo día", () => {
    expect(isTodayInBuenosAires("2026-11-22T02:59:00Z", now)).toBe(false);
  });

  it("rechaza strings inválidos (p.ej. el formato viejo es-AR)", () => {
    expect(isTodayInBuenosAires("22/11/2026, 10:00:00", now)).toBe(false);
  });
});
