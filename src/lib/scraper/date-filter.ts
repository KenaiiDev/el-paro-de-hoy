const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function getBuenosAiresDate(): Date {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
}

function buildTodayPatterns(today: Date): string[] {
  const currentDay = DIAS_SEMANA[today.getDay()];
  return [
    "hoy",
    "esta semana",
    "este " + currentDay,
    currentDay + " " + today.getDate(),
    today.getDate() + " de " + MESES[today.getMonth()],
    currentDay, // naked day of the week (e.g. 'martes' will match 'lunes y martes')
  ];
}

function buildNotTodayPatterns(today: Date): string[] {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [
    "mañana " + DIAS_SEMANA[tomorrow.getDay()],
    "próximo " + DIAS_SEMANA[tomorrow.getDay()],
    "el próximo",
    "siguiente semana",
    "anunciado para",
    "será el " + DIAS_SEMANA[tomorrow.getDay()],
    DIAS_SEMANA[tomorrow.getDay()] + " " + tomorrow.getDate(),
    tomorrow.getDate() + " de " + MESES[tomorrow.getMonth()],
  ];
}

export function isTodayMentioned(content: string): boolean {
  const today = getBuenosAiresDate();
  const lower = content.toLowerCase();

  const notToday = buildNotTodayPatterns(today);
  if (notToday.some((p) => lower.includes(p))) return false;

  return buildTodayPatterns(today).some((p) => lower.includes(p));
}
