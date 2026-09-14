import { formatScanAlert, scanKalshiMoneyOpportunities } from "../lib/kalshi/scan";

async function main() {
  const r = await scanKalshiMoneyOpportunities({
    limit: 10,
    maxMarkets: 1200,
    minRoiMultiple: 2,
    minHistoricalWinRate: 0.99,
    minHistoricalSamples: 50,
  });
  console.log(formatScanAlert(r));
  console.log(
    "hist ok",
    r.opportunities.every((o) => o.historicalWinRatePct >= 99),
  );
  console.log(
    "roi ok",
    r.opportunities.every((o) => o.roiMultiple >= 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
