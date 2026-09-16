"use client";

import { useMemo, useState } from "react";
import type { LiveResponse } from "@/lib/live";
import type { LiveStream } from "@/lib/youtube-live";
import { SPORT_LABELS } from "@/lib/sources";
import { PlayerModal } from "./PlayerModal";
import type { Highlight } from "@/lib/types";

type Props = {
  initial: LiveResponse;
};

function liveToHighlight(live: LiveStream): Highlight {
  return {
    id: live.id,
    title: live.title,
    description: `Live from ${live.sourceName}`,
    publishedAt: new Date().toISOString(),
    thumbnail: live.thumbnail,
    videoId: live.videoId,
    embedUrl: live.embedUrl,
    watchUrl: live.watchUrl,
    sourceId: live.sourceId,
    sourceName: live.sourceName,
    sport: live.sport,
  };
}

export function LiveSports({ initial }: Props) {
  const [region, setRegion] = useState("US");
  const [active, setActive] = useState<Highlight | null>(null);

  const guide = useMemo(
    () => initial.guides.find((g) => g.code === region) ?? initial.guides[0],
    [initial.guides, region],
  );

  return (
    <section className="live-section" id="live" aria-labelledby="live-title">
      <div className="section-copy">
        <h2 id="live-title">Live sports — legal paths</h2>
        <p>
          There is no single free live feed that works in every country. PlayTape
          embeds official public lives when leagues put them on YouTube, and points
          you to licensed platforms for everything else.
        </p>
      </div>

      <ul className="live-principles">
        {initial.principles.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="live-now">
        <div className="live-now-head">
          <h3>On air now (official embeds)</h3>
          <span className="live-count">
            {initial.live.length
              ? `${initial.live.length} public live${initial.live.length === 1 ? "" : "s"}`
              : "No public lives detected right now"}
          </span>
        </div>

        {initial.live.length === 0 ? (
          <p className="empty-state">
            Official channels are not broadcasting a free public live at the moment.
            Use the country guide below for paid/licensed windows.
          </p>
        ) : (
          <div className="highlight-grid">
            {initial.live.map((stream) => (
              <article key={stream.id} className="highlight-card live-card">
                <button
                  type="button"
                  className="thumb-button"
                  onClick={() => setActive(liveToHighlight(stream))}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={stream.thumbnail} alt="" />
                  <span className="play-glyph" aria-hidden>
                    ▶
                  </span>
                  <span className="live-badge">Live</span>
                  <span className="sport-tag">{SPORT_LABELS[stream.sport]}</span>
                </button>
                <div className="card-body">
                  <p className="source-line">{stream.sourceName}</p>
                  <h3>
                    <button type="button" onClick={() => setActive(liveToHighlight(stream))}>
                      {stream.title}
                    </button>
                  </h3>
                  <a
                    className="watch-link"
                    href={stream.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open on YouTube
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="live-footnote">{initial.note}</p>
      </div>

      <div className="live-guide">
        <h3>Where to watch live legally</h3>
        <div className="region-buttons" role="group" aria-label="Live watch country">
          {initial.guides.map((g) => (
            <button
              key={g.code}
              type="button"
              className={`region-btn ${region === g.code ? "is-active" : ""}`}
              aria-pressed={region === g.code}
              onClick={() => setRegion(g.code)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="platform-list">
          <h4>{guide.label}</h4>
          <ul>
            {guide.platforms.map((p) => (
              <li key={`${guide.code}-${p.name}`}>
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.name}
                </a>
                <span className="platform-sports">
                  {" "}
                  · {p.sports.map((s) => SPORT_LABELS[s]).join(", ")}
                </span>
                {p.notes ? <p className="platform-note">{p.notes}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PlayerModal highlight={active} onClose={() => setActive(null)} />
    </section>
  );
}
