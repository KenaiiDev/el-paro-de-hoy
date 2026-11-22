/**
 * Utilidades de texto para el clasificador basado en reglas.
 * Todo se compara sobre texto normalizado: minúsculas y sin tildes
 * ("Mañana Línea" → "manana linea").
 */

export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalize(text: string): string {
  return stripDiacritics(text).toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const termCache = new Map<string, RegExp>();

/**
 * Regex que encuentra `term` como palabra completa (admite plural -s/-es).
 * "paro" coincide con "paro" y "paros", pero no con "amparo" ni "disparo".
 */
export function termRegex(term: string): RegExp {
  const key = normalize(term);
  let regex = termCache.get(key);
  if (!regex) {
    const body = escapeRegex(key).replace(/ /g, "\\s+");
    regex = new RegExp(`(?<![\\p{L}\\p{N}])${body}(?:e?s)?(?![\\p{L}\\p{N}])`, "u");
    termCache.set(key, regex);
  }
  return regex;
}

/** `text` debe estar normalizado. */
export function hasTerm(text: string, term: string): boolean {
  return termRegex(term).test(text);
}

/** `text` debe estar normalizado. */
export function hasAnyTerm(text: string, terms: readonly string[]): boolean {
  return terms.some((t) => hasTerm(text, t));
}

/** `text` debe estar normalizado. */
export function findTerms(text: string, terms: readonly string[]): string[] {
  return terms.filter((t) => hasTerm(text, t));
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const SEGMENT_SEPARATORS = /\s*(?:[:;|.?!¿¡]|\s[-–—]\s|\spero\s)\s*/u;

/**
 * Divide un titular normalizado en frases. Los "volantas" cortas sin verbo
 * ("Colectivos: paro total hoy") se unen con la frase siguiente porque
 * indican el tema de todo el titular.
 */
export function splitSegments(
  normalizedText: string,
  isKicker: (segment: string) => boolean
): string[] {
  const raw = normalizedText
    .split(SEGMENT_SEPARATORS)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments: string[] = [];
  let pendingKicker = "";

  for (const segment of raw) {
    if (isKicker(segment)) {
      pendingKicker = `${pendingKicker} ${segment}`.trim();
      continue;
    }
    segments.push(`${pendingKicker} ${segment}`.trim());
    pendingKicker = "";
  }

  if (pendingKicker) segments.push(pendingKicker);
  return segments;
}
