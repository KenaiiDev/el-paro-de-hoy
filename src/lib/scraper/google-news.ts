import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleDecoder } from "google-news-url-decoder";
import { isTodayInBuenosAires } from "@/lib/time";

export interface ArticleLink {
  url: string;
  title: string;
  snippet: string;
}

export interface FetchLinksResult {
  links: ArticleLink[];
  rawElementsFound: number;
  headlinesRejected: string[];
}

const RSS_TIMEOUT_MS = 8000;
const ARTICLE_TIMEOUT_MS = 8000;
const DECODE_TIMEOUT_MS = 8000;

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "es-AR,es;q=0.9",
};

const STRIKE_HEADLINE_KEYWORDS = [
  "paro",
  "huelga",
  "medida de fuerza",
  "sin servicio",
  "protesta",
  "movilización",
];

function headlineMentionsStrike(title: string): boolean {
  const lower = title.toLowerCase();
  return STRIKE_HEADLINE_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractTitleFromRssHeadline(headline: string): string {
  const lastDash = headline.lastIndexOf(" - ");
  return lastDash !== -1 ? headline.slice(0, lastDash) : headline;
}

function parseSnippetText(rawDescription: string): string {
  if (!rawDescription) return "";
  const $ = cheerio.load(rawDescription);
  return $("body").text().trim();
}

function isPublishedToday(pubDateStr: string): boolean {
  if (!pubDateStr) return true;
  const pub = new Date(pubDateStr);
  if (Number.isNaN(pub.getTime())) return true;
  return isTodayInBuenosAires(pub.toISOString());
}

export function buildGoogleNewsUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=AR&ceid=AR:es-419`;
}

export async function fetchGoogleNewsLinks(
  query: string
): Promise<FetchLinksResult> {
  const url = buildGoogleNewsUrl(query);
  const { data } = await axios.get(url, {
    headers: REQUEST_HEADERS,
    timeout: RSS_TIMEOUT_MS,
  });

  const $ = cheerio.load(data, { xmlMode: true });
  const items = $("item");
  const rawElementsFound = items.length;

  const links: ArticleLink[] = [];
  const headlinesRejected: string[] = [];

  items.each((_, el) => {
    const rawHeadline = $(el).find("title").first().text().trim();
    const title = extractTitleFromRssHeadline(rawHeadline);
    const pubDate = $(el).find("pubDate").text().trim();
    const rawDescription = $(el).find("description").text().trim();
    const snippet = parseSnippetText(rawDescription);

    const articleUrl =
      $(el).find("link").text().trim() ||
      $(el).find("guid").text().trim();

    if (!articleUrl || !isPublishedToday(pubDate)) return;

    if (!headlineMentionsStrike(title)) {
      if (title.length > 0) headlinesRejected.push(rawHeadline);
      return;
    }

    links.push({ url: articleUrl, title, snippet });
  });

  return { links, rawElementsFound, headlinesRejected };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function resolveRealUrl(googleNewsUrl: string): Promise<string | null> {
  try {
    const decoder = new GoogleDecoder();
    const result = await withTimeout(decoder.decode(googleNewsUrl), DECODE_TIMEOUT_MS);
    return result.status && result.decoded_url ? result.decoded_url : null;
  } catch {
    return null;
  }
}

/**
 * Devuelve el texto plano del artículo original, o "" si no se pudo obtener.
 * Nunca lanza: el llamador usa el snippet del RSS como respaldo.
 */
export async function fetchArticleText(googleNewsUrl: string): Promise<string> {
  const realUrl = await resolveRealUrl(googleNewsUrl);
  if (!realUrl) return "";

  try {
    const { data } = await axios.get(realUrl, {
      headers: REQUEST_HEADERS,
      timeout: ARTICLE_TIMEOUT_MS,
      maxRedirects: 5,
    });

    const $ = cheerio.load(data);
    $("script, style, nav, header, footer, aside").remove();
    return $("body").text().replace(/\s+/g, " ").trim();
  } catch (error) {
    console.warn(
      `[fetchArticleText] ${realUrl}:`,
      error instanceof Error ? error.message : error
    );
    return "";
  }
}
