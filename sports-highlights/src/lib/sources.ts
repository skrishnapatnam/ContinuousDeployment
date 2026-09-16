import type { HighlightSource, SportId } from "./types";

/** Official league / broadcaster YouTube channels — embeds are licensed via YouTube. */
export const SOURCES: HighlightSource[] = [
  // Soccer
  {
    id: "premier-league",
    name: "Premier League",
    sport: "soccer",
    channelId: "UCG5qGWdu8nIRZqJ_GgDwQ-w",
    preferKeywords: ["highlight", "goal", "best", "top"],
  },
  {
    id: "uefa",
    name: "UEFA",
    sport: "soccer",
    channelId: "UCyGa1YEx9ST66rYrJTGIKOw",
    preferKeywords: ["highlight", "goal", "best", "top"],
  },
  {
    id: "laliga",
    name: "LALIGA",
    sport: "soccer",
    channelId: "UCTv-XvfzLX3i4IGWAm4sbmA",
    preferKeywords: ["highlight", "goal", "gol", "best"],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    sport: "soccer",
    channelId: "UC6UL29enLNe4mqwTfAyeNuw",
    preferKeywords: ["highlight", "goal", "best", "top"],
  },
  {
    id: "serie-a",
    name: "Serie A",
    sport: "soccer",
    channelId: "UCBJeMCIeLQos7wacox4hmLQ",
    preferKeywords: ["highlight", "goal", "best"],
  },
  {
    id: "mls",
    name: "Major League Soccer",
    sport: "soccer",
    channelId: "UCSZbXT5TLLW_i-5W8FZpFsg",
    preferKeywords: ["highlight", "goal", "best"],
  },
  // Cricket
  {
    id: "icc",
    name: "ICC",
    sport: "cricket",
    channelId: "UCt2JXOLNxqry7B_4rRZME3Q",
    preferKeywords: ["highlight", "wicket", "six", "best", "match"],
  },
  {
    id: "cricket-com-au",
    name: "cricket.com.au",
    sport: "cricket",
    channelId: "UCkBY0aHJP9BwjZLDYxAQrKg",
    preferKeywords: ["highlight", "wicket", "best", "match"],
  },
  {
    id: "sky-sports-cricket",
    name: "Sky Sports Cricket",
    sport: "cricket",
    channelId: "UCkd4takjjF1EGD1TKIK2QiA",
    preferKeywords: ["highlight", "wicket", "best"],
  },
  // Basketball
  {
    id: "nba",
    name: "NBA",
    sport: "nba",
    channelId: "UCWJ2lWNubArHWmf3FIHbfcQ",
    preferKeywords: ["highlight", "top", "best", "dunk", "play"],
  },
  {
    id: "house-of-highlights",
    name: "House of Highlights",
    sport: "nba",
    channelId: "UCqQo7ewe87aYAe7ub5UqXMw",
    preferKeywords: ["highlight", "best", "top"],
    maxItems: 3,
  },
  // American football
  {
    id: "nfl",
    name: "NFL",
    sport: "nfl",
    channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg",
    preferKeywords: ["highlight", "top", "best", "touchdown"],
  },
  // Baseball
  {
    id: "mlb",
    name: "MLB",
    sport: "mlb",
    channelId: "UCoLrcjPV5PbUrUyXq5mjc_A",
    preferKeywords: ["highlight", "home run", "best", "top"],
  },
  // Hockey
  {
    id: "nhl",
    name: "NHL",
    sport: "nhl",
    channelId: "UCqFMzb-4AUf6WAIbl132QKA",
    preferKeywords: ["highlight", "goal", "best", "top"],
  },
  // Tennis
  {
    id: "atp",
    name: "ATP Tour",
    sport: "tennis",
    channelId: "UCY_5h5zaSwN7Or4kIJDYNXA",
    preferKeywords: ["highlight", "best", "point", "shot"],
  },
  {
    id: "wta",
    name: "WTA",
    sport: "tennis",
    channelId: "UCaBIVVpHjq6j3tSyxwTE-8Q",
    preferKeywords: ["highlight", "best", "point"],
  },
  // F1
  {
    id: "formula1",
    name: "FORMULA 1",
    sport: "f1",
    channelId: "UCB_qr75-ydFVKSF9Dmo6izg",
    preferKeywords: ["highlight", "best", "overtake", "race"],
  },
  // Combat
  {
    id: "ufc",
    name: "UFC",
    sport: "ufc",
    channelId: "UCvgfXK4nTYKudb0rFR6noLA",
    preferKeywords: ["highlight", "knockout", "finish", "best"],
  },
  // Golf
  {
    id: "pga-tour",
    name: "PGA Tour",
    sport: "golf",
    channelId: "UCKwGZZMrhNYKzucCtTPY2Nw",
    preferKeywords: ["highlight", "best", "shot"],
  },
  // Multi / Olympics
  {
    id: "olympics",
    name: "Olympic Games",
    sport: "olympics",
    channelId: "UCTl3QQTvqHFjurroKxexy2Q",
    preferKeywords: ["highlight", "best", "final", "gold"],
  },
  {
    id: "espn",
    name: "ESPN",
    sport: "nba",
    channelId: "UCiWLfSweyRNmLpgEHekhoAg",
    preferKeywords: ["highlight", "top", "best", "plays"],
    maxItems: 4,
  },
  {
    id: "bleacher-report",
    name: "Bleacher Report",
    sport: "nba",
    channelId: "UC9-OpMMVoNP5o10_Iyq7Ndw",
    preferKeywords: ["highlight", "top", "best"],
    maxItems: 3,
  },
];

export const SPORT_LABELS: Record<SportId, string> = {
  all: "All sports",
  soccer: "Soccer",
  cricket: "Cricket",
  nba: "NBA",
  nfl: "NFL",
  mlb: "Baseball",
  nhl: "Hockey",
  tennis: "Tennis",
  f1: "Formula 1",
  ufc: "UFC",
  golf: "Golf",
  olympics: "Olympics",
};

export const SPORT_ORDER: SportId[] = [
  "all",
  "soccer",
  "cricket",
  "nba",
  "nfl",
  "mlb",
  "nhl",
  "tennis",
  "f1",
  "ufc",
  "golf",
  "olympics",
];

export function sourcesForSport(sport: SportId): HighlightSource[] {
  if (sport === "all") return SOURCES;
  return SOURCES.filter((s) => s.sport === sport);
}
