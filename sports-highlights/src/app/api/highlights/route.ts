import { NextRequest, NextResponse } from "next/server";
import { getHighlights } from "@/lib/highlights";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get("sport");
  const q = searchParams.get("q");
  const limit = Number(searchParams.get("limit") ?? "72");

  try {
    const data = await getHighlights({ sport, q, limit });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load highlights" },
      { status: 500 },
    );
  }
}
