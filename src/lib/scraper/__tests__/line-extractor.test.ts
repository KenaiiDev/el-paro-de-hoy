import { describe, expect, it } from "vitest";
import { extractAffectedLines } from "@/lib/scraper/line-extractor";

describe("extractAffectedLines: colectivos", () => {
  it("extrae líneas mencionadas con 'línea' o 'líneas'", () => {
    expect(extractAffectedLines("Por el paro no funcionan las líneas 60, 152 y 168.", "bus")).toEqual([
      "Línea 60",
      "Línea 152",
      "Línea 168",
    ]);
  });

  it("extrae listados sueltos con ramales entre paréntesis", () => {
    expect(extractAffectedLines("Por el paro no funcionan: 17, 28, 34 (ramal 2) y 44.", "bus")).toEqual([
      "Línea 17",
      "Línea 28",
      "Línea 34",
      "Línea 44",
    ]);
  });

  it("no confunde horarios ni fechas con líneas", () => {
    expect(extractAffectedLines("El paro rige entre las 10 y 14 horas.", "bus")).toEqual([]);
    expect(extractAffectedLines("El paro se repetirá los 2 y 3 de diciembre.", "bus")).toEqual([]);
  });

  it("ignora secciones de notas relacionadas", () => {
    expect(
      extractAffectedLines("Paro parcial en la línea 60. Te puede interesar: paro en la línea 152", "bus")
    ).toEqual(["Línea 60"]);
  });

  it("no extrae líneas de subte ni de tren", () => {
    expect(extractAffectedLines("Paro en la línea B del subte y en el tren Roca", "bus")).toEqual([]);
  });
});

describe("extractAffectedLines: trenes", () => {
  it("reconoce líneas por nombre", () => {
    expect(extractAffectedLines("El paro afecta a la línea Sarmiento y al tren Roca.", "train")).toEqual([
      "Roca",
      "Sarmiento",
    ]);
  });

  it("no confunde el partido de General San Martín con la línea", () => {
    expect(extractAffectedLines("Paro docente en General San Martín.", "train")).toEqual([]);
  });
});

describe("extractAffectedLines: subtes", () => {
  it("reconoce letras de línea", () => {
    expect(extractAffectedLines("Paro en las líneas B y D del subte.", "subway")).toEqual([
      "Subte B",
      "Subte D",
    ]);
  });

  it("no confunde la preposición 'a' con la línea A", () => {
    expect(extractAffectedLines("Paro en las lineas a partir de las 10.", "subway")).toEqual([]);
  });

  it("detecta paro en toda la red", () => {
    expect(extractAffectedLines("Paro en todas las líneas de subte y el premetro.", "subway")).toEqual([
      "Subte A",
      "Subte B",
      "Subte C",
      "Subte D",
      "Subte E",
      "Subte H",
      "Premetro",
    ]);
  });
});

describe("extractAffectedLines: sectores genéricos", () => {
  it("devuelve vacío", () => {
    expect(extractAffectedLines("Paro en la línea 60", "generic")).toEqual([]);
  });
});
