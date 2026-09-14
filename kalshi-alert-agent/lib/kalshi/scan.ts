import {
  estimateHistoricalWinRate,
  fetchSeriesHistory,
  seriesTickerFromMarket,
  type HistoricalWinEstimate,
} from "./history";
import type {
  KalshiMarket,
  MoneyOpportunity,
  MoneySide,
  ScanOptions,
  ScanResult,
} from "./types";

const KALSHI_API_BASE =
  process.env.KALSHI_API_BASE ??
  "https://api.elections.kalshi.com/trade-api/v2";

const CACHE_TTL_MS = Number(process.env.KALSHI_SCAN_CACHE_MS ?? 90_000);

/** Default: profit must be at least 2× the ask/cost. */
export const DEFAULT_MIN_ROI_MULTIPLE = 2;
/** Default: require historical win rate strictly above 75%. */
export const DEFAULT_MIN_HISTORICAL_WIN_RATE = 0.75;
/** Default minimum settled history samples. */
export const DEFAULT_MIN_HISTORICAL_SAMPLES = 30;

type CacheEntry = { expiresAt: number; result: ScanResult };
const scanCache = new Map<string, CacheEntry>();

function dollars(value: string | undefined | null): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Max ask that still yields at least `minRoiMultiple`× profit on cost.
 * (1 - ask) / ask >= m  ⇒  ask <= 1 / (1 + m)
 */
export function maxAskForRoiMultiple(minRoiMultiple: number): number {
  if (minRoiMultiple <= 0) return 0.99;
  return 1 / (1 + minRoiMultiple);
}

async function fetchKalshiJson(url: URL, attempt = 0): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "kalshi-money-watch/1.0",
    },
    cache: "no-store",
  });

  if (response.status === 429 && attempt < 5) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : 500 * 2 ** attempt;
    await sleep(waitMs);
    return fetchKalshiJson(url, attempt + 1);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Kalshi markets request failed (${response.status}): ${body.slice(0, 240)}`,
    );
  }

  return response.json();
}

function titleFor(market: KalshiMarket): string {
  return (
    market.title?.trim() ||
    market.yes_sub_title?.trim() ||
    market.subtitle?.trim() ||
    market.ticker
  );
}

const seriesTitleCache = new Map<string, { expiresAt: number; title: string }>();

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Kalshi UI routes are event pages, not bare market tickers:
 * `/markets/{series}/{series-slug}/{event_ticker}?op_market_ticker={market}`
 */
export function kalshiMarketUrl(
  market: KalshiMarket,
  seriesTitle?: string | null,
): string {
  const series = seriesTickerFromMarket(market).toLowerCase();
  const event = (market.event_ticker || market.ticker).toLowerCase();
  const slug = seriesTitle?.trim()
    ? slugifyTitle(seriesTitle)
    : series;
  const path = `https://kalshi.com/markets/${series}/${slug}/${event}`;
  return `${path}?op_market_ticker=${encodeURIComponent(market.ticker)}`;
}

async function fetchSeriesTitle(seriesTicker: string): Promise<string | null> {
  const cached = seriesTitleCache.get(seriesTicker);
  if (cached && cached.expiresAt > Date.now()) return cached.title;

  try {
    const url = new URL(`${KALSHI_API_BASE}/series/${seriesTicker}`);
    const json = (await fetchKalshiJson(url)) as {
      series?: { title?: string };
    };
    const title = json.series?.title?.trim() || null;
    if (title) {
      seriesTitleCache.set(seriesTicker, {
        expiresAt: Date.now() + Math.max(CACHE_TTL_MS, 600_000),
        title,
      });
    }
    return title;
  } catch {
    return null;
  }
}

/** Score favors max profit multiple among sides that clear the history floor. */
export function moneyScore(
  historicalWinRate: number,
  ask: number,
  profitIfWin: number,
): number {
  if (historicalWinRate <= 0 || ask <= 0 || ask >= 1 || profitIfWin <= 0) {
    return 0;
  }
  const roiMultiple = profitIfWin / ask;
  return roiMultiple * 1000 * historicalWinRate;
}

