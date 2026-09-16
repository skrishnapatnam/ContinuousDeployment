import type { SportId } from "./types";

export type LivePlatform = {
  name: string;
  url: string;
  sports: Exclude<SportId, "all">[];
  notes?: string;
};

export type RegionLiveGuide = {
  code: string;
  label: string;
  platforms: LivePlatform[];
};

/**
 * Official / licensed live destinations by viewing country.
 * Links go to rights holders or their public watch hubs — not pirate mirrors.
 */
export const REGION_LIVE_GUIDES: RegionLiveGuide[] = [
  {
    code: "US",
    label: "United States",
    platforms: [
      {
        name: "NBA League Pass / NBA.com",
        url: "https://www.nba.com/watch",
        sports: ["nba"],
      },
      {
        name: "NFL+ / NFL.com",
        url: "https://www.nfl.com/plus/",
        sports: ["nfl"],
      },
      {
        name: "MLB.TV",
        url: "https://www.mlb.com/live-stream-games",
        sports: ["mlb"],
      },
      {
        name: "ESPN / ESPN+",
        url: "https://www.espn.com/watch/",
        sports: ["soccer", "nba", "nfl", "mlb", "nhl", "tennis", "ufc", "f1"],
      },
      {
        name: "Paramount+ (soccer / UEFA windows)",
        url: "https://www.paramountplus.com/",
        sports: ["soccer"],
      },
      {
        name: "Apple TV (MLS Season Pass)",
        url: "https://tv.apple.com/channel/tvs.sbd.7000",
        sports: ["soccer"],
      },
      {
        name: "Fubo / local RSN apps",
        url: "https://www.fubo.tv/",
        sports: ["nba", "nhl", "mlb", "soccer"],
        notes: "Availability varies by ZIP and package.",
      },
    ],
  },
  {
    code: "GB",
    label: "United Kingdom",
    platforms: [
      {
        name: "Sky Sports",
        url: "https://www.skysports.com/watch",
        sports: ["soccer", "cricket", "golf", "f1", "nfl"],
      },
      {
        name: "TNT Sports / discovery+",
        url: "https://www.tntsports.co.uk/",
        sports: ["soccer", "nba", "ufc", "tennis"],
      },
      {
        name: "BBC Sport / iPlayer (selected rights)",
        url: "https://www.bbc.co.uk/sport",
        sports: ["soccer", "cricket", "tennis", "olympics"],
      },
      {
        name: "Premier League (official fixtures)",
        url: "https://www.premierleague.com/",
        sports: ["soccer"],
      },
    ],
  },
  {
    code: "IN",
    label: "India",
    platforms: [
      {
        name: "JioCinema / Viacom18 cricket windows",
        url: "https://www.jiocinema.com/",
        sports: ["cricket"],
      },
      {
        name: "Disney+ Hotstar (selected sports)",
        url: "https://www.hotstar.com/in/sports",
        sports: ["cricket", "soccer", "nba"],
      },
      {
        name: "Sony LIV (selected rights)",
        url: "https://www.sonyliv.com/sports",
        sports: ["cricket", "soccer", "tennis"],
      },
      {
        name: "Fancode",
        url: "https://www.fancode.com/",
        sports: ["cricket", "soccer", "nba"],
      },
    ],
  },
  {
    code: "AU",
    label: "Australia",
    platforms: [
      {
        name: "Kayo Sports",
        url: "https://kayosports.com.au/",
        sports: ["cricket", "soccer", "nba", "tennis", "ufc", "f1"],
      },
      {
        name: "Foxtel / Binge sports windows",
        url: "https://www.foxtel.com.au/",
        sports: ["cricket", "soccer", "nfl"],
      },
      {
        name: "cricket.com.au / CA Live",
        url: "https://www.cricket.com.au/",
        sports: ["cricket"],
      },
      {
        name: "Stan Sport",
        url: "https://www.stan.com.au/sport",
        sports: ["soccer", "tennis", "ufc"],
      },
    ],
  },
  {
    code: "EU",
    label: "European Union",
    platforms: [
      {
        name: "DAZN",
        url: "https://www.dazn.com/",
        sports: ["soccer", "ufc", "nba", "tennis", "f1"],
        notes: "Catalogue differs by EU country.",
      },
      {
        name: "UEFA.tv (free/selected competitions)",
        url: "https://www.uefa.tv/",
        sports: ["soccer"],
      },
      {
        name: "League official apps (LaLiga, Serie A, Bundesliga)",
        url: "https://www.laliga.com/",
        sports: ["soccer"],
      },
      {
        name: "Olympics.com (Games windows)",
        url: "https://www.olympics.com/en/watch",
        sports: ["olympics"],
      },
    ],
  },
  {
    code: "OTHER",
    label: "Other countries",
    platforms: [
      {
        name: "Official league / federation site",
        url: "https://www.fifa.com/",
        sports: ["soccer", "cricket", "nba", "nfl", "mlb", "nhl", "tennis", "f1", "ufc", "golf", "olympics"],
        notes: "Start from the sport’s official site and follow “Where to watch” for your country.",
      },
      {
        name: "YouTube official league channels (free lives only)",
        url: "https://www.youtube.com/",
        sports: ["soccer", "cricket", "nba", "nfl", "mlb", "nhl", "tennis", "f1", "ufc", "golf", "olympics"],
        notes: "Only when the rights holder posts a public live broadcast for your region.",
      },
    ],
  },
];

export const LIVE_LEGAL_SUMMARY = [
  "Live sports rights are sold by country — one global free embed for every match does not exist legally.",
  "Best approach: embed only official free lives (YouTube/league embeds) when the publisher enables them, and deep-link everyone else to their local licensed platform.",
  "ScoreBat (paid) can supply official soccer live embeds when leagues publish public streams — still not a paywall bypass.",
  "Never use IPTV scrapers, unauthorized mirrors, or VPNs to unlock another country’s exclusive window.",
];
