import { NextRequest, NextResponse } from "next/server";
import { getLive } from "@/lib/live";

export async function GET(request: NextRequest) {
  const sport = request.nextUrl.searchParams.get("sport");
  try {
    const data = await getLive({ sport });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load live sports" }, { status: 500 });
  }
}
