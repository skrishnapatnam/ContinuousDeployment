import assert from "node:assert/strict";
import {
  maxAskForRoiMultiple,
  moneyScore,
  rankMoneyOpportunities,
} from "../lib/kalshi/scan.ts";
import type { KalshiMarket } from "../lib/kalshi/types.ts";

assert.equal(Number(maxAskForRoiMultiple(2).toFixed(6)), 0.333333);

const markets: KalshiMarket[] = [
  {
    ticker: "HIGH-PROB-LOW-PAY",
    title: "Near certain — tiny payout, fails 2×",
    yes_ask_dollars: "0.97",
    yes_bid_dollars: "0.96",
    // Keep NO expensive too so neither side clears 2×.
    no_ask_dollars: "0.55",
    no_bid_dollars: "0.54",
    volume_24h_fp: "500",
    liquidity_dollars: "100",
  },
  {
    ticker: "TWO-X-YES",
    title: "Pays ~2× on YES",
    yes_ask_dollars: "0.333",
    yes_bid_dollars: "0.32",
    no_ask_dollars: "0.68",
    no_bid_dollars: "0.67",
    volume_24h_fp: "400",
    liquidity_dollars: "80",
  },
  {
    ticker: "THREE-X-NO",
    title: "Pays 3× on NO",
    yes_ask_dollars: "0.76",
    yes_bid_dollars: "0.75",
    no_ask_dollars: "0.25",
    no_bid_dollars: "0.24",
    volume_24h_fp: "300",
    liquidity_dollars: "60",
  },
  {
    ticker: "BELOW-TWO-X",
    title: "Only 1× profit — excluded",
    yes_ask_dollars: "0.50",
    yes_bid_dollars: "0.49",
    no_ask_dollars: "0.51",
    no_bid_dollars: "0.50",
    volume_24h_fp: "500",
    liquidity_dollars: "100",
  },
];

assert.ok(moneyScore(0.3, 0.7) > moneyScore(0.25, 0.75));

const ranked = rankMoneyOpportunities(markets, {
  minRoiMultiple: 2,
  minVolume24h: 25,
  limit: 10,
});

assert.equal(ranked.length, 2);
assert.equal(ranked[0].ticker, "TWO-X-YES");
assert.equal(ranked[0].side, "YES");
assert.ok(ranked[0].roiMultiple >= 2);
assert.equal(ranked[1].ticker, "THREE-X-NO");
assert.equal(ranked[1].side, "NO");
assert.ok(ranked[1].roiMultiple >= 2);
assert.ok(!ranked.some((o) => o.ticker === "HIGH-PROB-LOW-PAY"));
assert.ok(!ranked.some((o) => o.ticker === "BELOW-TWO-X"));

console.log("kalshi ≥2× profit ranking tests passed");
