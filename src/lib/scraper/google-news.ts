import axios from "axios";
import * as cheerio from "cheerio";
import { getBuenosAiresDate } from "./date-filter";

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
  const today = getBuenosAiresDate();
  try {
    const pub = new Date(pubDateStr);
    const pubBsAs = new Date(
      pub.toLocaleString("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
      })
    );
    return pubBsAs.toDateString() === today.toDateString();
  } catch {
    return true;
  }
}

export function buildGoogleNewsUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=AR&ceid=AR:es-419`;
}

export async function fetchGoogleNewsLinks(
  query: string
): Promise<FetchLinksResult> {
  const url = buildGoogleNewsUrl(query);
  const { data } = await axios.get(url, { headers: REQUEST_HEADERS });

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

import { GoogleDecoder } from "google-news-url-decoder";

export async function fetchArticleText(googleNewsUrl: string): Promise<string> {
  console.log("-----------------------------------------");
  console.log("[fetchArticleText] Starting fetch for:", googleNewsUrl);
  try {
    // 1. Decode the Google News URL to get the real source URL
    let realUrl = googleNewsUrl;
    try {
      const decoder = new GoogleDecoder();
      const decodedResult = await decoder.decode(googleNewsUrl);
      if (decodedResult.status && decodedResult.decoded_url) {
        realUrl = decodedResult.decoded_url;
        console.log("[fetchArticleText] Decoded real URL:", realUrl);
      } else {
        console.warn("[fetchArticleText] Decoder returned false status.");
      }
    } catch (e) {
      console.warn("[fetchArticleText] Failed to decode URL:", e);
    }

    if (realUrl === googleNewsUrl || !realUrl) {
      console.log("[fetchArticleText] Failed to resolve real URL.");
      return "";
    }

    // 2. Fetch the real article
    console.log("[fetchArticleText] Fetching real article at:", realUrl);
    const { data: articleData } = await axios.get(realUrl, {
      headers: REQUEST_HEADERS,
      timeout: 8000,
      maxRedirects: 5,
    });

    // 3. Extract the text
    const $ = cheerio.load(articleData);
    $("script, style, nav, header, footer, aside").remove();
    const cleanText = $("body").text().replace(/\s+/g, " ").trim();
    
    console.log("[fetchArticleText] Extracted text length:", cleanText.length);
    if (cleanText.length < 500) {
      console.log("[fetchArticleText] Extracted text preview:", cleanText);
    }
    return cleanText;
  } catch (error) {
    console.error("[fetchArticleText] Error:", error instanceof Error ? error.message : "Unknown error");
    return "";
  }
}
