import { NextResponse } from "next/server";

import { scanKalshiMoneyOpportunities } from "@/lib/kalshi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const minProbability = numberParam(searchParams.get("minProbability"), 0.85);
  const maxAsk = numberParam(searchParams.get("maxAsk"), 0.97);
  const minVolume24h = numberParam(searchParams.get("minVolume24h"), 25);
  const limit = numberParam(searchParams.get("limit"), 15);
  const maxMarkets = numberParam(searchParams.get("maxMarkets"), 4000);
  const query = searchParams.get("query") ?? undefined;

  try {
    const result = await scanKalshiMoneyOpportunities({
      minProbability,
      maxAsk,
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
