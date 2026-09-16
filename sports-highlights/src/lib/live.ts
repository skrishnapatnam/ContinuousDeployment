import { REGION_LIVE_GUIDES, LIVE_LEGAL_SUMMARY } from "./legal-live";
import { SPORT_ORDER, sourcesForSport } from "./sources";
import type { SportId } from "./types";
import { fetchChannelLive, type LiveStream } from "./youtube-live";

export type LiveResponse = {
  fetchedAt: string;
  live: LiveStream[];
  guides: typeof REGION_LIVE_GUIDES;
  principles: string[];
  note: string;
};

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

function resolveSport(value: string | null | undefined): SportId {
  if (value && (SPORT_ORDER as string[]).includes(value)) return value as SportId;
  return "all";
}

export async function getLive(options: {
  sport?: string | null;
}): Promise<LiveResponse> {
  const sport = resolveSport(options.sport);

  // Prefer primary league channels for live (skip clip aggregators).
  const skip = new Set(["house-of-highlights", "bleacher-report", "espn"]);
  const sources = sourcesForSport(sport).filter((s) => !skip.has(s.id));

  const results = await mapPool(sources, 4, (s) => fetchChannelLive(s));
  const live = results.filter((x): x is LiveStream => x !== null);

  const seen = new Set<string>();
  const unique = live.filter((l) => {
    if (seen.has(l.videoId)) return false;
    seen.add(l.videoId);
    return true;
  });

  return {
    fetchedAt: new Date().toISOString(),
    live: unique,
    guides: REGION_LIVE_GUIDES,
    principles: LIVE_LEGAL_SUMMARY,
    note:
      "Embeddable lives appear only when an official channel is broadcasting publicly. Paid exclusives must be watched on your country’s licensed platform.",
  };
}
