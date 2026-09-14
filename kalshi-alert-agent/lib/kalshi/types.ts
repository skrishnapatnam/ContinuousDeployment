export type KalshiMarket = {
  ticker: string;
  event_ticker?: string;
  title?: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  status?: string;
  result?: string;
  close_time?: string;
  expiration_time?: string;
  expiration_value?: string;
  floor_strike?: number | string;
  strike_type?: string;
  last_price_dollars?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  no_bid_dollars?: string;
  no_ask_dollars?: string;
  volume_fp?: string;
  volume_24h_fp?: string;
  liquidity_dollars?: string;
  open_interest_fp?: string;
};

export type MoneySide = "YES" | "NO";

export type MoneyOpportunity = {
  ticker: string;
  eventTicker: string | null;
  title: string;
  side: MoneySide;
  ask: number;
  bid: number;
  /** Market-implied probability from ask (0–100). */
  marketProbabilityPct: number;
  /**
   * Historical win probability from series settlement history (0–100).
   * This is the primary “99%” filter.
   */
  historicalWinRatePct: number;
  historicalSamples: number;
  historicalWins: number;
  historicalMethod: "expiration_value" | "series_result" | "insufficient";
  seriesTicker: string;
  profitIfWin: number;
  /** Profit ÷ ask (2 = 2× profit on cost). */
  roiMultiple: number;
  /** Same ratio as a percent (200 = 2×). */
  roiPct: number;
  volume24h: number;
  liquidity: number;
  closeTime: string | null;
  kalshiUrl: string;
  moneyScore: number;
};

export type ScanOptions = {
  /** Minimum profit÷cost. Default 2 → ask ≤ ~$0.333. */
  minRoiMultiple?: number;
  /**
   * Minimum historical win rate (0–1). Default 0.99.
   * Computed from the series’ settled expiration history.
   */
  minHistoricalWinRate?: number;
  /** Minimum settled history samples required (default 50). */
  minHistoricalSamples?: number;
  minProbability?: number;
  maxAsk?: number;
  minVolume24h?: number;
  maxMarkets?: number;
  limit?: number;
  query?: string;
};

export type ScanResult = {
  scannedAt: string;
  marketsScanned: number;
  opportunityCount: number;
  opportunities: MoneyOpportunity[];
  params: Required<
    Pick<
      ScanOptions,
      | "minRoiMultiple"
      | "minHistoricalWinRate"
      | "minHistoricalSamples"
      | "minProbability"
      | "maxAsk"
      | "minVolume24h"
      | "maxMarkets"
      | "limit"
    >
  > & { query: string | null };
};
