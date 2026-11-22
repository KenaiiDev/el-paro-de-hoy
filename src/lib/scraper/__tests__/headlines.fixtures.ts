import type { Verdict } from "@/lib/scraper/classifier";
import type { SectorId } from "@/types/strike";

/** "Hoy" para todos los casos: jueves 26/11/2026, 12:00 en Buenos Aires. */
export const FIXTURE_NOW = new Date("2026-11-26T15:00:00Z");

export interface HeadlineFixture {
  title: string;
  /** Veredicto esperado por sector. Los sectores no listados no deben quedar "active". */
  expected: Partial<Record<SectorId, Verdict>>;
}

export const HEADLINE_FIXTURES: HeadlineFixture[] = [
  // --- Paros activos hoy ---------------------------------------------------
  { title: "Paro de colectivos hoy: qué líneas no funcionan en el AMBA", expected: { colectivo: "active" } },
  { title: "Paro de trenes hoy jueves 26 de noviembre: cómo funcionan las líneas", expected: { tren: "active" } },
  { title: "Paro de subte hoy: las líneas afectadas y los horarios", expected: { subte: "active" } },
  { title: "Colectivos: paro total hoy en el conurbano por falta de pago de salarios", expected: { colectivo: "active" } },
  { title: "UTA: paro de colectivos este jueves en el AMBA", expected: { colectivo: "active" } },
  { title: "Paro de La Fraternidad hoy: no hay trenes en todo el país", expected: { tren: "active" } },
  { title: "Metrodelegados realizan un paro hoy en las líneas B y D del subte", expected: { subte: "active" } },
  { title: "Paro de colectivos y trenes hoy: cómo viajar en el AMBA", expected: { colectivo: "active", tren: "active" } },
  { title: "Paro docente hoy en la provincia de Buenos Aires: no hay clases en las escuelas", expected: { education: "active" } },
  { title: "SUTEBA para hoy: las escuelas sin clases", expected: { education: "active" } },
  { title: "Paro de médicos residentes hoy en los hospitales porteños", expected: { health: "active" } },
  { title: "Paro de enfermeros en el Hospital Garrahan este jueves", expected: { health: "active" } },
  { title: "ATE realiza un paro nacional de estatales hoy", expected: { "public-admin": "active" } },
  { title: "Paro bancario hoy: los bancos no abren sus puertas", expected: { banking: "active" } },
  { title: "La Bancaria confirmó un paro para hoy en todo el país", expected: { banking: "active" } },
  { title: "Paro de recolectores hoy: no pasa la basura en la Ciudad", expected: { logistics: "active" } },
  { title: "Paro judicial hoy: los tribunales sin atención", expected: { justice: "active" } },
  { title: "Paro de pilotos hoy: Aerolíneas Argentinas cancela vuelos en Aeroparque", expected: { aeronautic: "active" } },
  { title: "Controladores aéreos realizan medidas de fuerza hoy en Ezeiza", expected: { aeronautic: "active" } },
  { title: "Huelga de maquinistas: el tren Sarmiento sin servicio hoy", expected: { tren: "active" } },
  { title: "Trabajo a reglamento en el Roca: demoras y cancelaciones en el tren esta mañana", expected: { tren: "active" } },
  { title: "Paro universitario hoy: la UBA sin clases", expected: { education: "active" } },
  { title: "En vivo: paro de colectivos, minuto a minuto", expected: { colectivo: "active" } },
  { title: "Paro de colectivos 26 de noviembre: qué líneas adhieren", expected: { colectivo: "active" } },
  { title: "Paro de subte: asambleas en la línea C esta mañana", expected: { subte: "active" } },

  // --- Paros anunciados ----------------------------------------------------
  { title: "UTA anunció un paro de colectivos para mañana en el AMBA", expected: { colectivo: "announced" } },
  { title: "Paro de trenes el próximo lunes: qué dijo La Fraternidad", expected: { tren: "announced" } },
  { title: "Paro docente el 2 de diciembre en la provincia", expected: { education: "announced" } },
  { title: "Bancarios convocan a un paro nacional", expected: { banking: "announced" } },
  { title: "Paro de colectivos mañana viernes: qué líneas no funcionarán", expected: { colectivo: "announced" } },
  { title: "Amenazan con un paro de subte si no hay aumento salarial", expected: { subte: "announced" } },
  { title: "Paro de trenes: La Fraternidad anunció medidas de fuerza para la semana que viene", expected: { tren: "announced" } },
  { title: "Hoy anuncian paro de colectivos para el lunes", expected: { colectivo: "announced" } },
  { title: "Paro de colectivos mañana: qué pasa hoy con las líneas", expected: { colectivo: "announced" } },

  // --- Paros levantados ----------------------------------------------------
  { title: "Levantaron el paro de colectivos: el servicio funciona con normalidad", expected: { colectivo: "lifted" } },
  { title: "Conciliación obligatoria: se levantó el paro de trenes previsto para hoy", expected: { tren: "lifted" } },
  { title: "La UTA suspendió el paro de colectivos tras un acuerdo salarial", expected: { colectivo: "lifted" } },
  { title: "No habrá paro de subte este jueves", expected: { subte: "lifted" } },
  { title: "Docentes postergan el paro previsto para hoy", expected: { education: "lifted" } },
  { title: "Pese a la conciliación obligatoria, hay paro de colectivos hoy", expected: { colectivo: "active" } },

  // --- El sector no está afectado ------------------------------------------
  { title: "Paro general: los colectivos funcionan con normalidad", expected: { colectivo: "not-affected" } },
  { title: "Paro de la CGT hoy: la UTA no adhiere y hay colectivos", expected: { colectivo: "not-affected" } },
  { title: "Paro de trenes hoy: qué pasa con los colectivos", expected: { tren: "active" } },
  { title: "Paro docente hoy: cómo funcionan los colectivos", expected: { education: "active" } },

  // --- Paros pasados -------------------------------------------------------
  { title: "El paro de colectivos de ayer dejó a miles sin poder viajar", expected: { colectivo: "past" } },
  { title: "Tras el paro de trenes, el servicio se normalizó", expected: { tren: "past" } },

  // --- Sin referencia temporal ---------------------------------------------
  { title: "Paro de colectivos: qué líneas no funcionan", expected: { colectivo: "possible" } },
  { title: "Paro de transporte hoy en el AMBA", expected: { colectivo: "possible", tren: "possible", subte: "possible" } },

  // --- Falsos positivos de substring ---------------------------------------
  { title: "Amparo judicial frena el aumento del boleto de colectivo hoy", expected: {} },
  { title: "Disparo en una estación de tren: detienen a un sospechoso hoy", expected: {} },
  { title: "Debate hoy en el Congreso por el presupuesto universitario", expected: {} },
  { title: "Ruta 2: demoras hoy por el operativo de verano", expected: {} },
  { title: "El Banco Central mantuvo hoy la tasa de interés", expected: {} },
  { title: "Reparo en la Justicia por la nueva ley de alquileres", expected: {} },

  // --- Interrupciones que no son paros -------------------------------------
  { title: "Tren Sarmiento sin servicio hoy por obras de renovación", expected: {} },
  { title: "Subte: la línea A sin servicio hoy por una falla técnica", expected: {} },
  { title: "Temporal: no hay clases hoy en varias escuelas del conurbano", expected: {} },
  { title: "Feriado: no hay bancos hoy jueves", expected: {} },

  // --- El sector aparece pero el paro es de otro --------------------------
  { title: "Paro bancario hoy: cómo pagar con tarjeta en colectivos y trenes", expected: { banking: "active" } },
  { title: "Paro de estatales hoy: marcha al Ministerio de Economía", expected: { "public-admin": "active" } },
  { title: "Paro de camioneros: preocupación en los hospitales por la falta de insumos", expected: { logistics: "possible" } },

  // --- Titulares en forma de pregunta -------------------------------------
  { title: "¿Hay paro de colectivos hoy, jueves 26 de noviembre?", expected: { colectivo: "possible" } },
  { title: "Paro de colectivos hoy: ¿qué líneas funcionan?", expected: { colectivo: "active" } },

  // --- Otras jurisdicciones (sectores con alcance AMBA) --------------------
  { title: "Paro de colectivos en Córdoba hoy: no hay servicio urbano", expected: { colectivo: "irrelevant" } },
  { title: "Paro docente en Santa Fe hoy: sin clases en las escuelas", expected: { education: "irrelevant" } },
  { title: "Paro de colectivos en Rosario y el AMBA hoy", expected: { colectivo: "active" } },
  { title: "Paro de colectivos hoy: desvíos en Av. Córdoba y Corrientes", expected: { colectivo: "active" } },
  { title: "Paro de pilotos en Córdoba hoy: vuelos demorados", expected: { aeronautic: "active" } },

  // --- Varias líneas mencionadas -------------------------------------------
  {
    title: "Paro de colectivos: la UTA confirmó que hoy no hay servicio en 30 líneas",
    expected: { colectivo: "active", tren: "irrelevant", subte: "irrelevant" },
  },
  { title: "Los trenes vuelven a funcionar tras el paro", expected: { tren: "past" } },

  // --- Noticias sin paro ---------------------------------------------------
  { title: "Aumenta el boleto de colectivo desde diciembre", expected: {} },
  { title: "Así funcionará el nuevo tren a Mar del Plata", expected: {} },
  { title: "Las escuelas porteñas tendrán clases hasta el 19 de diciembre", expected: {} },
  { title: "El estado de las rutas hoy: cómo viajar a la costa", expected: {} },
];
