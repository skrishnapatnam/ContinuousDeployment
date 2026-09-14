import assert from "node:assert/strict";
import { estimateHistoricalWinRate } from "../lib/kalshi/history";
import {
  maxAskForRoiMultiple,
  rankMoneyOpportunities,
} from "../lib/kalshi/scan";
import type { KalshiMarket } from "../lib/kalshi/types";
import type { SeriesHistoryPoint } from "../lib/kalshi/history";

assert.equal(Number(maxAskForRoiMultiple(2).toFixed(6)), 0.333333);

const markets: KalshiMarket[] = [
  {
    ticker: "KXTEMPTEST-26SEP14-T70",
    title: "Temp above 70",
    floor_strike: 70,
    strike_type: "greater",
    yes_ask_dollars: "0.30",
    yes_bid_dollars: "0.29",
    no_ask_dollars: "0.71",
    no_bid_dollars: "0.70",
    volume_24h_fp: "100",
    liquidity_dollars: "50",
  },
  {
    ticker: "KXTEMPTEST-26SEP14-T90",
    title: "Temp above 90",
    floor_strike: 90,
    strike_type: "greater",
    yes_ask_dollars: "0.25",
    yes_bid_dollars: "0.24",
    no_ask_dollars: "0.76",
    no_bid_dollars: "0.75",
    volume_24h_fp: "100",
    liquidity_dollars: "50",
  },
  {
    ticker: "KXCHEAP-1X",
    title: "Only 1× profit — excluded by ROI floor",
    yes_ask_dollars: "0.50",
    yes_bid_dollars: "0.49",
    no_ask_dollars: "0.51",
    no_bid_dollars: "0.50",
    volume_24h_fp: "100",
    liquidity_dollars: "50",
  },
];

const ranked = rankMoneyOpportunities(markets, {
  minRoiMultiple: 2,
  minVolume24h: 25,
  limit: 10,
});
assert.equal(ranked.length, 2);
assert.ok(ranked.every((o) => o.roiMultiple >= 2));

// History: temps always between 72 and 85 → YES>70 is ~100%, YES>90 is ~0%, NO>90 ~100%
const history: SeriesHistoryPoint[] = Array.from({ length: 60 }, (_, i) => ({
  eventTicker: `E${i}`,
  expirationValue: 72 + (i % 14),
  result: null,
  floorStrike: null,
  strikeType: "greater",
}));

const yes70 = estimateHistoricalWinRate(markets[0], "YES", history);
assert.ok(yes70.winRate >= 0.99, `expected YES>70 high, got ${yes70.winRate}`);
assert.equal(yes70.method, "expiration_value");

const yes90 = estimateHistoricalWinRate(markets[1], "YES", history);
assert.ok(yes90.winRate < 0.2, `expected YES>90 low, got ${yes90.winRate}`);

const no90 = estimateHistoricalWinRate(markets[1], "NO", history);
assert.ok(no90.winRate >= 0.99, `expected NO>90 high, got ${no90.winRate}`);

console.log("kalshi ≥2× + history ranking tests passed");
