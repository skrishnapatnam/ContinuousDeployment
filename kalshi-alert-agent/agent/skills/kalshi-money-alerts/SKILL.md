---
description: Ranking rules for Kalshi ≥2× profit sides with ≥99% historical win rate. Use when scanning, explaining history filters, or formatting alerts.
---

# Kalshi ≥2× profit with ≥99% history

## Filters (both required)

1. **Profit ≥ 2× cost** — buy ask `p` only if `(1 − p) / p ≥ 2` ⇒ `p ≤ ≈0.333`.
2. **Historical win rate ≥ 99%** — from settled markets in the same series:
   - Prefer numeric `expiration_value` history vs this market’s `floor_strike` / `strike_type`.
   - Require enough samples (default ≥ 50).
   - Fallback to series-wide YES/NO settlement frequency when strike math is unavailable.

## Ranking

1. Historical win rate (desc)
2. ROI multiple
3. Sample size / volume

## Alert format

`hist% SIDE @ $ask (+$profit, Nx; n=samples) — title [ticker](url)`

Never claim certainty. Never place orders.
