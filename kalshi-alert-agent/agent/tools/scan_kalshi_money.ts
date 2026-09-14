import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  DEFAULT_MIN_ROI_MULTIPLE,
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
  roiMultiple: z.number(),
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
    minRoiMultiple: z.number(),
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
    "Scan open Kalshi markets for the highest-probability contracts whose profit is at least 2× the cost (ROI ≥ 200%, ask ≤ ~$0.33). Use for continuous monitoring and money alerts.",
  inputSchema: z.object({
    minRoiMultiple: z
      .number()
      .min(0.1)
      .max(50)
      .optional()
      .describe(
        `Minimum profit÷cost multiple (default ${DEFAULT_MIN_ROI_MULTIPLE}).`,
      ),
    minProbability: z
      .number()
      .min(0)
      .max(0.99)
      .optional()
      .describe("Optional minimum implied probability / ask (default 0)."),
    maxAsk: z
      .number()
      .min(0.01)
      .max(0.99)
      .optional()
      .describe(
        "Optional max ask; never raised above 1/(1+minRoiMultiple).",
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
    query: z.string().optional().describe("Optional ticker/title filter."),
  }),
  outputSchema,
  label: {
    start: () => "Scanning Kalshi for ≥2× profit opportunities",
    complete: (_input, output) =>
      `Found ${output.opportunityCount} ≥2× profit opportunities`,
  },
  async execute(input) {
    const result = await scanKalshiMoneyOpportunities(input);
    return {
      ...result,
      alertMarkdown: formatScanAlert(result),
    };
  },
});
