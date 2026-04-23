import { NextResponse } from "next/server";
import { SECTORS, SectorConfig } from "@/lib/sectors";
import { SectorService } from "@/services/sector.service";
import { isTodayMentioned } from "@/lib/scraper/date-filter";
import { extractAffectedLines } from "@/lib/scraper/line-extractor";
import {
  fetchGoogleNewsLinks,
  fetchArticleText,
  buildGoogleNewsUrl,
  ArticleLink,
} from "@/lib/scraper/google-news";
import { SectorStatus } from "@/types/strike";

const MAX_ARTICLES_PER_SECTOR = 5;

interface QueryDebug {
  query: string;
  searchUrl: string;
  rawElementsFound: number;
  headlinesRejected: string[];
  linksAccepted: number;
}

interface ArticleDebug {
  url: string;
  title: string;
  sectorMatch: boolean;
  todayMentioned: boolean;
  linesFound: number;
}

interface SectorScrapeResult {
  status: SectorStatus;
  queriesDebug: QueryDebug[];
  articlesDebug: ArticleDebug[];
}

function deduplicateByUrl(links: ArticleLink[]): ArticleLink[] {
  return Array.from(new Map(links.map((l) => [l.url, l])).values());
}

async function collectLinksForSector(queries: string[]): Promise<{
  links: ArticleLink[];
  queriesDebug: QueryDebug[];
}> {
  const allLinks: ArticleLink[] = [];
  const queriesDebug: QueryDebug[] = [];

  for (const query of queries) {
    const result = await fetchGoogleNewsLinks(query);
    queriesDebug.push({
      query,
      searchUrl: buildGoogleNewsUrl(query),
      rawElementsFound: result.rawElementsFound,
      headlinesRejected: result.headlinesRejected,
      linksAccepted: result.links.length,
    });
    allLinks.push(...result.links);
  }

  return { links: deduplicateByUrl(allLinks), queriesDebug };
}

function articleMatchesSector(title: string, sectorKeywords: string[]): boolean {
  const lower = title.toLowerCase();
  return sectorKeywords.some((kw) => lower.includes(kw));
}

async function scrapeTransportSector(
  links: ArticleLink[],
  sectorKeywords: string[]
): Promise<{
  isStrikeActive: boolean;
  affectedLines: string[];
  headline?: string;
  articlesDebug: ArticleDebug[];
}> {
  const articlesDebug: ArticleDebug[] = [];
  let isStrikeActive = false;
  let allAffectedLines: string[] = [];
  let headline: string | undefined;

  for (const article of links.slice(0, MAX_ARTICLES_PER_SECTOR)) {
    const sectorMatch = articleMatchesSector(article.title, sectorKeywords);
    const todayMentioned = isTodayMentioned(article.title);

    if (!sectorMatch || !todayMentioned) {
      articlesDebug.push({ url: article.url, title: article.title, sectorMatch, todayMentioned, linesFound: 0 });
      continue;
    }

    isStrikeActive = true;
    headline = headline ?? article.title;

    let bodyText = article.snippet;
    try {
      const fetched = await fetchArticleText(article.url);
      if (fetched.length > bodyText.length) bodyText = fetched;
    } catch {
      // keep snippet as fallback
    }

    const lines = extractAffectedLines(bodyText);
    allAffectedLines = [...allAffectedLines, ...lines];
    articlesDebug.push({ url: article.url, title: article.title, sectorMatch, todayMentioned, linesFound: lines.length });
  }

  return {
    isStrikeActive,
    affectedLines: Array.from(new Set(allAffectedLines)),
    headline,
    articlesDebug,
  };
}

function scrapeGenericSector(
  links: ArticleLink[],
  sectorKeywords: string[]
): {
  isStrikeActive: boolean;
  headline?: string;
  articlesDebug: ArticleDebug[];
} {
  const articlesDebug: ArticleDebug[] = [];
  let isStrikeActive = false;
  let headline: string | undefined;

  for (const article of links.slice(0, MAX_ARTICLES_PER_SECTOR)) {
    const sectorMatch = articleMatchesSector(article.title, sectorKeywords);
    const todayMentioned = isTodayMentioned(article.title);

    articlesDebug.push({ url: article.url, title: article.title, sectorMatch, todayMentioned, linesFound: 0 });

    if (!sectorMatch || !todayMentioned) continue;

    isStrikeActive = true;
    headline = headline ?? article.title;
    break;
  }

  return { isStrikeActive, headline, articlesDebug };
}

async function scrapeSector(sector: SectorConfig): Promise<SectorScrapeResult> {
  const { links, queriesDebug } = await collectLinksForSector(sector.queries);

  const lastUpdate = new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour12: false,
  });

  if (["colectivo", "tren", "subte"].includes(sector.id)) {
    const result = await scrapeTransportSector(links, sector.sectorKeywords);
    return {
      status: {
        id: sector.id,
        isStrikeActive: result.isStrikeActive,
        affectedLines: result.affectedLines,
        headline: result.headline,
        lastUpdate,
      },
      queriesDebug,
      articlesDebug: result.articlesDebug,
    };
  }

  const result = scrapeGenericSector(links, sector.sectorKeywords);
  return {
    status: {
      id: sector.id,
      isStrikeActive: result.isStrikeActive,
      affectedLines: [],
      headline: result.headline,
      lastUpdate,
    },
    queriesDebug,
    articlesDebug: result.articlesDebug,
  };
}

export async function GET() {
  try {
    const results: SectorScrapeResult[] = [];

    for (const sector of SECTORS) {
      const result = await scrapeSector(sector);
      await SectorService.updateStatus(sector.id, result.status);
      results.push(result);
    }

    return NextResponse.json({
      sectors: results.map((r) => r.status),
      debug: results.map((r) => ({
        id: r.status.id,
        queries: r.queriesDebug,
        articles: r.articlesDebug,
      })),
    });
  } catch (error) {
    console.error("Scraper error:", error);
    return NextResponse.json(
      {
        error: "Error al verificar estados de paro",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