type Candidate = {
  market: KalshiMarket;
  side: MoneySide;
  ask: number;
  bid: number;
  profitIfWin: number;
  roiMultiple: number;
};

function candidateFromSide(
  market: KalshiMarket,
  side: MoneySide,
  ask: number,
  bid: number,
): Candidate | null {
  if (ask <= 0 || ask >= 1) return null;
  const profitIfWin = 1 - ask;
  if (profitIfWin <= 0) return null;
  return {
    market,
    side,
    ask,
    bid,
    profitIfWin,
    roiMultiple: profitIfWin / ask,
  };
}

export async function fetchOpenMarkets(
  maxMarkets = 2000,
): Promise<KalshiMarket[]> {
  const markets: KalshiMarket[] = [];
  let cursor: string | undefined;

  while (markets.length < maxMarkets) {
    const pageLimit = Math.min(200, maxMarkets - markets.length);
    const url = new URL(`${KALSHI_API_BASE}/markets`);
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", String(pageLimit));
    url.searchParams.set("mve_filter", "exclude");
    if (cursor) url.searchParams.set("cursor", cursor);

    const data = (await fetchKalshiJson(url)) as {
      markets?: KalshiMarket[];
      cursor?: string;
    };

    const batch = data.markets ?? [];
    markets.push(...batch);
    cursor = data.cursor || undefined;
    if (!cursor || batch.length === 0) break;
    await sleep(75);
  }

  return markets;
}

export function resolveScanParams(options: ScanOptions = {}) {
  const minRoiMultiple = options.minRoiMultiple ?? DEFAULT_MIN_ROI_MULTIPLE;
  const minHistoricalWinRate =
    options.minHistoricalWinRate ?? DEFAULT_MIN_HISTORICAL_WIN_RATE;
  const minHistoricalSamples =
    options.minHistoricalSamples ?? DEFAULT_MIN_HISTORICAL_SAMPLES;
  const derivedMaxAsk = maxAskForRoiMultiple(minRoiMultiple);
  const requestedMaxAsk = options.maxAsk ?? derivedMaxAsk;
  const maxAsk = Math.min(requestedMaxAsk, derivedMaxAsk);
  const minProbability = options.minProbability ?? 0;
  const minVolume24h = options.minVolume24h ?? 10;
  const maxMarkets = options.maxMarkets ?? 3000;
  const limit = options.limit ?? 15;
  const query = options.query?.trim() || null;

  return {
    minRoiMultiple,
    minHistoricalWinRate,
    minHistoricalSamples,
    minProbability,
    maxAsk,
    minVolume24h,
    maxMarkets,
    limit,
    query,
  };
}

export function collectRoiCandidates(
  markets: KalshiMarket[],
  options: ScanOptions = {},
): Candidate[] {
  const { minRoiMultiple, minProbability, maxAsk, minVolume24h, query } =
    resolveScanParams(options);

  const candidates: Candidate[] = [];

  for (const market of markets) {
    if (query) {
      const haystack = `${market.ticker} ${titleFor(market)}`.toLowerCase();
      if (!haystack.includes(query)) continue;
    }

    const volume24h = dollars(market.volume_24h_fp);
    const liquidity = dollars(market.liquidity_dollars);
    if (volume24h < minVolume24h && liquidity < minVolume24h) continue;

    const sides: Array<{ side: MoneySide; ask: number; bid: number }> = [
      {
        side: "YES",
        ask: dollars(market.yes_ask_dollars),
        bid: dollars(market.yes_bid_dollars),
      },
      {
        side: "NO",
        ask: dollars(market.no_ask_dollars),
        bid: dollars(market.no_bid_dollars),
      },
    ];

    for (const { side, ask, bid } of sides) {
      if (ask < minProbability || ask > maxAsk) continue;
      const candidate = candidateFromSide(market, side, ask, bid);
      if (!candidate) continue;
      if (candidate.roiMultiple + 1e-9 < minRoiMultiple) continue;
      candidates.push(candidate);
    }
  }

  return candidates;
}

