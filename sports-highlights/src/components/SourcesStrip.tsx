import { SOURCES } from "@/lib/sources";

export function SourcesStrip() {
  const names = Array.from(new Set(SOURCES.map((s) => s.name)));

  return (
    <section className="sources-section" aria-label="Highlight sources">
      <div className="section-copy">
        <h2>From the leagues themselves</h2>
        <p>
          PlayTape only pulls public RSS from official YouTube channels and
          optional ScoreBat embeds — no scraped torrents, no unauthorized mirrors.
        </p>
      </div>
      <div className="sources-marquee" aria-hidden="true">
        <ul className="sources-track">
          {[...names, ...names].map((name, i) => (
            <li key={`${name}-${i}`}>{name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
