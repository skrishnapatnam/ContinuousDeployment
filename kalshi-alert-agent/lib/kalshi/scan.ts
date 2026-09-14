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

const CACHE_TTL_MS = Number(process.env.KALSHI_SCAN_CACHE_MS ?? 45_000);

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

/**
 * Score favors the highest win probability that still leaves money on the table.
 * ask^4 * profit weights near-certain outcomes while zeroing out $0.00 payouts.
 */
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

  return {
    ticker: market.ticker,
    eventTicker: market.event_ticker ?? null,
    title: titleFor(market),
    side,
    ask,
    bid,
    probabilityPct: Math.round(ask * 1000) / 10,
    profitIfWin: Math.round(profitIfWin * 10000) / 10000,
    roiPct: Math.round((profitIfWin / ask) * 1000) / 10,
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
    // Exclude multivariate combo markets — noisy and usually illiquid.
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
    // Small pacing gap to stay under public rate limits while paging.
    await sleep(75);
  }

  return markets;
}

export function rankMoneyOpportunities(
  markets: KalshiMarket[],
  options: ScanOptions = {},
): MoneyOpportunity[] {
  const minProbability = options.minProbability ?? 0.85;
  const maxAsk = options.maxAsk ?? 0.97;
  const minVolume24h = options.minVolume24h ?? 25;
  const limit = options.limit ?? 15;
  const query = options.query?.trim().toLowerCase() || null;

  const opportunities: MoneyOpportunity[] = [];

  for (const market of markets) {
    if (query) {
      const haystack = `${market.ticker} ${titleFor(market)}`.toLowerCase();
      if (!haystack.includes(query)) continue;
    }

    const volume24h = dollars(market.volume_24h_fp);
    const liquidity = dollars(market.liquidity_dollars);
    if (volume24h < minVolume24h && liquidity < minVolume24h) continue;

    const sides: Array<{
      side: MoneySide;
      ask: number;
      bid: number;
    }> = [
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
      if (opp) opportunities.push(opp);
    }
  }

  opportunities.sort((a, b) => {
    if (b.probabilityPct !== a.probabilityPct) {
      return b.probabilityPct - a.probabilityPct;
    }
    if (b.moneyScore !== a.moneyScore) return b.moneyScore - a.moneyScore;
    return b.volume24h - a.volume24h;
  });

  return opportunities.slice(0, limit);
}

export async function scanKalshiMoneyOpportunities(
  options: ScanOptions = {},
): Promise<ScanResult> {
  const minProbability = options.minProbability ?? 0.85;
  const maxAsk = options.maxAsk ?? 0.97;
  const minVolume24h = options.minVolume24h ?? 25;
  const maxMarkets = options.maxMarkets ?? 2000;
  const limit = options.limit ?? 15;
  const query = options.query?.trim() || null;

  const cacheKey = JSON.stringify({
    minProbability,
    maxAsk,
    minVolume24h,
    maxMarkets,
    limit,
    query,
  });
  const cached = scanCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const markets = await fetchOpenMarkets(maxMarkets);
  const opportunities = rankMoneyOpportunities(markets, {
    minProbability,
    maxAsk,
    minVolume24h,
    limit,
    query: query ?? undefined,
  });

  const result: ScanResult = {
    scannedAt: new Date().toISOString(),
    marketsScanned: markets.length,
    opportunityCount: opportunities.length,
    opportunities,
    params: {
      minProbability,
      maxAsk,
      minVolume24h,
      maxMarkets,
      limit,
      query,
    },
  };

  scanCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result,
  });

  return result;
}

export function formatOpportunityLine(opp: MoneyOpportunity): string {
  const profitCents = Math.round(opp.profitIfWin * 100);
  return (
    `• ${opp.probabilityPct}% ${opp.side} @ $${opp.ask.toFixed(2)} ` +
    `(+$${opp.profitIfWin.toFixed(2)} / ${profitCents}¢ if wins, ROI ${opp.roiPct}%) — ` +
    `${opp.title} [\`${opp.ticker}\`](${opp.kalshiUrl})`
  );
}

export function formatScanAlert(result: ScanResult): string {
  if (result.opportunities.length === 0) {
    return (
      `Kalshi money scan @ ${result.scannedAt}: no opportunities ` +
      `(scanned ${result.marketsScanned} markets; ` +
      `prob ${result.params.minProbability * 100}%–${result.params.maxAsk * 100}%, ` +
      `min vol ${result.params.minVolume24h}).`
    );
  }

  const top = result.opportunities[0];
  const lines = [
    `## Kalshi high-probability money alerts`,
    ``,
    `Scanned **${result.marketsScanned}** open markets at \`${result.scannedAt}\`.`,
    `Top pick: **${top.probabilityPct}% ${top.side}** on ${top.title} — pay $${top.ask.toFixed(2)} to make $${top.profitIfWin.toFixed(2)} if it settles.`,
    ``,
    `### Ranked opportunities (highest probability that still pays)`,
    ...result.opportunities.map(formatOpportunityLine),
    ``,
    `_Filter: ask ${result.params.minProbability}–${result.params.maxAsk}, min 24h volume ${result.params.minVolume24h}. Not financial advice._`,
  ];
  return lines.join("\n");
}
