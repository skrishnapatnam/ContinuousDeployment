"use client";

import { useEffect } from "react";
import type { Highlight } from "@/lib/types";
import { SPORT_LABELS } from "@/lib/sources";

type Props = {
  highlight: Highlight | null;
  onClose: () => void;
};

export function PlayerModal({ highlight, onClose }: Props) {
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
          <iframe
            src={`${highlight.embedUrl}${highlight.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            title={highlight.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <p className="modal-note">
          Playing the official embed from {highlight.sourceName}. Rights stay with the publisher.
        </p>
      </div>
    </div>
  );
}
