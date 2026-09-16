"use client";

import type { Highlight } from "@/lib/types";
import { SPORT_LABELS } from "@/lib/sources";

type Props = {
  highlight: Highlight;
  index: number;
  onOpen: (h: Highlight) => void;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const deltaSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(deltaSec);
  if (abs < 60 * 60) return rtf.format(Math.round(deltaSec / 60), "minute");
  if (abs < 60 * 60 * 24) return rtf.format(Math.round(deltaSec / 3600), "hour");
  return rtf.format(Math.round(deltaSec / 86400), "day");
}

export function HighlightCard({ highlight, index, onOpen }: Props) {
  return (
    <article
      className="highlight-card"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button type="button" className="thumb-button" onClick={() => onOpen(highlight)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={highlight.thumbnail}
          alt=""
          loading={index < 6 ? "eager" : "lazy"}
        />
        <span className="play-glyph" aria-hidden>
          ▶
        </span>
        <span className="sport-tag">{SPORT_LABELS[highlight.sport]}</span>
      </button>
      <div className="card-body">
        <p className="source-line">
          {highlight.sourceName}
          <span aria-hidden> · </span>
          <time dateTime={highlight.publishedAt}>{formatWhen(highlight.publishedAt)}</time>
        </p>
        <h3>
          <button type="button" onClick={() => onOpen(highlight)}>
            {highlight.title}
          </button>
        </h3>
        <a
          className="watch-link"
          href={highlight.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on source
        </a>
      </div>
    </article>
  );
}
