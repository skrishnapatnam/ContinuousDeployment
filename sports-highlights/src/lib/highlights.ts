import { SOURCES, SPORT_LABELS, SPORT_ORDER, sourcesForSport } from "./sources";
import type { Highlight, HighlightsResponse, SportId } from "./types";
import { fetchChannelHighlights } from "./youtube-rss";

const SCOREBAT_FREE =
  "https://www.scorebat.com/video-api/v3/free-feed/";

function isSportId(value: string | null): value is SportId {
  return !!value && (SPORT_ORDER as string[]).includes(value);
}

function parseScoreBatEmbed(embedHtml: string): string | null {
  const match = embedHtml.match(/src=['"]([^'"]+)['"]/i);
  return match?.[1] ?? null;
}

/** Optional ScoreBat free feed when SCOREBAT_TOKEN is configured. */
async function fetchScoreBatSoccer(): Promise<Highlight[]> {
  const token = process.env.SCOREBAT_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(`${SCOREBAT_FREE}?token=${encodeURIComponent(token)}`, {
      next: { revalidate: 900 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      title?: string;
      date?: string;
      thumbnail?: string;
      competition?: string;
      videos?: Array<{ id?: string; title?: string; embed?: string }>;
    }>;

    const highlights: Highlight[] = [];
    for (const match of data) {
      for (const video of match.videos ?? []) {
        const embedSrc = video.embed ? parseScoreBatEmbed(video.embed) : null;
        if (!embedSrc || !video.id) continue;
        highlights.push({
          id: `scorebat:${video.id}`,
          title: `${match.title ?? "Match"} — ${video.title ?? "Highlights"}`,
          description: match.competition ?? "Football highlights via ScoreBat",
          publishedAt: match.date ?? new Date().toISOString(),
          thumbnail: match.thumbnail ?? "",
          videoId: video.id,
          embedUrl: embedSrc,
          watchUrl: embedSrc,
          sourceId: "scorebat",
          sourceName: "ScoreBat",
          sport: "soccer",
        });
      }
    }
    return highlights;
  } catch (err) {
    console.warn("ScoreBat fetch failed", err);
    return [];
  }
}

export async function getHighlights(options: {
  sport?: string | null;
  q?: string | null;
  limit?: number;
}): Promise<HighlightsResponse> {
  const sport: SportId = isSportId(options.sport ?? null)
    ? (options.sport as SportId)
    : "all";
  const q = (options.q ?? "").trim().toLowerCase();
  const perSource = sport === "all" ? 6 : 14;
  const limit = Math.min(Math.max(options.limit ?? 72, 12), 120);

  const sources = sourcesForSport(sport);
  const batches = await Promise.all(
    sources.map((source) => fetchChannelHighlights(source, perSource)),
  );

  let highlights = batches.flat();

  if (sport === "all" || sport === "soccer") {
    const scorebat = await fetchScoreBatSoccer();
    highlights = highlights.concat(scorebat);
  }

  // Dedupe by videoId
  const seen = new Set<string>();
  highlights = highlights.filter((h) => {
    const key = h.videoId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (q) {
    highlights = highlights.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        h.sourceName.toLowerCase().includes(q) ||
        h.sport.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q),
    );
  }

  highlights.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  highlights = highlights.slice(0, limit);

  const counts = new Map<SportId, number>();
  for (const h of highlights) {
    counts.set(h.sport, (counts.get(h.sport) ?? 0) + 1);
  }

  const sports = SPORT_ORDER.map((id) => ({
    id,
    label: SPORT_LABELS[id],
    count: id === "all" ? highlights.length : (counts.get(id) ?? 0),
  }));

  const sourceMeta = [
    ...SOURCES.map((s) => ({ id: s.id, name: s.name, sport: s.sport })),
    ...(process.env.SCOREBAT_TOKEN
      ? [{ id: "scorebat", name: "ScoreBat", sport: "soccer" }]
      : []),
  ];

  return {
    fetchedAt: new Date().toISOString(),
    count: highlights.length,
    highlights,
    sports,
    sources: sourceMeta,
  };
}
