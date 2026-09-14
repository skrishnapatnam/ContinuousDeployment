"use client";

import { useCallback, useEffect, useState } from "react";

import type { ScanResult } from "@/lib/kalshi";

import "./opportunities.css";

export function OpportunitiesDashboard() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await fetch(
        "/api/opportunities?limit=20&minRoiMultiple=2&minHistoricalWinRate=0.99",
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : data.error?.message || `HTTP ${response.status}`,
        );
      }
      setResult(data as ScanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);

  return (
    <div className="kmw-dash">
      <header className="kmw-header">
        <div>
          <p className="kmw-brand">Kalshi Money Watch</p>
          <h1>≥99% historical chance of ≥2× profit</h1>
          <p className="kmw-lede">
            Live Kalshi scan: sides with ask ≤ ~$0.33 (≥2× payout){" "}
            <strong>and</strong> ≥99% win rate from that series’ settled
            history.
          </p>
        </div>
        <div className="kmw-actions">
          <label className="kmw-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh 60s
          </label>
          <button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "Scanning…" : "Scan now"}
          </button>
          <a className="kmw-chat" href="/">
            Ask the agent
          </a>
        </div>
      </header>

      {error ? <p className="kmw-error">{error}</p> : null}

      {result ? (
        <p className="kmw-meta">
          Scanned {result.marketsScanned} markets at{" "}
          <time dateTime={result.scannedAt}>
            {new Date(result.scannedAt).toLocaleString()}
          </time>
          {" · "}
          {result.opportunityCount} opportunities
          {" · "}
          ≥{result.params.minRoiMultiple}× profit
          {" · "}
          ≥{(result.params.minHistoricalWinRate * 100).toFixed(0)}% history (n≥
          {result.params.minHistoricalSamples})
          {" · "}
          ask ≤ {result.params.maxAsk.toFixed(3)}
        </p>
      ) : null}

      <div className="kmw-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hist %</th>
              <th>n</th>
              <th>Side</th>
              <th>Ask</th>
              <th>Profit</th>
              <th>Multiple</th>
              <th>Mkt %</th>
              <th>Vol 24h</th>
              <th>Market</th>
            </tr>
          </thead>
          <tbody>
            {result?.opportunities.map((opp) => (
              <tr key={`${opp.ticker}-${opp.side}`}>
                <td className="kmw-prob">
                  {opp.historicalWinRatePct.toFixed(1)}%
                </td>
                <td>{opp.historicalSamples}</td>
                <td>
                  <span
                    className={`kmw-side kmw-side-${opp.side.toLowerCase()}`}
                  >
                    {opp.side}
                  </span>
                </td>
                <td>${opp.ask.toFixed(2)}</td>
                <td className="kmw-profit">+${opp.profitIfWin.toFixed(2)}</td>
                <td className="kmw-multiple">{opp.roiMultiple.toFixed(2)}×</td>
                <td>{opp.marketProbabilityPct.toFixed(1)}%</td>
                <td>{Math.round(opp.volume24h).toLocaleString()}</td>
                <td>
                  <a href={opp.kalshiUrl} target="_blank" rel="noreferrer">
                    {opp.title}
                  </a>
                  <div className="kmw-ticker">
                    {opp.seriesTicker} · {opp.ticker}
                  </div>
                </td>
              </tr>
            ))}
            {result && result.opportunities.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  No sides currently clear ≥2× profit with ≥99% historical win
                  rate.
                </td>
              </tr>
            ) : null}
            {!result && !error ? (
              <tr>
                <td colSpan={9}>Scanning Kalshi + settlement history…</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="kmw-disclaimer">
        Hist % is the empirical win rate of this side/strike from past
        settlements in the same series (expiration values). ≥2× means profit ÷
        ask ≥ 2. Past performance is not a guarantee. Not financial advice.
      </p>
    </div>
  );
}
