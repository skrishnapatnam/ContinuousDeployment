/** Build publisher embed URLs with the best lawful quality hints. */

export function buildEmbedUrl(
  highlight: { embedUrl: string; videoId: string },
  opts: { autoplay?: boolean; preferHd?: boolean } = {},
): string {
  const { autoplay = false, preferHd = true } = opts;
  const raw = highlight.embedUrl;

  // ScoreBat and other third-party embeds: leave intact.
  if (raw.includes("scorebat.com") || !raw.includes("youtube")) {
    if (!autoplay) return raw;
    const join = raw.includes("?") ? "&" : "?";
    return `${raw}${join}autoplay=1`;
  }

  const base = `https://www.youtube-nocookie.com/embed/${highlight.videoId}`;
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });
  if (preferHd) {
    // Hint only — YouTube still chooses adaptive bitrate/audio.
    params.set("vq", "hd1080");
  }
  return `${base}?${params.toString()}`;
}
