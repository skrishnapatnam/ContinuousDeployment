export type KalshiMarket = {
  ticker: string;
  event_ticker?: string;
  title?: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  status?: string;
  close_time?: string;
  expiration_time?: string;
  last_price_dollars?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  no_bid_dollars?: string;
  no_ask_dollars?: string;
  yes_bid_size_fp?: string;
  yes_ask_size_fp?: string;
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
  /** Ask price in dollars to buy this side (≈ market-implied win probability). */
  ask: number;
  bid: number;
  /** Market-implied probability as a percent (0–100). */
  probabilityPct: number;
  /** Dollars profit per contract if this side settles winning ($1 − ask). */
  profitIfWin: number;
  /** ROI if the side wins: profit / ask. */
  roiPct: number;
  volume24h: number;
  liquidity: number;
  closeTime: string | null;
  kalshiUrl: string;
  /**
   * Rank score: higher = better "high probability that still pays".
   * Heavily weights probability while requiring leftover payout.
   */
  moneyScore: number;
};

export type ScanOptions = {
  /** Minimum ask / implied probability (default 0.85). */
  minProbability?: number;
  /** Maximum ask so the contract still pays (default 0.97 → ≥3¢). */
  maxAsk?: number;
  /** Minimum 24h volume in contracts (default 25). */
  minVolume24h?: number;
  /** Maximum markets to page through (default 4000). */
  maxMarkets?: number;
  /** How many opportunities to return (default 15). */
  limit?: number;
  /** Optional ticker / title substring filter. */
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
      "minProbability" | "maxAsk" | "minVolume24h" | "maxMarkets" | "limit"
    >
  > & { query: string | null };
};
