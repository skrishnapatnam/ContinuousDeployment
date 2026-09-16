import { getHighlights } from "../src/lib/highlights";
import { fetchChannelHighlights } from "../src/lib/youtube-rss";
import { SOURCES } from "../src/lib/sources";

async function main() {
  const f1Source = SOURCES.find((s) => s.id === "formula1")!;
  const direct = await fetchChannelHighlights(f1Source, 6);
  console.log("direct f1", direct.length, direct[0]?.title);

  const all = await getHighlights({ sport: "all", limit: 80 });
  console.log(
    "all sports",
    all.sports.map((s) => `${s.id}:${s.count}`).join(" "),
  );
  console.log(
    "f1 in all",
    all.highlights.filter((h) => h.sport === "f1").map((h) => h.title),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
