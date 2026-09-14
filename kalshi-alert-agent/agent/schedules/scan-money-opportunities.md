---
cron: "*/5 * * * *"
---

Run a Kalshi money-opportunity scan now.

1. Call `scan_kalshi_money` with defaults (profit ≥ 2× cost, ask ≤ ~$0.33).
2. Summarize the top opportunities: probability, side (YES/NO), ask, profit if win, profit multiple (×), ticker, and Kalshi link.
3. Lead with the single highest-probability opportunity that still clears ≥2× profit.
4. If nothing qualifies, say so briefly — do not invent markets.
5. Remind once that market prices are not guarantees and this is not financial advice.

Do not place trades. Read-only market data only.
