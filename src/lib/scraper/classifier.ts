import type { SectorConfig } from "@/lib/sectors";
import { countWords, findTerms, hasAnyTerm, normalize, splitSegments } from "./text";
import { Timing, detectTiming } from "./timing";

/**
 * Veredicto de un titular para un sector.
 * - active:       hay paro hoy en el sector
 * - possible:     menciona un paro del sector pero falta confirmar que sea hoy
 *                 o que realmente afecte al sector (p.ej. sólo dice "transporte")
 * - announced:    paro anunciado para otro día
 * - past:         paro que ya ocurrió
 * - lifted:       paro levantado, suspendido o postergado
 * - not-affected: el sector funciona con normalidad / no adhiere
 * - irrelevant:   el titular no habla de un paro de este sector
 */
export type Verdict =
  | "active"
  | "possible"
  | "announced"
  | "past"
  | "lifted"
  | "not-affected"
  | "irrelevant";

export type MatchStrength = "strong" | "weak";

export interface Classification {
  verdict: Verdict;
  strength?: MatchStrength;
  timing?: Timing;
  /** Explicación legible del veredicto, útil para depurar. */
  reason: string;
}

/** Términos que por sí solos indican una medida de fuerza. */
export const STRIKE_TERMS = [
  "paro",
  "huelga",
  "medida de fuerza",
  "medidas de fuerza",
  "retencion de tareas",
  "trabajo a reglamento",
  "quite de colaboracion",
  "asambleas",
  "jornada de protesta",
];

/** Frases de interrupción del servicio; pueden deberse a otras causas. */
const OUTAGE_PATTERNS = [
  /(?<![\p{L}])sin servicio(?![\p{L}])/u,
  /(?<![\p{L}])no hay(?![\p{L}])/u,
  /(?<![\p{L}])no funciona(?:n)?(?![\p{L}])/u,
  /(?<![\p{L}])paran(?![\p{L}])/u,
  /(?<![\p{L}])sin (?:colectivos|trenes|subtes?|clases|vuelos|bancos|recoleccion)(?![\p{L}])/u,
];

/** Causas de interrupción que no son un paro (son cortes, futura categoría). */
const NON_STRIKE_CAUSES = [
  "obras",
  "mantenimiento",
  "renovacion",
  "temporal",
  "tormenta",
  "lluvia",
  "inundacion",
  "accidente",
  "descarrilamiento",
  "robo de cables",
  "falla tecnica",
  "corte de luz",
  "apagon",
  "incendio",
  "feriado",
];

const LIFTED_PATTERNS = [
  /levant(?:a|an|o|aron|ado|ada)\s+(?:el |la |los )?(?:paro|medida|huelga)/u,
  /(?:paro|medida|huelga)s?\s+(?:fue |queda |quedo )?(?:levantad|suspendid|postergad|desactivad)/u,
  /suspend(?:e|en|io|ieron)\s+(?:el |la )?(?:paro|medida|huelga)/u,
  /posterg(?:a|an|o|aron)\s+(?:el |la )?(?:paro|medida|huelga)/u,
  /desactiv(?:a|an|o|aron)\s+(?:el |la )?(?:paro|medida|huelga)/u,
  /descart(?:a|an|o|aron)\s+(?:el |la |un )?(?:paro|medida|huelga)/u,
  /se (?:cayo|levanto|suspendio) el paro/u,
  /dej(?:a|an|o|aron) sin efecto/u,
  /(?<!pese a (?:la )?)(?<!a pesar de (?:la )?)conciliacion obligatoria/u,
  /no (?:habra|hay|hubo) paro/u,
  /sin paro/u,
];

const NOT_AFFECTED_PATTERNS = [
  /con normalidad/u,
  /normalmente/u,
  /funciona(?:n)? normal/u,
  /servicio normal/u,
  /no adhiere(?:n)?/u,
  /no para(?:n)?(?![\p{L}])/u,
];