function toOpportunity(
  candidate: Candidate,
  history: HistoricalWinEstimate,
  seriesTitle?: string | null,
): MoneyOpportunity {
  const { market, side, ask, bid, profitIfWin, roiMultiple } = candidate;
  return {
    ticker: market.ticker,
    eventTicker: market.event_ticker ?? null,
    title: titleFor(market),
    side,
    ask,
    bid,
    marketProbabilityPct: Math.round(ask * 1000) / 10,
    historicalWinRatePct: history.winRatePct,
    historicalSamples: history.samples,
    historicalWins: history.wins,
    historicalMethod: history.method,
    seriesTicker: history.seriesTicker || seriesTickerFromMarket(market),
    profitIfWin: Math.round(profitIfWin * 10000) / 10000,
    roiMultiple: Math.round(roiMultiple * 1000) / 1000,
    roiPct: Math.round(roiMultiple * 1000) / 10,
    volume24h: dollars(market.volume_24h_fp),
    liquidity: dollars(market.liquidity_dollars),
    closeTime: market.close_time ?? null,
    kalshiUrl: kalshiMarketUrl(market, seriesTitle),
    moneyScore:
      Math.round(moneyScore(history.winRate, ask, profitIfWin) * 1000) / 1000,
  };
}

/**
 * Rank ≥2× candidates after attaching series settlement history.
 * Only keeps sides whose historical win rate is strictly above
 * minHistoricalWinRate (default >75%), then sorts by max multiplier.
 */
export async function rankMoneyOpportunitiesWithHistory(
  markets: KalshiMarket[],
  options: ScanOptions = {},
): Promise<MoneyOpportunity[]> {
  const params = resolveScanParams(options);
  const candidates = collectRoiCandidates(markets, {
    ...params,
    query: params.query ?? undefined,
  });

  const seriesNeeded = [
    ...new Set(candidates.map((c) => seriesTickerFromMarket(c.market))),
  ];
  const historyBySeries = new Map<
    string,
    Awaited<ReturnType<typeof fetchSeriesHistory>>
  >();

  const seriesTitles = new Map<string, string | null>();

  for (const seriesTicker of seriesNeeded) {
    try {
      historyBySeries.set(seriesTicker, await fetchSeriesHistory(seriesTicker));
    } catch {
      historyBySeries.set(seriesTicker, []);
    }
    seriesTitles.set(seriesTicker, await fetchSeriesTitle(seriesTicker));
    await sleep(50);
  }

  const opportunities: MoneyOpportunity[] = [];

  for (const candidate of candidates) {
    const seriesTicker = seriesTickerFromMarket(candidate.market);
    const historyPoints = historyBySeries.get(seriesTicker) ?? [];
    const estimate = estimateHistoricalWinRate(
      candidate.market,
      candidate.side,
      historyPoints,
    );

    if (estimate.samples < params.minHistoricalSamples) continue;
    // "more than 75%" → strictly greater than the configured floor
    if (estimate.winRate <= params.minHistoricalWinRate) continue;

    opportunities.push(
      toOpportunity(candidate, estimate, seriesTitles.get(seriesTicker)),
    );
  }

  opportunities.sort((a, b) => {
    if (b.roiMultiple !== a.roiMultiple) return b.roiMultiple - a.roiMultiple;
    if (b.historicalWinRatePct !== a.historicalWinRatePct) {
      return b.historicalWinRatePct - a.historicalWinRatePct;
    }
    if (b.historicalSamples !== a.historicalSamples) {
      return b.historicalSamples - a.historicalSamples;
    }
    return b.volume24h - a.volume24h;
  });

  return opportunities.slice(0, params.limit);
}

