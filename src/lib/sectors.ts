import { SectorId } from "@/types/strike";

/** Qué extractor de líneas aplica al sector. */
export type SectorKind = "bus" | "train" | "subway" | "generic";

export interface SectorConfig {
  id: SectorId;
  name: string;
  kind: SectorKind;
  queries: string[];
  scope: string;
  /**
   * Términos que identifican al sector sin ambigüedad. Se comparan como
   * palabra completa, sin tildes y admitiendo plural ("colectivo" → "colectivos").
   */
  strongKeywords: string[];
  /**
   * Términos que sugieren el sector pero no alcanzan solos
   * (p.ej. "transporte" puede ser colectivos, trenes o subtes).
   */
  weakKeywords: string[];
  affectedLabel: string;
}

export const SECTORS: readonly SectorConfig[] = [
  {
    id: "colectivo",
    name: "Colectivos",
    kind: "bus",
    queries: ["paro colectivos hoy amba"],
    scope: "AMBA",
    strongKeywords: ["colectivo", "uta", "chofer", "choferes", "bondi"],
    weakKeywords: ["transporte", "transporte publico"],
    affectedLabel: "líneas",
  },
  {
    id: "tren",
    name: "Trenes",
    kind: "train",
    queries: ["paro trenes hoy amba"],
    scope: "AMBA",
    strongKeywords: [
      "tren",
      "ferroviario",
      "la fraternidad",
      "maquinistas",
      "ramal",
      "trenes argentinos",
      "roca",
      "mitre",
      "sarmiento",
      "belgrano norte",
      "belgrano sur",
      "linea san martin",
      "tren san martin",
      "urquiza",
      "tren de la costa",
    ],
    weakKeywords: ["transporte", "transporte publico"],
    affectedLabel: "líneas",
  },
  {
    id: "subte",
    name: "Subtes",
    kind: "subway",
    queries: ["paro subte hoy amba"],
    scope: "AMBA",
    strongKeywords: ["subte", "premetro", "metrodelegados", "agtsyp", "emova"],
    weakKeywords: ["transporte", "transporte publico"],
    affectedLabel: "líneas",
  },
  {
    id: "aeronautic",
    name: "Aeronáutico",
    kind: "generic",
    queries: [
      "paro aeronautico hoy argentina",
      "paro pilotos hoy argentina",
      "paro aerolineas hoy argentina",
    ],
    scope: "Nacional",
    strongKeywords: [
      "aeronautico",
      "aeroparque",
      "ezeiza",
      "vuelo",
      "piloto",
      "aerolineas",
      "aeropuerto",
      "anac",
      "apla",
      "controladores aereos",
      "atepsa",
      "intercargo",
      "aeronavegantes",
    ],
    weakKeywords: ["aereo"],
    affectedLabel: "aerolíneas",
  },
  {
    id: "education",
    name: "Educación",
    kind: "generic",
    queries: [
      "paro docente hoy amba",
      "paro educación hoy buenos aires",
      "paro escuelas hoy amba",
    ],
    scope: "AMBA",
    strongKeywords: [
      "docente",
      "escuela",
      "clases",
      "maestro",
      "suteba",
      "ctera",
      "ute",
      "ademys",
      "universidad",
      "universitario",
      "conadu",
    ],
    weakKeywords: ["educacion", "educativo"],
    affectedLabel: "establecimientos",
  },
  {
    id: "health",
    name: "Salud",
    kind: "generic",
    queries: [
      "paro médicos hoy amba",
      "paro enfermeros hoy amba",
      "paro hospitales hoy buenos aires",
    ],
    scope: "AMBA",
    strongKeywords: [
      "medico",
      "enfermero",
      "enfermera",
      "hospital",
      "residentes",
      "salud",
      "clinica",
      "sanatorio",
      "fesprosa",
    ],
    weakKeywords: ["pami", "ioma", "guardia"],
    affectedLabel: "establecimientos",
  },
  {
    id: "public-admin",
    name: "Administración Pública",
    kind: "generic",
    queries: [
      "paro administración pública hoy amba",
      "paro empleados estatales hoy buenos aires",
      "paro estado hoy amba",
    ],
    scope: "AMBA",
    strongKeywords: [
      "estatales",
      "ate",
      "upcn",
      "administracion publica",
      "empleados publicos",
      "trabajadores del estado",
      "municipales",
    ],
    weakKeywords: ["estado", "estatal"],
    affectedLabel: "dependencias",
  },
  {
    id: "banking",
    name: "Bancarios",
    kind: "generic",
    queries: [
      "paro bancario hoy argentina",
      "paro bancos hoy argentina",
      "paro bancarios hoy",
    ],
    scope: "Nacional",
    strongKeywords: ["bancario", "banco", "la bancaria", "asociacion bancaria"],
    weakKeywords: [],
    affectedLabel: "entidades",
  },
  {
    id: "logistics",
    name: "Recolección y Logística",
    kind: "generic",
    queries: [
      "paro recolección basura hoy amba",
      "paro logística hoy amba",
      "paro camioneros hoy amba",
    ],
    scope: "AMBA",
    strongKeywords: ["recoleccion", "basura", "residuos", "recolectores", "camioneros"],
    weakKeywords: ["logistica"],
    affectedLabel: "sectores",
  },
  {
    id: "justice",
    name: "Justicia",
    kind: "generic",
    queries: [
      "paro judicial hoy amba",
      "paro justicia hoy buenos aires",
      "paro tribunales hoy amba",
    ],
    scope: "AMBA",
    strongKeywords: [
      "judicial",
      "justicia",
      "tribunal",
      "juzgado",
      "uejn",
      "ajb",
      "poder judicial",
    ],
    weakKeywords: [],
    affectedLabel: "dependencias",
  },
] as const;

export function getSector(id: SectorId): SectorConfig {
  const sector = SECTORS.find((s) => s.id === id);
  if (!sector) throw new Error(`Sector desconocido: ${id}`);
  return sector;
}
