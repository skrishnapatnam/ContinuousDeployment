import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  DEFAULT_MIN_HISTORICAL_SAMPLES,
  DEFAULT_MIN_HISTORICAL_WIN_RATE,
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
  marketProbabilityPct: z.number(),
  historicalWinRatePct: z.number(),
  historicalSamples: z.number(),
  historicalWins: z.number(),
  historicalMethod: z.enum([
    "expiration_value",
    "series_result",
    "insufficient",
  ]),
  seriesTicker: z.string(),
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
    minHistoricalWinRate: z.number(),
    minHistoricalSamples: z.number(),
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
    "Scan open Kalshi markets for sides with ≥2× profit (ask ≤ ~$0.33) whose series settlement history shows ≥99% win rate for that side/strike. Uses past expiration values. For continuous monitoring and money alerts.",
  inputSchema: z.object({
    minRoiMultiple: z
      .number()
      .min(0.1)
      .max(50)
      .optional()
      .describe(
        `Minimum profit÷cost (default ${DEFAULT_MIN_ROI_MULTIPLE}).`,
      ),
    minHistoricalWinRate: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe(
        `Minimum historical win rate 0–1 (default ${DEFAULT_MIN_HISTORICAL_WIN_RATE}).`,
      ),
    minHistoricalSamples: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        `Minimum settled history samples (default ${DEFAULT_MIN_HISTORICAL_SAMPLES}).`,
      ),
    minProbability: z.number().min(0).max(0.99).optional(),
    maxAsk: z.number().min(0.01).max(0.99).optional(),
    minVolume24h: z.number().min(0).optional(),
    limit: z.number().int().min(1).max(50).optional(),
    maxMarkets: z.number().int().min(200).max(10000).optional(),
    query: z.string().optional(),
  }),
  outputSchema,
  label: {
    start: () => "Scanning Kalshi for ≥99% hist / ≥2× profit sides",
    complete: (_input, output) =>
      `Found ${output.opportunityCount} ≥99% hist / ≥2× opportunities`,
  },
  async execute(input) {
    const result = await scanKalshiMoneyOpportunities(input);
    return {
      ...result,
      alertMarkdown: formatScanAlert(result),
    };
  },
});
