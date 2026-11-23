export const BUENOS_AIRES_TZ = "America/Argentina/Buenos_Aires";

export interface CalendarDate {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  /** 0 = domingo ... 6 = sábado */
  weekday: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUENOS_AIRES_TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

/** Fecha calendario de un instante, vista desde Buenos Aires. */
export function toBuenosAiresDate(instant: Date = new Date()): CalendarDate {
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAY_INDEX[parts.weekday],
  };
}

export function isSameCalendarDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Suma días a una fecha calendario (independiente de zona horaria). */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    weekday: utc.getUTCDay(),
  };
}

/** True si el instante ISO cae en el mismo día (hora de Buenos Aires) que `now`. */
export function isTodayInBuenosAires(iso: string, now: Date = new Date()): boolean {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return false;
  return isSameCalendarDate(toBuenosAiresDate(instant), toBuenosAiresDate(now));
}