/** Lugares fuera del AMBA que suelen aparecer en notas de paros locales. */
const OTHER_JURISDICTIONS = [
  "cordoba",
  "rosario",
  "santa fe",
  "mendoza",
  "tucuman",
  "salta",
  "jujuy",
  "neuquen",
  "rio negro",
  "chubut",
  "santa cruz",
  "tierra del fuego",
  "entre rios",
  "parana",
  "corrientes",
  "misiones",
  "chaco",
  "formosa",
  "san juan",
  "san luis",
  "la rioja",
  "catamarca",
  "santiago del estero",
  "la pampa",
  "mar del plata",
  "bahia blanca",
  "bariloche",
];

/** Referencias que confirman que la nota incluye al AMBA. */
const AMBA_MARKERS = [
  "amba",
  "buenos aires",
  "caba",
  "conurbano",
  "porteno",
  "portenas",
  "portenos",
  "bonaerense",
  "gba",
  "area metropolitana",
  "nacional",
  "todo el pais",
  "pais",
];

/** Muchas calles porteñas llevan nombres de provincias: "Av. Córdoba", "Corrientes y Callao". */
const OTHER_JURISDICTION_REGEX = new RegExp(
  `(?<!(?:av|avda|avenida|calle|esquina)\\.? )(?<![\\p{L}])(?:${OTHER_JURISDICTIONS.join("|")})(?![\\p{L}])`,
  "u"
);

/** Una avenida mencionada ("desvíos en Av. Córdoba y Corrientes") indica que se habla de calles porteñas. */
const STREET_REFERENCE = /(?<![\p{L}])(?:av|avda|avenida)\.?\s/u;

/** True si la nota es de otra jurisdicción y no menciona al AMBA. */
function isOutsideAmba(text: string): boolean {
  if (hasAnyTerm(text, AMBA_MARKERS) || STREET_REFERENCE.test(text)) return false;
  return OTHER_JURISDICTION_REGEX.test(text);
}

/** Partes del titular escritas como pregunta: "¿Hay paro hoy?". */
function questionSpans(headline: string): string[] {
  return (headline.match(/¿[^?]*\?/g) ?? []).map(normalize);
}

function hasStrikeTerm(segment: string): boolean {
  return hasAnyTerm(segment, STRIKE_TERMS);
}

function hasStrikeSignal(segment: string): boolean {
  return hasStrikeTerm(segment) || OUTAGE_PATTERNS.some((p) => p.test(segment));
}

/** Una volanta corta sin señal de paro ("Colectivos:", "UTA:"). */
function isKicker(segment: string): boolean {
  return countWords(segment) <= 3 && !hasStrikeSignal(segment);
}

/** "paro de colectivos", "huelga en los trenes": el paro es explícitamente del sector. */
function isDirectStrikeOf(segment: string, keywords: string[]): boolean {
  return keywords.some((kw) =>
    new RegExp(
      `(?:paro|huelga|medida de fuerza)s?(?: total| parcial| general)?\\s+(?:de|en)\\s+(?:l[oa]s?\\s+)?${kw}`,
      "u"
    ).test(segment)
  );
}

/**
 * Clasifica un titular para un sector usando sólo reglas.
 * `now` define qué es "hoy" (hora de Buenos Aires).
 */
