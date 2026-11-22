import { describe, expect, it } from "vitest";
import { hasTerm, normalize, splitSegments } from "@/lib/scraper/text";

describe("normalize", () => {
  it("pasa a minúsculas y quita tildes", () => {
    expect(normalize("  Mañana PARO en la Línea  Sarmiento ")).toBe("manana paro en la linea sarmiento");
  });
});

describe("hasTerm", () => {
  it.each([
    ["paro de colectivos", "paro", true],
    ["paros en el transporte", "paro", true],
    ["un amparo judicial", "paro", false],
    ["el disparo", "paro", false],
    ["debate en el congreso", "ate", false],
    ["paro de ate", "ate", true],
    ["ruta 2", "uta", false],
    ["la uta anuncio", "uta", true],
    ["paro de trenes", "tren", true],
    ["los judiciales", "judicial", true],
    ["medidas de fuerza", "medidas de fuerza", true],
  ])("%s contiene %s → %s", (text, term, expected) => {
    expect(hasTerm(text, term)).toBe(expected);
  });
});

describe("splitSegments", () => {
  const isKicker = (s: string) => s.split(" ").length <= 2 && !s.includes("paro");

  it("separa por dos puntos y une las volantas cortas", () => {
    expect(splitSegments("colectivos: paro total hoy: que lineas funcionan", isKicker)).toEqual([
      "colectivos paro total hoy",
      "que lineas funcionan",
    ]);
  });

  it("separa por 'pero'", () => {
    expect(splitSegments("paro de trenes pero los colectivos funcionan", isKicker)).toEqual([
      "paro de trenes",
      "los colectivos funcionan",
    ]);
  });
});
