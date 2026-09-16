export type SportId =
  | "all"
  | "soccer"
  | "cricket"
  | "nba"
  | "nfl"
  | "mlb"
  | "nhl"
  | "tennis"
  | "f1"
  | "ufc"
  | "golf"
  | "olympics";

export type HighlightSource = {
  id: string;
  name: string;
  sport: Exclude<SportId, "all">;
  channelId: string;
  /** Optional: prefer titles matching these (case-insensitive). Empty = keep recent uploads. */
  preferKeywords?: string[];
  /** Cap how many clips this source contributes to the mixed feed. */
  maxItems?: number;
};

export type Highlight = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  videoId: string;
  embedUrl: string;
  watchUrl: string;
  sourceId: string;
  sourceName: string;
  sport: Exclude<SportId, "all">;
};

export type HighlightsResponse = {
  fetchedAt: string;
  count: number;
  highlights: Highlight[];
  sports: { id: SportId; label: string; count: number }[];
  sources: { id: string; name: string; sport: string }[];
};
