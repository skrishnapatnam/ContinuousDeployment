# PlayTape

Legal multi-sport highlights aggregator. Pulls public Atom/RSS feeds from official league and broadcaster YouTube channels and plays clips through YouTube’s embed player.

## Sports covered

Soccer, cricket, NBA, NFL, MLB, NHL, tennis, Formula 1, UFC, golf, Olympics — sourced from channels such as Premier League, UEFA, ICC, NBA, NFL, MLB, NHL, FORMULA 1, and more.

## Run locally

```bash
cd sports-highlights
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional ScoreBat soccer feed

ScoreBat’s free video API requires a developer token. If you have one:

```bash
export SCOREBAT_TOKEN=your_token_here
```

Without it, soccer highlights still load from official YouTube channels (Premier League, UEFA, LALIGA, Bundesliga, Serie A, MLS).

## API

`GET /api/highlights?sport=soccer&q=goal&limit=48`

Returns JSON with normalized highlight metadata and embed URLs.

## Legal note

Videos are not re-hosted, downloaded, AI-upscaled, or re-encoded. The app links and embeds publisher content via YouTube (and optionally ScoreBat). Playback uses YouTube’s adaptive stream (highest quality and original audio available for the viewer’s connection and region).

**Territorial rights:** Sports clips are licensed by country. If an embed is unavailable where you are, use the official source link or a locally licensed broadcaster/app. PlayTape does **not** integrate VPNs or other tools to bypass geo-blocks — that can violate publisher licenses and local law.

Content rights remain with each rights holder.
