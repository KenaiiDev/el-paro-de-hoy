import { CalendarDate, addDays, toBuenosAiresDate } from "@/lib/time";

/**
 * Cuándo ocurre lo que describe un titular, relativo a "hoy" en Buenos Aires.
 * - today:   hoy (o en curso)
 * - future:  mañana, próximo lunes, una fecha posterior, otro día de la semana
 * - past:    ayer, una fecha anterior
 * - unknown: no hay referencias temporales
 */
export type Timing = "today" | "future" | "past" | "unknown";

const WEEKDAYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "(?:septiembre|setiembre)",
  "octubre",
  "noviembre",
  "diciembre",
];

const WORD = (pattern: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, "u");

const TODAY_PATTERNS = [
  WORD("hoy"),
  WORD("esta (?:manana|tarde|noche)"),
  WORD("en este momento"),
  WORD("ahora"),
  WORD("en vivo"),
  WORD("minuto a minuto"),
  WORD("en curso"),
  WORD("rige"),
  WORD("arranco|comenzo|empezo"),
];

/** "mañana" como día siguiente, no "esta mañana" / "por la mañana". */
const TOMORROW = WORD("(?<!(?:esta|la|una|cada|toda) )manana");

const FUTURE_PATTERNS = [
  TOMORROW,
  WORD("proxim[oa]s?"),
  WORD("(?:la )?semana que viene"),
  WORD("que viene"),
  WORD("a partir del?"),
];

const ANNOUNCEMENT_PATTERNS = [
  WORD("anunci(?:a|an|o|aron)"),
  WORD("convoc(?:a|an|o|aron)"),
  WORD("lanz(?:a|an|o|aron)"),
  WORD("amenaz(?:a|an|o|aron)"),
  WORD("evalu(?:a|an)"),
  WORD("analiz(?:a|an)"),
  WORD("advierte|advierten"),
  WORD("ultimatum"),
];

const PAST_PATTERNS = [
  WORD("ayer"),
  WORD("anoche"),
  WORD("hubo"),
  WORD("(?:tras|luego de|despues de)(?: el| la)? (?:paro|huelga|medida)"),
  WORD("pasado"),
];

const MONTH_DATE = new RegExp(
  `(?<!\\p{N})(\\d{1,2}) de (${MONTHS.join("|")})(?![\\p{L}])`,
  "u"
);
const NUMERIC_DATE = /(?<!\d)(\d{1,2})\/(\d{1,2})(?!\d)/;

function monthIndex(name: string): number {
  return MONTHS.findIndex((m) => new RegExp(`^${m}$`).test(name)) + 1;
}

/** Diferencia en días entre una fecha (día/mes sin año) y hoy, tomando el año más cercano. */
function diffInDays(today: CalendarDate, day: number, month: number): number | null {
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const base = Date.UTC(today.year, today.month - 1, today.day);
  const candidates = [-1, 0, 1].map((dy) =>
    Math.round((Date.UTC(today.year + dy, month - 1, day) - base) / 86_400_000)
  );
  return candidates.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a));
}

function explicitDateTiming(text: string, today: CalendarDate): Timing | null {
  const monthMatch = text.match(MONTH_DATE);
  const numericMatch = text.match(NUMERIC_DATE);

  let diff: number | null = null;
  if (monthMatch) diff = diffInDays(today, Number(monthMatch[1]), monthIndex(monthMatch[2]));
  else if (numericMatch) diff = diffInDays(today, Number(numericMatch[1]), Number(numericMatch[2]));

  if (diff === null) return null;
  if (diff === 0) return "today";
  return diff > 0 ? "future" : "past";
}

function weekdayTiming(text: string, today: CalendarDate): Timing | null {
  const todayName = WEEKDAYS[today.weekday];
  const tomorrowName = WEEKDAYS[addDays(today, 1).weekday];

  const todayMentioned = WORD(todayName).test(text);
  const qualifiedAway = WORD(`(?:proximo|otro) ${todayName}|${todayName} (?:pasado|que viene|proximo)`).test(text);
  if (todayMentioned && !qualifiedAway) return "today";

  if (WORD(tomorrowName).test(text)) return "future";

  const otherDay = WEEKDAYS.some((d) => d !== todayName && WORD(d).test(text));
  return otherDay ? "future" : null;
}

/** "para mañana", "para el lunes": referencias a futuro que pesan más que un "hoy" suelto. */
function strongFutureReference(text: string, today: CalendarDate): boolean {
  const otherDays = WEEKDAYS.filter((_, i) => i !== today.weekday).join("|");
  return WORD(`(?:para|desde) (?:el |este )?(?:manana|${otherDays})`).test(text);
}

/** `text` debe estar normalizado. */
export function detectTiming(text: string, now: Date = new Date()): Timing {
  const today = toBuenosAiresDate(now);

  // Una fecha explícita es la señal más fuerte ("paro el 27 de noviembre").
  const byDate = explicitDateTiming(text, today);
  if (byDate && byDate !== "today") return byDate;
  if (strongFutureReference(text, today)) return "future";
  if (byDate === "today" || TODAY_PATTERNS.some((p) => p.test(text))) return "today";

  const byWeekday = weekdayTiming(text, today);
  if (byWeekday) return byWeekday;

  if (FUTURE_PATTERNS.some((p) => p.test(text))) return "future";
  if (PAST_PATTERNS.some((p) => p.test(text))) return "past";
  if (ANNOUNCEMENT_PATTERNS.some((p) => p.test(text))) return "future";

  return "unknown";
}
