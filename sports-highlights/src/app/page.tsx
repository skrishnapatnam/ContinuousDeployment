import { HighlightsExplorer } from "@/components/HighlightsExplorer";
import { LiveSports } from "@/components/LiveSports";
import { RegionCompliance } from "@/components/RegionCompliance";
import { SourcesStrip } from "@/components/SourcesStrip";
import { getHighlights } from "@/lib/highlights";
import { getLive } from "@/lib/live";

export const revalidate = 120;

export default async function HomePage() {
  const [initial, live] = await Promise.all([
    getHighlights({ sport: "all", limit: 72 }),
    getLive({ sport: "all" }),
  ]);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand-mark" href="/">
          PlayTape
        </a>
        <span className="legal-pill">Official embeds only</span>
      </header>

      <main>
        <section className="hero" aria-label="PlayTape hero">
          <div className="hero-visual" aria-hidden />
          <div className="hero-copy">
            <h1 className="hero-brand">PlayTape</h1>
            <p className="hero-line">
              Highlights plus legal live paths — official free streams when
              leagues publish them, and licensed platforms for every country.
            </p>
            <div className="cta-row">
              <a className="cta-primary" href="#live">
                Live &amp; watch legally
              </a>
              <a className="cta-ghost" href="#feed">
                Browse highlights
              </a>
            </div>
          </div>
        </section>

        <div id="sources">
          <SourcesStrip />
        </div>

        <LiveSports initial={live} />

        <RegionCompliance />

        <HighlightsExplorer initial={initial} />
      </main>

      <footer className="site-footer">
        <p>
          <strong>PlayTape</strong> aggregates publicly available YouTube channel
          RSS feeds and official public live pages, and plays them through
          YouTube&apos;s embed player. We do not download, AI-enhance, re-encode,
          scrape paywalled streams, or VPN-reroute content. Live exclusives must
          be watched on your country&apos;s licensed platform. Optional ScoreBat
          support uses their licensed feed when <code>SCOREBAT_TOKEN</code> is
          set. Content rights remain with each publisher.
        </p>
      </footer>
    </div>
  );
}
