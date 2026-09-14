import { formatScanAlert, scanKalshiMoneyOpportunities } from "../lib/kalshi/scan";

async function main() {
  const r = await scanKalshiMoneyOpportunities({
    limit: 15,
    maxMarkets: 3000,
    minRoiMultiple: 2,
    minHistoricalWinRate: 0.75,
    minHistoricalSamples: 30,
    minVolume24h: 10,
  });
  console.log(formatScanAlert(r));
  console.log(JSON.stringify({
    scannedAt: r.scannedAt,
    marketsScanned: r.marketsScanned,
    opportunityCount: r.opportunityCount,
    params: r.params,
    picks: r.opportunities.map((o) => ({
      ticker: o.ticker,
      title: o.title,
      side: o.side,
      ask: o.ask,
      profitIfWin: o.profitIfWin,
      roiMultiple: o.roiMultiple,
      historicalWinRatePct: o.historicalWinRatePct,
      historicalSamples: o.historicalSamples,
      historicalMethod: o.historicalMethod,
      volume24h: o.volume24h,
      kalshiUrl: o.kalshiUrl,
    })),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
