import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

const BLOCKED_HOSTS = [
  "x.com",
  "twitter.com",
  "mobile.twitter.com",
  "t.co",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "threads.net",
];

export type ExtractedArticle = {
  ok: boolean;
  title?: string;
  text?: string;
  reason?: string;
};

/**
 * Server-side fetch of a public article. Paywalls, login walls, and blocked
 * hosts return a reason instead of throwing, so one bad URL cannot fail a batch.
 */
export async function extractReadableArticle(rawUrl: string): Promise<ExtractedArticle> {
  let url: URL;
  try {
    url = new URL(normalizeUrl(rawUrl));
  } catch {
    return { ok: false, reason: "That does not look like a URL." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http and https links can be fetched." };
  }
  if (isPrivateHost(url.hostname)) {
    return { ok: false, reason: "The desk does not fetch private or local addresses." };
  }
  if (BLOCKED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return {
      ok: false,
      reason: "This site does not serve a stable article to a server fetch. Paste the text you can see.",
    };
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent":
          "TWIA-EditorialDesk/1.0 (newsletter research; +https://thisweekinai.club)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
      },
    });

    if (!response.ok) {
      const denied = response.status === 401 || response.status === 403 || response.status === 402;
      return {
        ok: false,
        reason: denied
          ? `The site returned ${response.status}. Paste the passage you can see.`
          : `The site returned ${response.status}. You can paste the text instead.`,
      };
    }

    const body = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const parsed = contentType.includes("text/plain")
      ? { title: titleFromUrl(url), text: body.trim() }
      : parseHtml(body, url.toString());

    const text = collapse(parsed.text).slice(0, 80_000);
    if (text.length < 400) {
      return {
        ok: false,
        title: parsed.title,
        text,
        reason: "The page returned almost no article text. That usually means a paywall or a script-only render. Paste the text.",
      };
    }

    return {
      ok: true,
      title: parsed.title || titleFromUrl(url),
      text,
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      ok: false,
      reason: timedOut
        ? "The fetch timed out. Paste the text if you still have the page open."
        : "The fetch failed. Paste the text instead.",
    };
  }
}

function parseHtml(html: string, url: string): { title?: string; text: string } {
  try {
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    if (article?.textContent && article.textContent.trim().length > 200) {
      return { title: article.title || undefined, text: article.textContent };
    }
  } catch {
    // Readability is strict about document shape. Cheerio is the fallback.
  }
  return cheerioArticle(html);
}

function cheerioArticle(html: string): { title?: string; text: string } {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, aside, iframe, form, svg").remove();
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").first().text().trim() ||
    undefined;
  const root = $("article").length ? $("article") : $("main").length ? $("main") : $("body");
  const paragraphs = root
    .find("p, h1, h2, li")
    .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
    .get()
    .filter((paragraph) => paragraph.length > 40);
  return { title, text: paragraphs.join("\n\n") };
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "::1") {
    return true;
  }
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    return true;
  }
  const match = /^172\.(\d+)\./.exec(host);
  if (match) {
    const octet = Number(match[1]);
    if (octet >= 16 && octet <= 31) return true;
  }
  return false;
}

function titleFromUrl(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

function collapse(value: string): string {
  return value.replace(/\n{3,}/g, "\n\n").trim();
}
