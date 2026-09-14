---
description: Ranking rules for Kalshi ≥2× profit sides with >75% historical win rate, sorted by max multiplier. Use when scanning, explaining history filters, or formatting alerts.
---

# Kalshi max multiplier with >75% history

## Filters (both required)

1. **Profit ≥ 2× cost** — buy ask `p` only if `(1 − p) / p ≥ 2` ⇒ `p ≤ ≈0.333`.
2. **Historical win rate > 75%** — from settled markets in the same series:
   - Prefer numeric `expiration_value` history vs this market’s `floor_strike` / `strike_type`.
   - Require enough samples (default ≥ 30).
   - Fallback to series-wide YES/NO settlement frequency when strike math is unavailable.

## Ranking

1. ROI multiple (desc) — maximize multiplier
2. Historical win rate
3. Sample size / volume

## Alert format

`hist% SIDE @ $ask (+$profit, Nx; n=samples) — title [ticker](url)`

Never claim certainty. Never place orders.
