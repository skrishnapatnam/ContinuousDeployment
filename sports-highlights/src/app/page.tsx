import { HighlightsExplorer } from "@/components/HighlightsExplorer";
import { RegionCompliance } from "@/components/RegionCompliance";
import { SourcesStrip } from "@/components/SourcesStrip";
import { getHighlights } from "@/lib/highlights";

export const revalidate = 900;

export default async function HomePage() {
  const initial = await getHighlights({ sport: "all", limit: 72 });

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
              Multi-sport highlights straight from official league and broadcaster
              feeds — soccer, cricket, NBA, football, baseball, and more.
            </p>
            <div className="cta-row">
              <a className="cta-primary" href="#feed">
                Watch highlights
              </a>
              <a className="cta-ghost" href="#compliance">
                Rights &amp; regions
              </a>
            </div>
          </div>
        </section>

        <div id="sources">
          <SourcesStrip />
        </div>

        <RegionCompliance />

        <HighlightsExplorer initial={initial} />
      </main>

      <footer className="site-footer">
        <p>
          <strong>PlayTape</strong> aggregates publicly available YouTube channel
          RSS feeds and plays videos through YouTube&apos;s official embed player
          at the highest quality the publisher streams for your connection and
          region. We do not download, AI-enhance, re-encode, or VPN-reroute
          content. Optional ScoreBat support uses their licensed free feed when{" "}
          <code>SCOREBAT_TOKEN</code> is set. Content rights remain with each
          publisher — follow your country&apos;s licensing rules.
        </p>
      </footer>
    </div>
  );
}
