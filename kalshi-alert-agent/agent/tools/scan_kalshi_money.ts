import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  formatScanAlert,
  scanKalshiMoneyOpportunities,
} from "../../lib/kalshi";

const opportunitySchema = z.object({
  ticker: z.string(),
  eventTicker: z.string().nullable(),
  title: z.string(),
  side: z.enum(["YES", "NO"]),
  ask: z.number(),
  bid: z.number(),
  probabilityPct: z.number(),
  profitIfWin: z.number(),
  roiPct: z.number(),
  volume24h: z.number(),
  liquidity: z.number(),
  closeTime: z.string().nullable(),
  kalshiUrl: z.string(),
  moneyScore: z.number(),
});

const outputSchema = z.object({
  scannedAt: z.string(),
  marketsScanned: z.number(),
  opportunityCount: z.number(),
  opportunities: z.array(opportunitySchema),
  params: z.object({
    minProbability: z.number(),
    maxAsk: z.number(),
    minVolume24h: z.number(),
    maxMarkets: z.number(),
    limit: z.number(),
    query: z.string().nullable(),
  }),
  alertMarkdown: z.string(),
});

export default defineTool({
  description:
    "Scan open Kalshi markets for the highest-probability contracts that still pay money (buy price high but below $1). Use for continuous monitoring, money alerts, and ranking YES/NO sides by win probability with remaining payout.",
  inputSchema: z.object({
    minProbability: z
      .number()
      .min(0.5)
      .max(0.99)
      .optional()
      .describe("Minimum market-implied probability / ask (default 0.85)."),
    maxAsk: z
      .number()
      .min(0.5)
      .max(0.99)
      .optional()
      .describe(
        "Maximum ask so the contract still pays if it wins (default 0.97).",
      ),
    minVolume24h: z
      .number()
      .min(0)
      .optional()
      .describe("Minimum 24h volume in contracts (default 25)."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("How many opportunities to return (default 15)."),
    maxMarkets: z
      .number()
      .int()
      .min(200)
      .max(10000)
      .optional()
      .describe("Max open markets to page through (default 2000)."),
    query: z
      .string()
      .optional()
      .describe("Optional ticker/title substring filter."),
  }),
  outputSchema,
  label: {
    start: () => "Scanning Kalshi for high-probability money markets",
    complete: (_input, output) =>
      `Found ${output.opportunityCount} money opportunities`,
  },
  async execute(input) {
    const result = await scanKalshiMoneyOpportunities(input);
    return {
      ...result,
      alertMarkdown: formatScanAlert(result),
    };
  },
});
