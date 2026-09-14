---
description: Ranking and alerting rules for Kalshi opportunities with ≥2× profit. Use when scanning markets, explaining ROI multiples, or formatting alerts.
---

# Kalshi ≥2× profit alerts

## What “profit at least 2×” means

On Kalshi, a contract settles at **$1** if that side wins and **$0** otherwise.
Buying YES (or NO) at ask price **p** means:

- Market-implied win probability ≈ **p**
- Profit if it wins = **1 − p**
- Profit multiple = **(1 − p) / p**

We require **profit multiple ≥ 2** (ROI ≥ 200%), which means **p ≤ 1/3 ≈ $0.333**.
Example: pay $0.30 → profit $0.70 = **2.33×**.

Among those, rank by **highest probability** so you see the safest-looking ≥2× payouts first.

## Default filters

| Param | Default | Why |
| --- | --- | --- |
| `minRoiMultiple` | `2` | Profit must be ≥ 2× cost |
| `maxAsk` | `≈0.333` | Derived from minRoiMultiple |
| `minVolume24h` | `25` | Skip dead/illiquid books |
| `mve_filter` | `exclude` | Skip multivariate combo noise |

## Ranking

1. Sort by **probabilityPct** descending.
2. Break ties with higher **roiMultiple**, then **moneyScore**, then 24h volume.

## Alert format

Lead with the single best opportunity, then a short ranked list with:

`probability% SIDE @ $ask (+$profit if wins, Nx / ROI%) — title [ticker](url)`

Never claim guaranteed profit. Never place orders from this skill.
