import type { HighlightSource } from "./types";

export type LiveStream = {
  id: string;
  title: string;
  videoId: string;
  embedUrl: string;
  watchUrl: string;
  thumbnail: string;
  sourceId: string;
  sourceName: string;
  sport: HighlightSource["sport"];
  isLive: boolean;
};

function decodeBasic(s: string): string {
  return s
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&");
}

/**
 * Detect a public live broadcast on an official YouTube channel page.
 * Uses only publisher-facing /live pages — no stream ripping.
 */
export async function fetchChannelLive(
  source: HighlightSource,
): Promise<LiveStream | null> {
  const url = `https://www.youtube.com/channel/${source.channelId}/live`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 120 },
      headers: {
        Accept: "text/html",
        "User-Agent":
          "Mozilla/5.0 (compatible; PlayTape/1.0; +https://github.com/playtape)",
        "Accept-Language": "en-US,en;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();

    const hasLiveNow = /"isLiveNow"\s*:\s*true/.test(html);
    const hasLiveContent = /"isLiveContent"\s*:\s*true/.test(html);
    const hasLiveFlag = /"isLive"\s*:\s*true/.test(html);
    const hasLiveMeta = /itemprop="isLiveBroadcast"\s+content="True"/i.test(html);
    const isLive = hasLiveNow || hasLiveMeta || (hasLiveFlag && hasLiveContent) || hasLiveFlag;

    if (!isLive) return null;

    const videoMatch =
      html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/) ||
      html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoId = videoMatch?.[1];
    if (!videoId) return null;

    let title = `${source.name} Live`;
    const titleMatch =
      html.match(/"videoDetails":\{"videoId":"[^"]+","title":"([^"]+)"/) ||
      html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
      html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
    if (titleMatch?.[1]) title = decodeBasic(titleMatch[1]);

    // Drop obvious archive / old tournament pages that still sit on /live
    const yearMatch = title.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = Number(yearMatch[1]);
      const currentYear = new Date().getUTCFullYear();
      if (year < currentYear - 0) {
        // Allow current calendar year only for dated titles
        return null;
      }
    }
    if (/ended|replay|full match replay|highlights only/i.test(title)) {
      return null;
    }

    return {
      id: `live:${source.id}:${videoId}`,
      title,
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&playsinline=1`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      sourceId: source.id,
      sourceName: source.name,
      sport: source.sport,
      isLive: true,
    };
  } catch (err) {
    console.warn(`Live check failed for ${source.id}`, err);
    return null;
  }
}
