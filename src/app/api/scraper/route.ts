/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { StrikeService } from "@/services/strike.service";

const transportationNames = [
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
];

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

function isTodayMentioned(content: string): boolean {
  const now = new Date();
  const today = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }),
  );

  const dayOfWeek = DIAS_SEMANA[today.getDay()];
  const dayNumber = today.getDate();
  const monthName = MESES[today.getMonth()];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayOfWeek = DIAS_SEMANA[tomorrow.getDay()];
  const tomorrowDayNumber = tomorrow.getDate();
  const tomorrowMonthName = MESES[tomorrow.getMonth()];

  const lowerContent = content.toLowerCase();

  const todayPatterns = [
    "hoy",
    "este " + dayOfWeek,
    dayOfWeek + " " + dayNumber,
    dayNumber + " de " + monthName,
  ];

  const notTodayPatterns = [
    "mañana",
    "próximo",
    "siguiente",
    "anunciado para",
    "será el",
    "el " + tomorrowDayOfWeek,
    "este " + tomorrowDayOfWeek,
    tomorrowDayOfWeek + " " + tomorrowDayNumber,
    tomorrowDayNumber + " de " + tomorrowMonthName,
  ];

  const otherDays = DIAS_SEMANA.filter((day) => day !== dayOfWeek);
  otherDays.forEach((day) => {
    if (
      lowerContent.includes("el " + day) ||
      lowerContent.includes("este " + day)
    ) {
      notTodayPatterns.push(day);
    }
  });

  if (notTodayPatterns.some((pattern) => lowerContent.includes(pattern))) {
    return false;
  }

  return todayPatterns.some((pattern) => lowerContent.includes(pattern));
}

function extractAffectedLines(
  content: string,
  html: string,
  mustMentionToday = false,
): string[] {
  const affected: string[] = [];

  if (mustMentionToday) {
    const todayMentioned =
      /hoy|este\s+(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i.test(
        content,
      );
    if (!todayMentioned) {
      return [];
    }

    const relatedSectionPatterns = [
      /artículos relacionados.{0,2000}/gi,
      /te puede interesar.{0,2000}/gi,
      /más noticias.{0,2000}/gi,
      /notas relacionadas.{0,2000}/gi,
      /leé también.{0,2000}/gi,
    ];

    let filteredContent = content;
    relatedSectionPatterns.forEach((pattern) => {
      filteredContent = filteredContent.replace(pattern, "");
    });

    content = filteredContent;
  }

  const strikeContextRegex =
    /(?:paro|sin servicio|afecta|no funcionan?|suspendido|cerrado).{0,600}/gi;
  const strikeBlocks = content.match(strikeContextRegex) || [];
  const strikeContext = strikeBlocks.join(" ");

  if (!strikeContext) {
    return [];
  }

  const busRegexCap = /Línea\s+(\d{1,3})\b/g;
  let match;
  for (match of strikeContext.matchAll(busRegexCap)) {
    affected.push(`Línea ${match[1]}`);
  }

  const busRegexLow = /l[íi]nea\s+(\d{1,3})\b/gi;
  for (match of strikeContext.matchAll(busRegexLow)) {
    affected.push(`Línea ${match[1]}`);
  }

  const listRegex =
    /l[íi]neas?\s+(\d{1,3}(?:\s*,\s*\d{1,3})+(?:\s+y\s+\d{1,3})?)/gi;
  for (match of strikeContext.matchAll(listRegex)) {
    const numbers = match[1].match(/\d{1,3}/g) || [];
    numbers.forEach((num) => affected.push(`Línea ${num}`));
  }

  const standaloneListRegex =
    /\b(\d{1,3}(?:\s*\([^)]+\))?(?:\s*[,\-]\s*\d{1,3}(?:\s*\([^)]+\))?){2,}(?:\s+y\s+\d{1,3}(?:\s*\([^)]+\))?)?)(?:\.|;|$|\s+[A-Z])/g;
  for (match of strikeContext.matchAll(standaloneListRegex)) {
    const numbers = match[1].match(/\d{1,3}/g) || [];
    if (numbers.length >= 3) {
      numbers.forEach((num) => affected.push(`Línea ${num}`));
    }
  }

  transportationNames.forEach((name) => {
    const nameRegex = new RegExp(
      `(?:paro|sin servicio por paro).{0,30}${name}|${name}.{0,30}(?:paro|sin servicio por paro)`,
      "i",
    );
    const match = strikeContext.match(nameRegex);
    if (match) {
      affected.push(name);
    }
  });

  const subteLetterRegex = /(?:subte|l[íi]nea)s?\s+([A-H](?:[,\sy]+[A-H])*)/gi;
  for (match of strikeContext.matchAll(subteLetterRegex)) {
    const letters = match[1].match(/[A-H]/g) || [];
    letters.forEach((letter) => affected.push(`Subte ${letter}`));
  }

  return Array.from(new Set(affected));
}

export async function GET() {
  try {
    const searchUrl = `https://www.google.com/search?q=paro+transporte+hoy+amba+trenes+colectivos+subte&tbs=qdr:h6&tbm=nws`;

    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-AR,es;q=0.9",
      },
    });

    const $ = cheerio.load(data);
    const articleLinks = $("a.WlydOe");
    const articlesToScrape: { url: string; headline: string }[] = [];

    articleLinks.each((_, element) => {
      const link = $(element).attr("href");
      const headline = $(element).text();

      if (headline.toLowerCase().includes("paro") && link) {
        const articleUrl = link.startsWith("/url?q=")
          ? decodeURIComponent(link.split("/url?q=")[1].split("&")[0])
          : link;
        articlesToScrape.push({ url: articleUrl, headline });
      }
    });

    let isStrikeActive = false;
    let affectedLines: string[] = [];
    let mainHeadline = "No se encontraron noticias sobre paros";

    for (const article of articlesToScrape.slice(0, 5)) {
      try {
        const { data: articleData } = await axios.get(article.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "es-AR,es;q=0.9",
          },
          timeout: 5000,
        });

        const $article = cheerio.load(articleData);
        const articleContent = $article("body").text();
        const mentionsToday = isTodayMentioned(articleContent);

        if (mentionsToday) {
          isStrikeActive = true;
          if (
            !mainHeadline ||
            mainHeadline === "No se encontraron noticias sobre paros"
          ) {
            mainHeadline = article.headline;
          }

          const linesFound = extractAffectedLines(
            articleContent,
            articleData,
            true,
          );
          if (linesFound.length > 0) {
            affectedLines = [...affectedLines, ...linesFound];
          }
        }
      } catch (error) {
        continue;
      }
    }

    affectedLines = Array.from(new Set(affectedLines));

    const newStatus = {
      isStrikeActive,
      affectedLines,
      lastUpdate: new Date().toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      }),
      headline: mainHeadline,
    };

    await StrikeService.updateStatus(newStatus);
    return NextResponse.json(newStatus);
  } catch (error) {
    console.error("Scraper error:", error);
    return NextResponse.json(
      {
        error: "Error al verificar estado del transporte",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
