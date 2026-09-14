# Kalshi Money Watch

Continuous Kalshi monitor for sides with **≥2× profit** whose **series history** shows a **>75%** empirical win rate, ranked by **maximum profit multiple**.

## Filters

| Rule | Default |
| --- | --- |
| Min profit multiple | `2` (ask ≤ ~$0.33) |
| Historical win rate | `>75%` from settled expiration values |
| Ranking | Highest multiplier first |
| Min history samples | `30` |
| Min 24h volume | `10` |
| Markets scanned | `3000` |

## Run

```bash
cd kalshi-alert-agent
npm install
npm run dev
```

Open [http://localhost:3000/opportunities](http://localhost:3000/opportunities).

## Disclaimer

Historical settlement rates are not guarantees. Monitoring only — not financial advice.
