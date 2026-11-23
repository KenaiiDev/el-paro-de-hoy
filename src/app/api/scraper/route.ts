import { NextRequest, NextResponse } from "next/server";
import { mapSettled } from "@/lib/concurrency";
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

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ARTICLES_PER_SECTOR = 5;
const SECTOR_CONCURRENCY = 3;

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

  const lastUpdate = new Date().toISOString();

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

type AuthResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Exige `Authorization: Bearer <CRON_SECRET>`. Es el mismo header que envía
 * Vercel Cron, así que sirve tanto para GitHub Actions como para Vercel.
 * En desarrollo, si no hay CRON_SECRET definido, se permite el acceso.
 */
function authorize(request: NextRequest): AuthResult {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, status: 500, error: "CRON_SECRET no configurado" };
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return { ok: false, status: 401, error: "No autorizado" };
  }

  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const includeDebug = request.nextUrl.searchParams.get("debug") === "1";

  const settled = await mapSettled(SECTORS, SECTOR_CONCURRENCY, async (sector) => {
    const result = await scrapeSector(sector);
    await SectorService.updateStatus(sector.id, result.status);
    return result;
  });

  const results: SectorScrapeResult[] = [];
  const errors: { id: string; error: string }[] = [];

  settled.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") {
      results.push(outcome.value);
    } else {
      const message =
        outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      console.error(`[scraper] Sector ${SECTORS[i].id} falló:`, message);
      errors.push({ id: SECTORS[i].id, error: message });
    }
  });

  if (results.length > 0) SectorService.invalidateCache();

  const body = {
    sectors: results.map((r) => r.status),
    errors,
    ...(includeDebug && {
      debug: results.map((r) => ({
        id: r.status.id,
        queries: r.queriesDebug,
        articles: r.articlesDebug,
      })),
    }),
  };

  // 207: algunos sectores fallaron; 500: fallaron todos.
  const status = errors.length === 0 ? 200 : results.length > 0 ? 207 : 500;
  return NextResponse.json(body, { status });
}
