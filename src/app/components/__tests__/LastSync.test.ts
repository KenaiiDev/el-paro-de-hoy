import { describe, expect, it } from "vitest";
import { formatRelative } from "../LastSync";

const now = new Date("2026-11-22T15:00:00Z").getTime();

describe("formatRelative", () => {
  it.each([
    ["2026-11-22T14:59:40Z", "hace instantes"],
    ["2026-11-22T14:59:00Z", "hace 1 minuto"],
    ["2026-11-22T14:15:00Z", "hace 45 minutos"],
    ["2026-11-22T12:00:00Z", "hace 3 horas"],
  ])("%s → %s", (iso, expected) => {
    expect(formatRelative(iso, now)).toBe(expected);
  });

  it("devuelve N/A para fechas inválidas", () => {
    expect(formatRelative("no es fecha", now)).toBe("N/A");
  });
});
