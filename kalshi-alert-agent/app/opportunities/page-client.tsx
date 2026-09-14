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
      const response = await fetch("/api/opportunities?limit=20", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
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
          <h1>Highest probability that still pays</h1>
          <p className="kmw-lede">
            Live scan of open Kalshi markets for near-certain sides with leftover
            payout below $1.
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
          ask {result.params.minProbability}–{result.params.maxAsk}
        </p>
      ) : null}

      <div className="kmw-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Prob</th>
              <th>Side</th>
              <th>Ask</th>
              <th>Profit if win</th>
              <th>ROI</th>
              <th>Vol 24h</th>
              <th>Market</th>
            </tr>
          </thead>
          <tbody>
            {result?.opportunities.map((opp) => (
              <tr key={`${opp.ticker}-${opp.side}`}>
                <td className="kmw-prob">{opp.probabilityPct.toFixed(1)}%</td>
                <td>
                  <span className={`kmw-side kmw-side-${opp.side.toLowerCase()}`}>
                    {opp.side}
                  </span>
                </td>
                <td>${opp.ask.toFixed(2)}</td>
                <td className="kmw-profit">+${opp.profitIfWin.toFixed(2)}</td>
                <td>{opp.roiPct.toFixed(1)}%</td>
                <td>{Math.round(opp.volume24h).toLocaleString()}</td>
                <td>
                  <a href={opp.kalshiUrl} target="_blank" rel="noreferrer">
                    {opp.title}
                  </a>
                  <div className="kmw-ticker">{opp.ticker}</div>
                </td>
              </tr>
            ))}
            {result && result.opportunities.length === 0 ? (
              <tr>
                <td colSpan={7}>No opportunities matched the current filters.</td>
              </tr>
            ) : null}
            {!result && !error ? (
              <tr>
                <td colSpan={7}>Scanning Kalshi…</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="kmw-disclaimer">
        Market-implied probabilities are not guarantees. This tool does not place
        trades and is not financial advice.
      </p>
    </div>
  );
}