/** Sync helper for unit tests (no network history). */
export function rankMoneyOpportunities(
  markets: KalshiMarket[],
  options: ScanOptions = {},
): MoneyOpportunity[] {
  const params = resolveScanParams(options);
  const opportunities = collectRoiCandidates(markets, {
    ...params,
    query: params.query ?? undefined,
  }).map((candidate) => {
      const stub: HistoricalWinEstimate = {
        seriesTicker: seriesTickerFromMarket(candidate.market),
        method: "insufficient",
        samples: params.minHistoricalSamples,
        wins: params.minHistoricalSamples,
        winRate: 1,
        winRatePct: 100,
      };
      return toOpportunity(candidate, stub);
    });

  opportunities.sort((a, b) => {
    if (b.roiMultiple !== a.roiMultiple) return b.roiMultiple - a.roiMultiple;
    if (b.marketProbabilityPct !== a.marketProbabilityPct) {
      return b.marketProbabilityPct - a.marketProbabilityPct;
    }
    return b.volume24h - a.volume24h;
  });

  return opportunities.slice(0, params.limit);
}

export async function scanKalshiMoneyOpportunities(
  options: ScanOptions = {},
): Promise<ScanResult> {
  const params = resolveScanParams(options);
  const cacheKey = JSON.stringify(params);
  const cached = scanCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  try {
    const markets = await fetchOpenMarkets(params.maxMarkets);
    const opportunities = await rankMoneyOpportunitiesWithHistory(markets, {
      ...params,
      query: params.query ?? undefined,
    });

    const result: ScanResult = {
      scannedAt: new Date().toISOString(),
      marketsScanned: markets.length,
      opportunityCount: opportunities.length,
      opportunities,
      params,
    };

    scanCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      result,
    });

    return result;
  } catch (error) {
    if (cached) return cached.result;
    throw error;
  }
}

export function formatOpportunityLine(opp: MoneyOpportunity): string {
  const profitCents = Math.round(opp.profitIfWin * 100);
  return (
    `• ${opp.historicalWinRatePct}% hist ${opp.side} @ $${opp.ask.toFixed(2)} ` +
    `(+$${opp.profitIfWin.toFixed(2)} / ${profitCents}¢, ` +
    `${opp.roiMultiple.toFixed(2)}×; n=${opp.historicalSamples}) — ` +
    `${opp.title} [\`${opp.ticker}\`](${opp.kalshiUrl})`
  );
}

export function formatScanAlert(result: ScanResult): string {
  const {
    minRoiMultiple,
    minHistoricalWinRate,
    minHistoricalSamples,
    maxAsk,
    minVolume24h,
  } = result.params;

  if (result.opportunities.length === 0) {
    return (
      `Kalshi money scan @ ${result.scannedAt}: no opportunities ` +
      `(scanned ${result.marketsScanned} markets; ` +
      `need ≥${minRoiMultiple}× profit and >${(minHistoricalWinRate * 100).toFixed(0)}% ` +
      `historical win rate over ≥${minHistoricalSamples} settlements; ` +
      `ask ≤ ${maxAsk.toFixed(3)}, min vol ${minVolume24h}).`
    );
  }

  const top = result.opportunities[0];
  return [
    `## Kalshi money alerts (max multiplier, >${(minHistoricalWinRate * 100).toFixed(0)}% history, ≥${minRoiMultiple}×)`,
    ``,
    `Scanned **${result.marketsScanned}** open markets at \`${result.scannedAt}\`.`,
    `Top pick by multiplier: **${top.roiMultiple.toFixed(2)}×** on ${top.title} — ` +
      `${top.side} @ $${top.ask.toFixed(2)} ` +
      `(${top.historicalWinRatePct}% hist over ${top.historicalSamples} settlements).`,
    ``,
    `### Ranked by max multiplier`,
    ...result.opportunities.map(formatOpportunityLine),
    ``,
    `_Filters: profit ≥ ${minRoiMultiple}× cost (ask ≤ ${maxAsk.toFixed(3)}), ` +
      `historical win rate > ${(minHistoricalWinRate * 100).toFixed(0)}% ` +
      `(≥${minHistoricalSamples} samples), ranked by highest multiplier. ` +
      `Not financial advice._`,
  ].join("\n");
}
