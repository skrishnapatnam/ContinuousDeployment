---
description: Ranking and alerting rules for Kalshi high-probability money opportunities. Use when scanning markets, explaining moneyScore, or formatting alerts.
---

# Kalshi money-opportunity alerts

## What “highest probability that gives money” means

On Kalshi, a contract settles at **$1** if that side wins and **$0** otherwise.
Buying YES (or NO) at ask price **p** means:

- Market-implied win probability ≈ **p**
- Profit if it wins = **1 − p**
- ROI if it wins = **(1 − p) / p**

We want contracts where **p is high** (likely to pay) but **p < 1** (still leftover money).

## Default filters

| Param | Default | Why |
| --- | --- | --- |
| `minProbability` / min ask | `0.85` | Focus on high-probability sides |
| `maxAsk` | `0.97` | Require ≥ ~3¢ payout if it wins |
| `minVolume24h` | `25` | Skip dead/illiquid books |
| `mve_filter` | `exclude` | Skip multivariate combo noise |

## Ranking

1. Sort by **probabilityPct** descending (highest chance first).
2. Break ties with **moneyScore** = `ask^4 * profit * 1000`, then 24h volume.

## Alert format

Lead with the single best opportunity, then a short ranked list with:

`probability% SIDE @ $ask (+$profit if wins, ROI x%) — title [ticker](url)`

Never claim guaranteed profit. Never place orders from this skill.
