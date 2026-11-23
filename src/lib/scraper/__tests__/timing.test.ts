import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/scraper/text";
import { detectTiming } from "@/lib/scraper/timing";

// Jueves 26/11/2026, 12:00 en Buenos Aires.
const NOW = new Date("2026-11-26T15:00:00Z");

describe("detectTiming", () => {
  it.each([
    ["paro hoy", "today"],
    ["paro este jueves", "today"],
    ["paro el jueves 26 de noviembre", "today"],
    ["paro el 26/11", "today"],
    ["demoras esta manana en el roca", "today"],
    ["paro manana", "future"],
    ["paro manana viernes", "future"],
    ["paro el viernes", "future"],
    ["paro el proximo jueves", "future"],
    ["paro el 2 de diciembre", "future"],
    ["hoy anuncian paro para el lunes", "future"],
    ["paro hoy y manana", "today"],
    ["uta anuncio un paro", "future"],
    ["el paro de ayer", "past"],
    ["paro el 20 de noviembre", "past"],
    ["tras el paro se normalizo el servicio", "past"],
    ["paro de colectivos: que lineas no funcionan", "unknown"],
  ])("%s → %s", (text, expected) => {
    expect(detectTiming(normalize(text), NOW)).toBe(expected);
  });

  it("interpreta fechas de enero como el año siguiente si estamos en diciembre", () => {
    const december = new Date("2026-12-30T15:00:00Z");
    expect(detectTiming("paro el 2 de enero", december)).toBe("future");
  });
});
