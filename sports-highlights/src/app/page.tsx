import { HighlightsExplorer } from "@/components/HighlightsExplorer";
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
              <a className="cta-ghost" href="#sources">
                See sources
              </a>
            </div>
          </div>
        </section>

        <div id="sources">
          <SourcesStrip />
        </div>

        <HighlightsExplorer initial={initial} />
      </main>

      <footer className="site-footer">
        <p>
          <strong>PlayTape</strong> aggregates publicly available YouTube channel
          RSS feeds and plays videos through YouTube&apos;s official embed player.
          Optional ScoreBat support uses their licensed free feed when{" "}
          <code>SCOREBAT_TOKEN</code> is set. Content rights remain with each
          publisher.
        </p>
      </footer>
    </div>
  );
}