export function classifyHeadline(
  headline: string,
  sector: SectorConfig,
  now: Date = new Date()
): Classification {
  const text = normalize(headline);
  const segments = splitSegments(text, isKicker);

  const strongKeywords = sector.strongKeywords.map(normalize);
  const weakKeywords = sector.weakKeywords.map(normalize);

  const candidates = segments
    .map((segment) => {
      const strong = findTerms(segment, strongKeywords);
      const weak = findTerms(segment, weakKeywords);
      return { segment, strong, weak };
    })
    .filter((c) => c.strong.length > 0 || c.weak.length > 0);

  if (candidates.length === 0) {
    return { verdict: "irrelevant", reason: "no menciona el sector" };
  }

  // "Paro general: la UTA no adhiere" → la frase del sector habla del paro aunque no diga "paro".
  const headlineHasStrike = hasStrikeTerm(text);
  const withSignal = candidates.filter(
    (c) =>
      hasStrikeSignal(c.segment) ||
      (headlineHasStrike && NOT_AFFECTED_PATTERNS.some((p) => p.test(c.segment)))
  );
  if (withSignal.length === 0) {
    return {
      verdict: "irrelevant",
      reason: "menciona el sector pero no un paro en la misma frase",
    };
  }

  if (LIFTED_PATTERNS.some((p) => p.test(text))) {
    return { verdict: "lifted", reason: "paro levantado/suspendido" };
  }

  if (sector.scope === "AMBA" && isOutsideAmba(text)) {
    return { verdict: "irrelevant", reason: "paro de otra jurisdicción" };
  }

  const strongMatches = withSignal.filter((c) => c.strong.length > 0);
  const relevant = strongMatches.length > 0 ? strongMatches : withSignal;
  const strength: MatchStrength = strongMatches.length > 0 ? "strong" : "weak";

  const direct = relevant.some((c) => isDirectStrikeOf(c.segment, [...c.strong, ...c.weak]));
  const allNotAffected = relevant.every((c) =>
    NOT_AFFECTED_PATTERNS.some((p) => p.test(c.segment))
  );
  if (allNotAffected && !direct) {
    return { verdict: "not-affected", strength, reason: "el sector funciona con normalidad" };
  }

  const onlyOutage = !headlineHasStrike;
  if (onlyOutage && hasAnyTerm(text, NON_STRIKE_CAUSES)) {
    return { verdict: "irrelevant", strength, reason: "interrupción por otra causa (no es paro)" };
  }

  // La referencia temporal se busca primero en la frase del sector y, si no hay, en todo el titular.
  const segmentTiming = detectTiming(relevant.map((c) => c.segment).join(" | "), now);
  const timing = segmentTiming !== "unknown" ? segmentTiming : detectTiming(text, now);

  // "¿Hay paro de colectivos hoy?": el titular pregunta, no afirma.
  const questions = questionSpans(headline);
  const onlyAsked =
    questions.length > 0 &&
    relevant.every((c) => questions.some((q) => q.includes(c.segment) || c.segment.includes(q.replace(/[¿?]/g, "").trim())));

  if (onlyAsked && (timing === "today" || timing === "unknown")) {
    return { verdict: "possible", strength, timing, reason: "titular en forma de pregunta" };
  }

  switch (timing) {
    case "future":
      return { verdict: "announced", strength, timing, reason: "paro anunciado para otro día" };
    case "past":
      return { verdict: "past", strength, timing, reason: "paro de otro día" };
    case "unknown":
      return { verdict: "possible", strength, timing, reason: "no indica cuándo" };
    case "today":
      return strength === "strong"
        ? { verdict: "active", strength, timing, reason: "paro del sector hoy" }
        : { verdict: "possible", strength, timing, reason: "paro hoy, sector ambiguo" };
  }
}

/**
 * Para sectores de transporte con coincidencia débil ("paro de transporte hoy"):
 * confirma con el cuerpo de la nota que el sector está afectado.
 */
export function bodyConfirmsSector(body: string, sector: SectorConfig): boolean {
  const text = normalize(body);
  const keywords = sector.strongKeywords.map(normalize);
  const context = /(?:paro|huelga|sin servicio|medida de fuerza|no funcionan?|adhiere)/gu;

  for (const match of text.matchAll(context)) {
    const start = Math.max(0, (match.index ?? 0) - 150);
    const window = text.slice(start, (match.index ?? 0) + 150);
    if (hasAnyTerm(window, keywords) && !NOT_AFFECTED_PATTERNS.some((p) => p.test(window))) {
      return true;
    }
  }
  return false;
}
