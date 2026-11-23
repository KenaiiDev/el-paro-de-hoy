import { NextRequest, NextResponse } from "next/server";
import { mapSettled } from "@/lib/concurrency";
import { SECTORS, SectorConfig } from "@/lib/sectors";
import { SectorService } from "@/services/sector.service";
import { Verdict, bodyConfirmsSector, classifyHeadline } from "@/lib/scraper/classifier";
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

const MAX_ARTICLES_PER_SECTOR = 8;
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
  verdict: Verdict;
  reason: string;
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

async function fetchBody(article: ArticleLink): Promise<string> {
  const fetched = await fetchArticleText(article.url);
  return fetched.length > article.snippet.length ? fetched : article.snippet;
}

async function scrapeSector(sector: SectorConfig): Promise<SectorScrapeResult> {
  const { links, queriesDebug } = await collectLinksForSector(sector.queries);
  const isTransport = sector.kind !== "generic";

  const articlesDebug: ArticleDebug[] = [];
  const affectedLines = new Set<string>();
  let headline: string | undefined;

  for (const article of links.slice(0, MAX_ARTICLES_PER_SECTOR)) {
    const classification = classifyHeadline(article.title, sector);
    let { verdict, reason } = classification;
    let linesFound = 0;

    const needsBody =
      isTransport &&
      (verdict === "active" ||
        (verdict === "possible" &&
          classification.strength === "weak" &&
          classification.timing === "today"));

    if (needsBody) {
      const body = await fetchBody(article);

      if (verdict === "possible") {
        if (bodyConfirmsSector(body, sector)) {
          verdict = "active";
          reason = "paro de transporte hoy, confirmado en el cuerpo de la nota";
        }
      }

      if (verdict === "active") {
        const lines = extractAffectedLines(body, sector.kind);
        lines.forEach((l) => affectedLines.add(l));
        linesFound = lines.length;
      }
    }

    articlesDebug.push({ url: article.url, title: article.title, verdict, reason, linesFound });

    if (verdict === "active") {
      headline = headline ?? article.title;
      // Para sectores genéricos alcanza con una nota; en transporte seguimos juntando líneas.
      if (!isTransport) break;
    }
  }

  return {
    status: {
      id: sector.id,
      isStrikeActive: headline !== undefined,
      affectedLines: Array.from(affectedLines),
      headline,
      lastUpdate: new Date().toISOString(),
    },
    queriesDebug,
    articlesDebug,
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
