import assert from "node:assert/strict";
import { moneyScore, rankMoneyOpportunities } from "../lib/kalshi/scan.ts";
import type { KalshiMarket } from "../lib/kalshi/types.ts";

const markets: KalshiMarket[] = [
  {
    ticker: "HIGH-PROB",
    title: "Near certain YES",
    yes_ask_dollars: "0.94",
    yes_bid_dollars: "0.93",
    no_ask_dollars: "0.07",
    no_bid_dollars: "0.06",
    volume_24h_fp: "500",
    liquidity_dollars: "100",
  },
  {
    ticker: "LOW-PAYOUT",
    title: "Too expensive",
    yes_ask_dollars: "0.99",
    yes_bid_dollars: "0.98",
    no_ask_dollars: "0.02",
    no_bid_dollars: "0.01",
    volume_24h_fp: "500",
    liquidity_dollars: "100",
  },
  {
    ticker: "LOW-PROB",
    title: "Coin flip",
    yes_ask_dollars: "0.50",
    yes_bid_dollars: "0.49",
    no_ask_dollars: "0.51",
    no_bid_dollars: "0.50",
    volume_24h_fp: "500",
    liquidity_dollars: "100",
  },
  {
    ticker: "HIGH-NO",
    title: "Near certain NO",
    yes_ask_dollars: "0.08",
    yes_bid_dollars: "0.07",
    no_ask_dollars: "0.96",
    no_bid_dollars: "0.95",
    volume_24h_fp: "200",
    liquidity_dollars: "80",
  },
];

// Higher probability with the same leftover payout scores higher.
assert.ok(moneyScore(0.95, 0.05) > moneyScore(0.9, 0.05));

const ranked = rankMoneyOpportunities(markets, {
  minProbability: 0.85,
  maxAsk: 0.97,
  minVolume24h: 25,
  limit: 10,
});

assert.equal(ranked.length, 2);
assert.equal(ranked[0].ticker, "HIGH-NO");
assert.equal(ranked[0].side, "NO");
assert.equal(ranked[0].probabilityPct, 96);
assert.equal(ranked[1].ticker, "HIGH-PROB");
assert.equal(ranked[1].side, "YES");

console.log("kalshi ranking tests passed");
