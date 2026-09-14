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

function kalshiMarketUrl(ticker: string): string {
  return `https://kalshi.com/markets/${encodeURIComponent(ticker.toLowerCase())}`;
}

/** Score favors higher win probability among sides that still clear the × floor. */
export function moneyScore(ask: number, profitIfWin: number): number {
  if (ask <= 0 || ask >= 1 || profitIfWin <= 0) return 0;
  return ask ** 4 * profitIfWin * 1000;
}

function opportunityFromSide(
  market: KalshiMarket,
  side: MoneySide,
  ask: number,
  bid: number,
): MoneyOpportunity | null {
  if (ask <= 0 || ask >= 1) return null;
  const profitIfWin = 1 - ask;
  if (profitIfWin <= 0) return null;
  const roiMultiple = profitIfWin / ask;

  return {
    ticker: market.ticker,
    eventTicker: market.event_ticker ?? null,
    title: titleFor(market),
    side,
    ask,
    bid,
    probabilityPct: Math.round(ask * 1000) / 10,
    profitIfWin: Math.round(profitIfWin * 10000) / 10000,
    roiMultiple: Math.round(roiMultiple * 1000) / 1000,
    roiPct: Math.round(roiMultiple * 1000) / 10,
    volume24h: dollars(market.volume_24h_fp),
    liquidity: dollars(market.liquidity_dollars),
    closeTime: market.close_time ?? null,
    kalshiUrl: kalshiMarketUrl(market.ticker),
    moneyScore: Math.round(moneyScore(ask, profitIfWin) * 1000) / 1000,
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
  const derivedMaxAsk = maxAskForRoiMultiple(minRoiMultiple);
  const requestedMaxAsk = options.maxAsk ?? derivedMaxAsk;
  // Never loosen the profit floor, even if a higher maxAsk is requested.
  const maxAsk = Math.min(requestedMaxAsk, derivedMaxAsk);
  const minProbability = options.minProbability ?? 0;
  const minVolume24h = options.minVolume24h ?? 25;
  const maxMarkets = options.maxMarkets ?? 2000;
  const limit = options.limit ?? 15;
  const query = options.query?.trim() || null;

  return {
    minRoiMultiple,
    minProbability,
    maxAsk,
    minVolume24h,
    maxMarkets,
    limit,
    query,
  };
}

export function rankMoneyOpportunities(
  markets: KalshiMarket[],
  options: ScanOptions = {},
): MoneyOpportunity[] {
  const {
    minRoiMultiple,
    minProbability,
    maxAsk,
    minVolume24h,
    limit,
    query,
  } = resolveScanParams(options);

  const opportunities: MoneyOpportunity[] = [];

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
      const opp = opportunityFromSide(market, side, ask, bid);
      if (!opp) continue;
      if (opp.roiMultiple + 1e-9 < minRoiMultiple) continue;
      opportunities.push(opp);
    }
  }

  opportunities.sort((a, b) => {
    if (b.probabilityPct !== a.probabilityPct) {
      return b.probabilityPct - a.probabilityPct;
    }
    if (b.roiMultiple !== a.roiMultiple) return b.roiMultiple - a.roiMultiple;
    if (b.moneyScore !== a.moneyScore) return b.moneyScore - a.moneyScore;
    return b.volume24h - a.volume24h;
  });

  return opportunities.slice(0, limit);
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
    const opportunities = rankMoneyOpportunities(markets, {
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
    `• ${opp.probabilityPct}% ${opp.side} @ $${opp.ask.toFixed(2)} ` +
    `(+$${opp.profitIfWin.toFixed(2)} / ${profitCents}¢ if wins, ` +
    `${opp.roiMultiple.toFixed(2)}× / ${opp.roiPct}% ROI) — ` +
    `${opp.title} [\`${opp.ticker}\`](${opp.kalshiUrl})`
  );
}

export function formatScanAlert(result: ScanResult): string {
  const { minRoiMultiple, minProbability, maxAsk, minVolume24h } =
    result.params;

  if (result.opportunities.length === 0) {
    return (
      `Kalshi money scan @ ${result.scannedAt}: no opportunities ` +
      `(scanned ${result.marketsScanned} markets; ` +
      `min profit ${minRoiMultiple}× cost, ask ≤ ${maxAsk.toFixed(3)}, ` +
      `min vol ${minVolume24h}).`
    );
  }

  const top = result.opportunities[0];
  return [
    `## Kalshi money alerts (≥${minRoiMultiple}× profit)`,
    ``,
    `Scanned **${result.marketsScanned}** open markets at \`${result.scannedAt}\`.`,
    `Top pick: **${top.probabilityPct}% ${top.side}** on ${top.title} — ` +
      `pay $${top.ask.toFixed(2)} to make $${top.profitIfWin.toFixed(2)} ` +
      `(${top.roiMultiple.toFixed(2)}× profit) if it settles.`,
    ``,
    `### Ranked opportunities (highest probability with ≥${minRoiMultiple}× profit)`,
    ...result.opportunities.map(formatOpportunityLine),
    ``,
    `_Filter: profit ≥ ${minRoiMultiple}× cost (ask ≤ ${maxAsk.toFixed(3)}` +
      `${minProbability > 0 ? `, min prob ${minProbability}` : ""}), ` +
      `min 24h volume ${minVolume24h}. Not financial advice._`,
  ].join("\n");
}
