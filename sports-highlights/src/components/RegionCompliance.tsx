"use client";

import { useMemo, useState } from "react";

type RegionOption = {
  code: string;
  label: string;
  note: string;
};

const REGIONS: RegionOption[] = [
  {
    code: "auto",
    label: "Browser locale",
    note: "We use your browser locale as a soft hint only — never to bypass rights checks.",
  },
  {
    code: "US",
    label: "United States",
    note: "Prefer league apps and US rights holders (e.g. official NBA/NFL/MLB YouTube where licensed).",
  },
  {
    code: "GB",
    label: "United Kingdom",
    note: "Prefer UK-licensed broadcasters and official league channels available in the UK.",
  },
  {
    code: "IN",
    label: "India",
    note: "Prefer India-licensed cricket/soccer platforms and official channels available locally.",
  },
  {
    code: "AU",
    label: "Australia",
    note: "Prefer Australian rights holders and cricket.com.au / league feeds licensed for AU.",
  },
  {
    code: "EU",
    label: "European Union",
    note: "Follow your member state’s licensed platforms; EU portability rules don’t override sports exclusives.",
  },
  {
    code: "OTHER",
    label: "Other",
    note: "Open each clip on the publisher’s page — they enforce the correct country license.",
  },
];

function browserLocaleRegion(): string {
  if (typeof navigator === "undefined") return "OTHER";
  const loc = navigator.language || "en";
  const parts = loc.split("-");
  const region = (parts[1] || parts[0] || "").toUpperCase();
  if (["US", "GB", "IN", "AU"].includes(region)) return region;
  if (region.length === 2) return "EU";
  return "OTHER";
}

export function RegionCompliance() {
  const [choice, setChoice] = useState("auto");
  const effective = choice === "auto" ? browserLocaleRegion() : choice;
  const selected = useMemo(
    () => REGIONS.find((r) => r.code === effective) ?? REGIONS[REGIONS.length - 1],
    [effective],
  );

  return (
    <section className="compliance-section" id="compliance" aria-labelledby="compliance-title">
      <div className="section-copy">
        <h2 id="compliance-title">Watch by the rules</h2>
        <p>
          Sports highlights are licensed by country. PlayTape only uses official embeds and never
          downloads, AI-upscales, re-encodes, or VPN-routes clips to dodge geo-blocks.
        </p>
      </div>

      <div className="compliance-grid">
        <div className="region-picker">
          <span id="region-label">Where are you watching from?</span>
          <div className="region-buttons" role="group" aria-labelledby="region-label">
            {REGIONS.map((r) => (
              <button
                key={r.code}
                type="button"
                className={`region-btn ${choice === r.code ? "is-active" : ""}`}
                aria-pressed={choice === r.code}
                onClick={() => setChoice(r.code)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="compliance-card" id="region-guidance">
          <h3>Local guidance</h3>
          <p>{selected.note}</p>
          <ul>
            <li>
              If an embed says unavailable, use <strong>Open on source</strong> or a local licensed
              app.
            </li>
            <li>
              Quality and audio come from the publisher&apos;s stream (adaptive HD) — we don&apos;t
              alter them.
            </li>
            <li>
              VPNs that hide location to unlock blocked sports rights can breach license terms and,
              in some places, local law. PlayTape will not integrate that.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
