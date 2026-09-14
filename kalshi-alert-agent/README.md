# Kalshi Money Watch

Continuous Kalshi monitor that alerts on the **highest-probability contracts that still pay money** — YES/NO sides priced near certain to win, but still below $1 so a winning settlement yields profit.

Built as an [eve](https://eve.dev) agent with a Next.js dashboard.

## What it does

1. Pages open Kalshi markets (public API, no auth).
2. Filters to high-probability asks (default **85%–97%**) with enough 24h volume.
3. Ranks by probability first, then leftover payout.
4. Alerts on a **5-minute cron** schedule and via chat.
5. Serves a live board at `/opportunities` (auto-refreshes every 60s).

This agent is **read-only**. It does not place trades.

## Quick start

Requires Node.js 24+.

```bash
cd kalshi-alert-agent
npm install
```

### Live opportunities board

```bash
npm run dev
```

Open [http://localhost:3000/opportunities](http://localhost:3000/opportunities).

### Agent (chat + schedules)

Set a Vercel AI Gateway key (or link a Vercel project for OIDC):

```bash
export AI_GATEWAY_API_KEY=...
npm run dev:eve -- --no-ui
```

Trigger the money scan schedule once in dev:

```bash
curl -X POST http://localhost:2000/eve/v1/dev/schedules/scan-money-opportunities
```

Chat with the agent and ask: “What are the highest probability Kalshi markets that still pay?”

## Key files

| Path | Role |
| --- | --- |
| `lib/kalshi/` | Market fetch + ranking |
| `agent/tools/scan_kalshi_money.ts` | Agent tool |
| `agent/schedules/scan-money-opportunities.md` | Cron every 5 minutes |
| `agent/instructions.md` | Agent purpose |
| `app/opportunities/` | Live dashboard |
| `app/api/opportunities/` | JSON scan API |

## Ranking defaults

| Filter | Default |
| --- | --- |
| Min probability (ask) | `0.85` |
| Max ask (min leftover payout) | `0.97` (≥3¢) |
| Min 24h volume | `25` contracts |
| Multivariate markets | excluded |

Optional env: `KALSHI_API_BASE` (defaults to `https://api.elections.kalshi.com/trade-api/v2`).

## Deploy

```bash
npm run deploy
```

On Vercel, the schedule becomes a Cron Job. Confirm under **Settings → Cron Jobs**.

## Disclaimer

Market-implied probabilities are not guarantees. This software is for monitoring and research only and is **not financial advice**.
