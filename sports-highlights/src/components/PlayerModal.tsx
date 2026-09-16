"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Highlight } from "@/lib/types";
import { SPORT_LABELS } from "@/lib/sources";
import { buildEmbedUrl } from "@/lib/embed";

type Props = {
  highlight: Highlight | null;
  onClose: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId?: string;
          host?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YtPlayer }) => void;
            onError?: (e: { data: number }) => void;
          };
        },
      ) => YtPlayer;
      PlayerState?: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  destroy: () => void;
  playVideo: () => void;
  getAvailableQualityLevels?: () => string[];
  setPlaybackQuality?: (q: string) => void;
  getPlaybackQuality?: () => string;
  getIframe?: () => HTMLIFrameElement;
};

const YT_ERROR_HELP: Record<number, string> = {
  2: "This clip reference is invalid.",
  5: "HTML5 playback is unavailable in this browser.",
  100: "This video was removed or made private by the publisher.",
  101: "The publisher disabled embedding for this video.",
  150: "The publisher disabled embedding for this video.",
};

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector("script[data-playtape-yt]")) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.playtapeYt = "1";
      document.head.appendChild(script);
    }
  });
}

function preferHighestQuality(player: YtPlayer) {
  const levels = player.getAvailableQualityLevels?.() ?? [];
  if (!levels.length || !player.setPlaybackQuality) return null;
  const order = ["highres", "hd2160", "hd1440", "hd1080", "hd720", "large", "medium"];
  const best = order.find((q) => levels.includes(q)) ?? levels[0];
  player.setPlaybackQuality(best);
  return best;
}

export function PlayerModal({ highlight, onClose }: Props) {
  const mountId = useId().replace(/:/g, "");
  const playerRef = useRef<YtPlayer | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [usingApi, setUsingApi] = useState(false);

  const isYouTube = Boolean(highlight && !highlight.embedUrl.includes("scorebat.com"));

  const fallbackSrc = useMemo(() => {
    if (!highlight) return "";
    return buildEmbedUrl(highlight, { autoplay: true, preferHd: true });
  }, [highlight]);

  useEffect(() => {
    if (!highlight) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [highlight, onClose]);

  useEffect(() => {
    if (!highlight || !isYouTube) return;

    let cancelled = false;
    setPlayError(null);
    setQuality(null);
    setUsingApi(false);

    (async () => {
      try {
        await loadYouTubeApi();
        if (cancelled || !window.YT?.Player) return;

        const host = document.getElementById(`yt-host-${mountId}`);
        if (!host) return;

        playerRef.current?.destroy();
        playerRef.current = new window.YT.Player(host, {
          videoId: highlight.videoId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            // Request the highest stream the account/region allows; YouTube still adapts.
            vq: "hd1080",
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              setUsingApi(true);
              e.target.playVideo();
              const chosen = preferHighestQuality(e.target);
              setQuality(chosen ?? e.target.getPlaybackQuality?.() ?? "auto");
              // Retry once after buffers start — levels often appear after play begins.
              window.setTimeout(() => {
                if (cancelled) return;
                const again = preferHighestQuality(e.target);
                if (again) setQuality(again);
              }, 1200);
            },
            onError: (e) => {
              if (cancelled) return;
              setPlayError(
                YT_ERROR_HELP[e.data] ??
                  "This clip is not available for embedded playback here (often a regional rights limit).",
              );
            },
          },
        });
      } catch {
        if (!cancelled) {
          setPlayError(
            "Could not start the enhanced YouTube player. Use the official source link below.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [highlight, isYouTube, mountId]);

  if (!highlight) return null;

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label={highlight.title}>
      <button type="button" className="modal-backdrop" aria-label="Close player" onClick={onClose} />
      <div className="modal-panel">
        <header className="modal-header">
          <div>
            <p className="source-line">
              {highlight.sourceName} · {SPORT_LABELS[highlight.sport]}
            </p>
            <h2>{highlight.title}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="player-frame">
          {isYouTube ? (
            <div id={`yt-host-${mountId}`} className="yt-host" />
          ) : (
            <iframe
              src={fallbackSrc}
              title={highlight.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
          {isYouTube && !usingApi && !playError ? (
            <iframe
              className="yt-fallback-iframe"
              src={fallbackSrc}
              title={highlight.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : null}
        </div>

        <div className="player-meta-row">
          <p className="modal-note">
            Official publisher stream only — PlayTape does not download, re-encode, or AI-alter
            video or audio. YouTube serves the highest quality and original sound available for
            your connection and region
            {quality ? ` (requested: ${quality})` : ""}.
          </p>
          {quality ? <span className="quality-pill">Stream: {quality}</span> : null}
        </div>

        {playError ? (
          <div className="availability-box" role="status">
            <strong>Not available here</strong>
            <p>{playError}</p>
            <p>
              Rights holders decide where a clip may play. PlayTape will not route around
              territorial licensing or local law.
            </p>
          </div>
        ) : null}

        <div className="watch-options">
          <h3>Lawful watch options</h3>
          <ul>
            <li>
              <a href={highlight.watchUrl} target="_blank" rel="noopener noreferrer">
                Open on YouTube / official page
              </a>
              <span> — plays whatever the publisher licenses for your country</span>
            </li>
            <li>
              Use your country’s licensed sports apps or broadcasters for local rights windows.
            </li>
            <li>
              PlayTape does <strong>not</strong> provide or recommend VPNs to bypass geo-blocks;
              that can violate publisher licenses and local regulations.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
