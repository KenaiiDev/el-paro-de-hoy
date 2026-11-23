import { describe, expect, it } from "vitest";
import { SECTORS, getSector } from "@/lib/sectors";
import { bodyConfirmsSector, classifyHeadline } from "@/lib/scraper/classifier";
import { FIXTURE_NOW, HEADLINE_FIXTURES } from "./headlines.fixtures";

describe("classifyHeadline (fixtures)", () => {
  it.each(HEADLINE_FIXTURES)("$title", ({ title, expected }) => {
    const actual: Record<string, string> = {};
    const unexpectedActive: string[] = [];

    for (const sector of SECTORS) {
      const { verdict, reason } = classifyHeadline(title, sector, FIXTURE_NOW);
      if (sector.id in expected) actual[sector.id] = verdict;
      else if (verdict === "active") unexpectedActive.push(`${sector.id} (${reason})`);
    }

    expect(actual).toEqual(expected);
    expect(unexpectedActive).toEqual([]);
  });
});

describe("métricas del clasificador sobre los fixtures", () => {
  it("precisión y recall de 'active' por encima del umbral", () => {
    let tp = 0;
    let fp = 0;
    let fn = 0;

    for (const fixture of HEADLINE_FIXTURES) {
      for (const sector of SECTORS) {
        const expectedActive = fixture.expected[sector.id] === "active";
        const predictedActive =
          classifyHeadline(fixture.title, sector, FIXTURE_NOW).verdict === "active";
        if (predictedActive && expectedActive) tp++;
        else if (predictedActive) fp++;
        else if (expectedActive) fn++;
      }
    }

    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    console.info(
      `[clasificador] precisión ${(precision * 100).toFixed(1)}% · recall ${(recall * 100).toFixed(1)}% (tp=${tp} fp=${fp} fn=${fn})`
    );

    expect(precision).toBeGreaterThanOrEqual(0.95);
    expect(recall).toBeGreaterThanOrEqual(0.9);
  });
});

describe("bodyConfirmsSector", () => {
  const colectivo = getSector("colectivo");
  const tren = getSector("tren");

  it("confirma cuando el cuerpo menciona el sector cerca del paro", () => {
    const body = "El paro de transporte afecta hoy a los colectivos de 40 líneas del AMBA.";
    expect(bodyConfirmsSector(body, colectivo)).toBe(true);
  });

  it("no confirma si el sector funciona con normalidad", () => {
    const body = "Pese al paro, los trenes funcionan con normalidad en todas las líneas.";
    expect(bodyConfirmsSector(body, tren)).toBe(false);
  });

  it("no confirma si el sector no aparece", () => {
    const body = "El paro de transporte afecta a los colectivos.";
    expect(bodyConfirmsSector(body, tren)).toBe(false);
  });
});
