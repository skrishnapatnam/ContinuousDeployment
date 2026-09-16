import { XMLParser } from "fast-xml-parser";
import type { Highlight, HighlightSource } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

type AtomEntry = {
  id?: string;
  "yt:videoId"?: string;
  title?: string | { "#text"?: string };
  published?: string;
  updated?: string;
  summary?: string | { "#text"?: string };
  "media:group"?: {
    "media:description"?: string | { "#text"?: string };
    "media:thumbnail"?:
      | { "@_url"?: string }
      | Array<{ "@_url"?: string }>;
  };
};

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) {
    const t = (value as { "#text"?: unknown })["#text"];
    return typeof t === "string" ? t : "";
  }
  return "";
}

function thumbnailOf(entry: AtomEntry): string {
  const thumb = entry["media:group"]?.["media:thumbnail"];
  if (Array.isArray(thumb)) return thumb[0]?.["@_url"] ?? "";
  return thumb?.["@_url"] ?? "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function scoreTitle(title: string, keywords?: string[]): number {
  if (!keywords?.length) return 0;
  const lower = title.toLowerCase();
  return keywords.reduce((score, kw) => (lower.includes(kw.toLowerCase()) ? score + 1 : score), 0);
}

export async function fetchChannelHighlights(
  source: HighlightSource,
  limit = 12,
): Promise<Highlight[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`;
  const res = await fetch(url, {
    next: { revalidate: 900 },
    headers: {
      Accept: "application/atom+xml,application/xml,text/xml",
      "User-Agent": "PlayTape/1.0 (legal highlights aggregator; +https://localhost)",
    },
  });

  if (!res.ok) {
    console.warn(`YouTube RSS failed for ${source.id}: ${res.status}`);
    return [];
  }

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const feed = parsed?.feed;
  if (!feed) return [];

  const rawEntries: AtomEntry[] = Array.isArray(feed.entry)
    ? feed.entry
    : feed.entry
      ? [feed.entry]
      : [];

  const mapped = rawEntries
    .map((entry) => {
      const videoId = entry["yt:videoId"] ?? entry.id?.replace("yt:video:", "") ?? "";
      if (!videoId) return null;
      const title = decodeEntities(textOf(entry.title));
      const description = decodeEntities(
        textOf(entry["media:group"]?.["media:description"] ?? entry.summary),
      );
      const publishedAt = entry.published ?? entry.updated ?? new Date().toISOString();
      const thumbnail =
        thumbnailOf(entry) || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const highlight: Highlight & { _score: number } = {
        id: `${source.id}:${videoId}`,
        title,
        description,
        publishedAt,
        thumbnail,
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        sourceId: source.id,
        sourceName: source.name,
        sport: source.sport,
        _score: scoreTitle(title, source.preferKeywords),
      };
      return highlight;
    })
    .filter((h): h is Highlight & { _score: number } => h !== null);

  // Prefer keyword matches, then recency
  mapped.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });

  return mapped.slice(0, limit).map(({ _score: _, ...rest }) => rest);
}
