import type { SectorKind } from "@/lib/sectors";
import { stripDiacritics } from "./text";

/** Nombre normalizado (sin tildes, minúsculas) → nombre para mostrar. */
const TRAIN_LINES: Record<string, string> = {
  roca: "Roca",
  mitre: "Mitre",
  sarmiento: "Sarmiento",
  "belgrano norte": "Belgrano Norte",
  "belgrano sur": "Belgrano Sur",
  "san martin": "San Martín",
  urquiza: "Urquiza",
  "tren de la costa": "Tren de la Costa",
};

const SUBWAY_LETTERS = ["A", "B", "C", "D", "E", "H"];

const MONTHS =
  "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre";

const RELATED_SECTION_PATTERNS = [
  /articulos relacionados.{0,2000}/gi,
  /te puede interesar.{0,2000}/gi,
  /mas noticias.{0,2000}/gi,
  /notas relacionadas.{0,2000}/gi,
  /lee tambien.{0,2000}/gi,
  /segui leyendo.{0,2000}/gi,
];

const STRIKE_CONTEXT_REGEX =
  /(?:paro|huelga|sin servicio|medida de fuerza|afecta|no funcionan?|suspendido|cerrado|demoras?|adhieren?).{0,600}/gi;

/** Lo que sigue a un número e indica que no es una línea: "10 hs", "15 de marzo", "30%". */
const NOT_A_LINE_SUFFIX = new RegExp(
  `^\\s*(?:hs?\\b|horas?\\b|hrs?\\b|minutos?\\b|am\\b|pm\\b|%|por ciento|de (?:${MONTHS})\\b|dias?\\b|anos?\\b|mil\\b|millones?\\b|pesos\\b|\\$)`,
  "i"
);

function removeRelatedSections(content: string): string {
  return RELATED_SECTION_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, ""), content);
}

function extractStrikeContext(content: string): string {
  return (content.match(STRIKE_CONTEXT_REGEX) ?? []).join(" ");
}

function isLineNumber(context: string, matchEnd: number): boolean {
  return !NOT_A_LINE_SUFFIX.test(context.slice(matchEnd, matchEnd + 20));
}

function extractBusLines(context: string): string[] {
  const lines: string[] = [];
  const push = (numbers: string[]) => numbers.forEach((n) => lines.push(`Línea ${Number(n)}`));

  for (const match of context.matchAll(/\blineas?\s+(\d{1,3}(?:\s*(?:,|y|e)\s*\d{1,3})*)\b/gi)) {
    if (isLineNumber(context, match.index! + match[0].length)) push(match[1].match(/\d{1,3}/g) ?? []);
  }

  // "las 60, 152 y 168"
  for (const match of context.matchAll(/\b(?:las|los|la|el)\s+(\d{1,3}(?:\s*(?:,|y)\s*\d{1,3})+)\b/gi)) {
    if (isLineNumber(context, match.index! + match[0].length)) push(match[1].match(/\d{1,3}/g) ?? []);
  }

  // Listados sueltos de al menos 3 números: "17, 28, 34 (ramal 2) y 44."
  const standaloneList =
    /\b(\d{1,3}(?:\s*\([^)]+\))?(?:\s*[,-]\s*\d{1,3}(?:\s*\([^)]+\))?){2,}(?:\s+y\s+\d{1,3}(?:\s*\([^)]+\))?)?)(?=\.|;|$|\s+[A-Z])/g;
  for (const match of context.matchAll(standaloneList)) {
    const withoutParens = match[1].replace(/\([^)]*\)/g, "");
    const numbers = withoutParens.match(/\d{1,3}/g) ?? [];
    if (numbers.length >= 3) push(numbers);
  }

  return lines;
}

function extractTrainLines(context: string): string[] {
  const lines: string[] = [];
  const lower = context.toLowerCase();

  for (const [name, display] of Object.entries(TRAIN_LINES)) {
    // "General San Martín" es un partido del conurbano, no la línea.
    const term = name === "san martin" ? "(?<!general |gral\\.? )san martin" : name;
    const explicit = new RegExp(`\\b(?:linea|lineas|tren|trenes|ramal)\\s+(?:del?\\s+)?${term}\\b`);
    const nearStrike = new RegExp(`(?:paro|sin servicio).{0,30}\\b${term}\\b|\\b${term}\\b.{0,30}(?:paro|sin servicio)`);
    if (explicit.test(lower) || nearStrike.test(lower)) lines.push(display);
  }

  return lines;
}

function extractSubwayLines(context: string): string[] {
  const lines: string[] = [];
  const lower = context.toLowerCase();

  if (/(?:todas las lineas de subte|todas las lineas del subte|subte completo|todo el subte|toda la red)/.test(lower)) {
    SUBWAY_LETTERS.forEach((l) => lines.push(`Subte ${l}`));
  }

  // Las letras se buscan en mayúscula para no confundir "línea a" (preposición) con la línea A.
  for (const match of context.matchAll(
    /\b(?:[Ss]ubtes?|[Ll]ineas?)\s+([A-EH](?:\s*(?:,|y|e)\s*[A-EH])*)\b/g
  )) {
    (match[1].match(/[A-EH]/g) ?? []).forEach((l) => lines.push(`Subte ${l}`));
  }

  if (/\bpremetro\b/.test(lower)) lines.push("Premetro");

  return lines;
}

/**
 * Extrae las líneas afectadas del cuerpo de una nota, según el tipo de transporte.
 * Sólo mira el texto cercano a menciones de paro/servicio interrumpido.
 */
export function extractAffectedLines(rawContent: string, kind: SectorKind): string[] {
  if (kind === "generic") return [];

  const content = removeRelatedSections(stripDiacritics(rawContent));
  const context = extractStrikeContext(content);
  if (!context) return [];

  const extractors = { bus: extractBusLines, train: extractTrainLines, subway: extractSubwayLines };
  return Array.from(new Set(extractors[kind](context)));
}
