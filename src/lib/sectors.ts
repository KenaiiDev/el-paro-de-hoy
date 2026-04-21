import { SectorId } from "@/types/strike";

export interface SectorConfig {
  id: SectorId;
  name: string;
  queries: string[];
  scope: string;
  sectorKeywords: string[];
}

export const SECTORS: readonly SectorConfig[] = [
  {
    id: "colectivo",
    name: "Colectivos",
    queries: ["paro colectivos hoy amba"],
    scope: "AMBA",
    sectorKeywords: ["colectivo", "transporte", "línea", "chofer", "uta"],
  },
  {
    id: "tren",
    name: "Trenes",
    queries: ["paro trenes hoy amba"],
    scope: "AMBA",
    sectorKeywords: ["tren", "transporte", "ramal", "línea", "fraternidad"],
  },
  {
    id: "subte",
    name: "Subtes",
    queries: ["paro subte hoy amba"],
    scope: "AMBA",
    sectorKeywords: ["subte", "metro", "premetro", "transporte", "línea", "agtsyp"],
  },
  {
    id: "aeronautic",
    name: "Aeronáutico",
    queries: [
      "paro aeronautico hoy argentina",
      "paro pilotos hoy argentina",
      "paro aerolineas hoy argentina",
    ],
    scope: "Nacional",
    sectorKeywords: ["aeronáutico", "aeronautico", "aeroparque", "ezeiza", "vuelo", "piloto", "aerolíneas", "aerolineas", "aeropuerto", "ate anac", "anac"],
  },
  {
    id: "education",
    name: "Educación",
    queries: [
      "paro docente hoy amba",
      "paro educación hoy buenos aires",
      "paro escuelas hoy amba",
    ],
    scope: "AMBA",
    sectorKeywords: ["docente", "educación", "educacion", "escuela", "clases", "maestro", "gremio docente", "suteba", "ute"],
  },
  {
    id: "health",
    name: "Salud",
    queries: [
      "paro médicos hoy amba",
      "paro enfermeros hoy amba",
      "paro hospitales hoy buenos aires",
    ],
    scope: "AMBA",
    sectorKeywords: ["médico", "medico", "enfermero", "hospital", "salud", "clínica", "clinica", "pami", "ioma", "residentes"],
  },
  {
    id: "public-admin",
    name: "Administración Pública",
    queries: [
      "paro administración pública hoy amba",
      "paro empleados estatales hoy buenos aires",
      "paro estado hoy amba",
    ],
    scope: "AMBA",
    sectorKeywords: ["estatal", "estado", "administración pública", "administracion publica", "empleado público", "empleado publico", "ate", "upcn"],
  },
  {
    id: "banking",
    name: "Bancarios",
    queries: [
      "paro bancario hoy argentina",
      "paro bancos hoy argentina",
      "paro bancarios hoy",
    ],
    scope: "Nacional",
    sectorKeywords: ["bancario", "banco", "bancarios", "asociación bancaria", "asociacion bancaria"],
  },
  {
    id: "logistics",
    name: "Recolección y Logística",
    queries: [
      "paro recolección basura hoy amba",
      "paro logística hoy amba",
      "paro camioneros hoy amba",
    ],
    scope: "AMBA",
    sectorKeywords: ["recolección", "recoleccion", "basura", "residuos", "camionero", "logística", "logistica"],
  },
  {
    id: "justice",
    name: "Justicia",
    queries: [
      "paro judicial hoy amba",
      "paro justicia hoy buenos aires",
      "paro tribunales hoy amba",
    ],
    scope: "AMBA",
    sectorKeywords: ["judicial", "justicia", "tribunal", "juzgado", "uejn", "ajb", "judiciales"],
  },
] as const;
