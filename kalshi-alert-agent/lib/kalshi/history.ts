import type { KalshiMarket, MoneySide } from "./types";

const KALSHI_API_BASE =
  process.env.KALSHI_API_BASE ??
  "https://api.elections.kalshi.com/trade-api/v2";

const HISTORY_CACHE_TTL_MS = Number(
  process.env.KALSHI_HISTORY_CACHE_MS ?? 10 * 60_000,
);
const MAX_HISTORY_PAGES = Number(process.env.KALSHI_HISTORY_PAGES ?? 8);

export type SeriesHistoryPoint = {
  eventTicker: string;
  expirationValue: number;
  result: "yes" | "no" | null;
  floorStrike: number | null;
  strikeType: string | null;
};

export type HistoricalWinEstimate = {
  seriesTicker: string;
  method: "expiration_value" | "series_result" | "insufficient";
  samples: number;
  wins: number;
  /** Empirical historical win rate for this side (0–1). */
  winRate: number;
  /** winRate as a percent (0–100). */
  winRatePct: number;
};

type CacheEntry = { expiresAt: number; points: SeriesHistoryPoint[] };
const historyCache = new Map<string, CacheEntry>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchKalshiJson(url: URL, attempt = 0): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "kalshi-money-watch/1.0",
    },
    cache: "no-store",
  });

  if (response.status === 429 && attempt < 6) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : 750 * 2 ** attempt;
    await sleep(waitMs);
    return fetchKalshiJson(url, attempt + 1);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Kalshi history request failed (${response.status}): ${body.slice(0, 240)}`,
    );
  }

  return response.json();
}

/** Series ticker is the leading segment of a Kalshi market ticker. */
export function seriesTickerFromMarket(market: KalshiMarket): string {
  return market.ticker.split("-")[0] ?? market.ticker;
}

/**
 * Load settled-market history for a series.
 * Prefers numeric expiration values (one per event) for empirical strike checks.
 */
export async function fetchSeriesHistory(
  seriesTicker: string,
): Promise<SeriesHistoryPoint[]> {
  const cached = historyCache.get(seriesTicker);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.points;
  }

  const byEvent = new Map<string, SeriesHistoryPoint>();
  let cursor: string | undefined;

  for (let page = 0; page < MAX_HISTORY_PAGES; page++) {
    const url = new URL(`${KALSHI_API_BASE}/markets`);
    url.searchParams.set("status", "settled");
    url.searchParams.set("series_ticker", seriesTicker);
    url.searchParams.set("limit", "200");
    url.searchParams.set("mve_filter", "exclude");
    if (cursor) url.searchParams.set("cursor", cursor);

    const data = (await fetchKalshiJson(url)) as {
      markets?: KalshiMarket[];
      cursor?: string;
    };

    const batch = data.markets ?? [];
    for (const market of batch) {
      const raw = market.expiration_value;
      if (raw == null || raw === "") continue;
      const expirationValue = Number(raw);
      if (!Number.isFinite(expirationValue)) continue;

      const eventTicker = market.event_ticker || market.ticker;
      const result =
        market.result === "yes" || market.result === "no"
          ? market.result
          : null;
      const floorStrike =
        market.floor_strike == null ? null : Number(market.floor_strike);

      // Keep one observation per event (settlement value is event-level).
      if (!byEvent.has(eventTicker)) {
        byEvent.set(eventTicker, {
          eventTicker,
          expirationValue,
          result,
          floorStrike: Number.isFinite(floorStrike) ? floorStrike : null,
          strikeType: market.strike_type ?? null,
        });
      }
    }

    cursor = data.cursor || undefined;
    if (!cursor || batch.length === 0) break;
    await sleep(100);
  }

  const points = [...byEvent.values()];
  historyCache.set(seriesTicker, {
    expiresAt: Date.now() + HISTORY_CACHE_TTL_MS,
    points,
  });
  return points;
}

function sideWinsOnValue(
  side: MoneySide,
  strikeType: string | null | undefined,
  floorStrike: number,
  value: number,
  capStrike: number | null = null,
): boolean {
  const type = (strikeType || "greater").toLowerCase();

  let yesWins: boolean;
  switch (type) {
    case "greater":
      yesWins = value > floorStrike;
      break;
    case "greater_or_equal":
      yesWins = value >= floorStrike;
      break;
    case "less":
      yesWins = value < floorStrike;
      break;
    case "less_or_equal":
      yesWins = value <= floorStrike;
      break;
    case "between":
      // Inclusive floor, exclusive cap is common for Kalshi temp brackets (e.g. 86–87).
      if (capStrike == null || !Number.isFinite(capStrike)) {
        yesWins = false;
      } else {
        yesWins = value >= floorStrike && value < capStrike;
      }
      break;
    default:
      // Unknown strike math — do not invent a win.
      yesWins = false;
      break;
  }

  return side === "YES" ? yesWins : !yesWins;
}

/**
 * Estimate historical win probability for buying `side` on this open market.
 * Uses past expiration values in the same series against this market's strike.
 */
export function estimateHistoricalWinRate(
  market: KalshiMarket,
  side: MoneySide,
  history: SeriesHistoryPoint[],
): HistoricalWinEstimate {
  const seriesTicker = seriesTickerFromMarket(market);
  const floorStrike =
    market.floor_strike == null ? null : Number(market.floor_strike);
  const capStrike =
    market.cap_strike == null ? null : Number(market.cap_strike);
  const strikeType = market.strike_type ?? null;

  if (
    floorStrike != null &&
    Number.isFinite(floorStrike) &&
    history.length > 0
  ) {
    let wins = 0;
    for (const point of history) {
      if (
        sideWinsOnValue(
          side,
          strikeType,
          floorStrike,
          point.expirationValue,
          Number.isFinite(capStrike as number) ? (capStrike as number) : null,
        )
      ) {
        wins += 1;
      }
    }
    const samples = history.length;
    const winRate = samples > 0 ? wins / samples : 0;
    return {
      seriesTicker,
      method: "expiration_value",
      samples,
      wins,
      winRate,
      winRatePct: Math.round(winRate * 1000) / 10,
    };
  }

  // Fallback: series-wide settlement frequency for this side.
  const results = history
    .map((p) => p.result)
    .filter((r): r is "yes" | "no" => r === "yes" || r === "no");
  if (results.length === 0) {
    return {
      seriesTicker,
      method: "insufficient",
      samples: 0,
      wins: 0,
      winRate: 0,
      winRatePct: 0,
    };
  }

  const wins = results.filter((r) =>
    side === "YES" ? r === "yes" : r === "no",
  ).length;
  const samples = results.length;
  const winRate = wins / samples;
  return {
    seriesTicker,
    method: "series_result",
    samples,
    wins,
    winRate,
    winRatePct: Math.round(winRate * 1000) / 10,
  };
}
