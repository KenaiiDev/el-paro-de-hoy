const TRANSPORTATION_NAMES = [
  "Roca",
  "Mitre",
  "Sarmiento",
  "Belgrano Norte",
  "Belgrano Sur",
  "San Martín",
  "Urquiza",
  "Subte A",
  "Subte B",
  "Subte C",
  "Subte D",
  "Subte E",
  "Subte H",
  "Premetro",
];

const RELATED_SECTION_PATTERNS = [
  /artículos relacionados.{0,2000}/gi,
  /te puede interesar.{0,2000}/gi,
  /más noticias.{0,2000}/gi,
  /notas relacionadas.{0,2000}/gi,
  /leé también.{0,2000}/gi,
];

const STRIKE_CONTEXT_REGEX =
  /(?:paro|sin servicio|medida de fuerza|afecta|no funcionan?|suspendido|cerrado|demoras?).{0,600}/gi;

function removeRelatedSections(content: string): string {
  return RELATED_SECTION_PATTERNS.reduce(
    (acc, pattern) => acc.replace(pattern, ""),
    content
  );
}

function extractStrikeContext(content: string): string {
  return (content.match(STRIKE_CONTEXT_REGEX) ?? []).join(" ");
}

function extractBusLines(context: string): string[] {
  const lines: string[] = [];

  for (const match of context.matchAll(/[Ll][íi]nea\s+(\d{1,3})\b/g)) {
    lines.push(`Línea ${match[1]}`);
  }

  const listWithLineaPrefix =
    /l[íi]neas?\s+(\d{1,3}(?:\s*,\s*\d{1,3})+(?:\s+y\s+\d{1,3})?)/gi;
  for (const match of context.matchAll(listWithLineaPrefix)) {
    (match[1].match(/\d{1,3}/g) ?? []).forEach((n) =>
      lines.push(`Línea ${n}`)
    );
  }

  const articlePrefixedList =
    /(?:las|los|la|el)\s+(\d{1,3}(?:\s*[,y]\s*\d{1,3})+)/gi;
  for (const match of context.matchAll(articlePrefixedList)) {
    (match[1].match(/\d{1,3}/g) ?? []).forEach((n) =>
      lines.push(`Línea ${n}`)
    );
  }

  const standaloneList =
    /\b(\d{1,3}(?:\s*\([^)]+\))?(?:\s*[,\-]\s*\d{1,3}(?:\s*\([^)]+\))?){2,}(?:\s+y\s+\d{1,3}(?:\s*\([^)]+\))?)?)(?:\.|;|$|\s+[A-Z])/g;
  for (const match of context.matchAll(standaloneList)) {
    const numbers = match[1].match(/\d{1,3}/g) ?? [];
    if (numbers.length >= 3) numbers.forEach((n) => lines.push(`Línea ${n}`));
  }

  return lines;
}

function extractTrainAndSubwayLines(context: string): string[] {
  const lines: string[] = [];

  TRANSPORTATION_NAMES.forEach((name) => {
    const pattern = new RegExp(
      `(?:paro|sin servicio por paro).{0,30}${name}|${name}.{0,30}(?:paro|sin servicio por paro)`,
      "i"
    );
    if (pattern.test(context)) lines.push(name);
  });

  if (
    /(?:todas las l[íi]neas de subte|paro de subte|subte completo|todo el subte)/gi.test(
      context
    )
  ) {
    ["A", "B", "C", "D", "E", "H"].forEach((l) => lines.push(`Subte ${l}`));
  }

  for (const match of context.matchAll(
    /(?:subte|l[íi]nea)s?\s+([A-H](?:[,\sy]+[A-H])*)/gi
  )) {
    (match[1].match(/[A-H]/g) ?? []).forEach((l) =>
      lines.push(`Subte ${l}`)
    );
  }

  return lines;
}

export function extractAffectedLines(rawContent: string): string[] {
  const content = removeRelatedSections(rawContent);
  const context = extractStrikeContext(content);

  if (!context) return [];

  const lines = [
    ...extractBusLines(context),
    ...extractTrainAndSubwayLines(context),
  ];

  return Array.from(new Set(lines));
}
