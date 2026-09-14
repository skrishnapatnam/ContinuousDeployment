import { NextResponse } from "next/server";

import {
  DEFAULT_MIN_ROI_MULTIPLE,
  scanKalshiMoneyOpportunities,
} from "@/lib/kalshi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const minRoiMultiple = numberParam(
    searchParams.get("minRoiMultiple"),
    DEFAULT_MIN_ROI_MULTIPLE,
  );
  const minProbability = numberParam(searchParams.get("minProbability"), 0);
  const maxAskRaw = searchParams.get("maxAsk");
  const maxAsk =
    maxAskRaw == null || maxAskRaw === ""
      ? undefined
      : numberParam(maxAskRaw, Number.NaN);
  const minVolume24h = numberParam(searchParams.get("minVolume24h"), 25);
  const limit = numberParam(searchParams.get("limit"), 15);
  const maxMarkets = numberParam(searchParams.get("maxMarkets"), 2000);
  const query = searchParams.get("query") ?? undefined;

  try {
    const result = await scanKalshiMoneyOpportunities({
      minRoiMultiple,
      minProbability,
      maxAsk: Number.isFinite(maxAsk) ? maxAsk : undefined,
      minVolume24h,
      limit,
      maxMarkets,
      query,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function numberParam(value: string | null, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
