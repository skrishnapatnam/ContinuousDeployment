# Kalshi Money Watch

Continuous Kalshi monitor that alerts on the **highest-probability contracts with ≥2× profit** — buy ask `p` only when profit `(1−p)` is at least **2×** the cost `p` (ask ≤ ~$0.33), then rank by win probability.

Built as an [eve](https://eve.dev) agent with a Next.js dashboard.

## What it does

1. Pages open Kalshi markets (public API, no auth).
2. Keeps only sides where **profit ÷ ask ≥ 2** (default).
3. Ranks those by **highest implied probability**.
4. Alerts on a **5-minute cron** schedule and via chat.
5. Serves a live board at `/opportunities` (auto-refreshes every 60s).

This agent is **read-only**. It does not place trades.

## Quick start

Requires Node.js 24+.

```bash
cd kalshi-alert-agent
npm install
npm run dev
```

Open [http://localhost:3000/opportunities](http://localhost:3000/opportunities).

## Ranking defaults

| Filter | Default |
| --- | --- |
| Min profit multiple | `2` (profit ≥ 2× cost) |
| Max ask | `≈0.333` (derived) |
| Min 24h volume | `25` contracts |
| Multivariate markets | excluded |

## Disclaimer

Market-implied probabilities are not guarantees. This is monitoring only — **not financial advice**.
