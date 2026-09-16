"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import type { Highlight, HighlightsResponse, SportId } from "@/lib/types";
import { SPORT_LABELS, SPORT_ORDER } from "@/lib/sources";
import { HighlightCard } from "./HighlightCard";
import { PlayerModal } from "./PlayerModal";

type Props = {
  initial: HighlightsResponse;
};

export function HighlightsExplorer({ initial }: Props) {
  const [sport, setSport] = useState<SportId>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [data, setData] = useState(initial);
  const [active, setActive] = useState<Highlight | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function load(nextSport: SportId, nextQuery: string) {
    setError(null);
    const params = new URLSearchParams();
    if (nextSport !== "all") params.set("sport", nextSport);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    const res = await fetch(`/api/highlights?${params.toString()}`);
    if (!res.ok) {
      setError("Could not refresh highlights. Showing the last good feed.");
      return;
    }
    const json = (await res.json()) as HighlightsResponse;
    setData(json);
  }

  function onSportChange(next: SportId) {
    setSport(next);
    startTransition(() => {
      void load(next, query);
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      void load(sport, query);
    });
  }

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return data.highlights;
    return data.highlights.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        h.sourceName.toLowerCase().includes(q) ||
        SPORT_LABELS[h.sport].toLowerCase().includes(q),
    );
  }, [data.highlights, deferredQuery]);

  return (
    <section id="feed" className="feed-section">
      <div className="feed-toolbar">
        <div className="sport-rail" role="tablist" aria-label="Filter by sport">
          {SPORT_ORDER.map((id) => {
            const count =
              id === "all"
                ? data.count
                : data.sports.find((s) => s.id === id)?.count;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={sport === id}
                className={`sport-chip ${sport === id ? "is-active" : ""}`}
                onClick={() => onSportChange(id)}
              >
                <span>{SPORT_LABELS[id]}</span>
                {typeof count === "number" && sport === "all" && id !== "all" ? (
                  <em>{count}</em>
                ) : null}
              </button>
            );
          })}
        </div>

        <form className="search-form" onSubmit={onSearchSubmit}>
          <label className="sr-only" htmlFor="highlight-search">
            Search highlights
          </label>
          <input
            id="highlight-search"
            type="search"
            placeholder="Search teams, leagues, plays…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="feed-meta" aria-live="polite">
        <p>
          {isPending ? "Refreshing…" : `${visible.length} legal clips`}
          <span> · Sources update about every 15 minutes</span>
        </p>
        {error ? <p className="feed-error">{error}</p> : null}
      </div>

      {visible.length === 0 ? (
        <p className="empty-state">
          No clips matched that filter. Try another sport or clear the search.
        </p>
      ) : (
        <div className="highlight-grid">
          {visible.map((highlight, index) => (
            <HighlightCard
              key={highlight.id}
              highlight={highlight}
              index={index}
              onOpen={setActive}
            />
          ))}
        </div>
      )}

      <PlayerModal highlight={active} onClose={() => setActive(null)} />
    </section>
  );
}
