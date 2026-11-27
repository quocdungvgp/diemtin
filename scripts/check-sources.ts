/** Kiểm tra từng nguồn: còn sống không, lấy được bao nhiêu mục */
import "dotenv/config";
import { collectHtml, collectPlaywright, collectRss } from "../src/lib/pipeline/collect";
import { DEFAULT_SOURCES } from "../src/lib/pipeline/sources";

(async () => {
  const since = new Date(Date.now() - 48 * 3600 * 1000);
  for (const s of DEFAULT_SOURCES) {
    try {
      const items = s.kind === "rss" ? await collectRss(s, since) : s.kind === "playwright" ? await collectPlaywright(s) : await collectHtml(s);
      console.log(`✓ ${String(items.length).padStart(3)}  ${s.name.padEnd(38)} ${s.url}`);
      if (s.stream === "legal" && items[0]) console.log(`       vd: ${items[0].title.slice(0, 90)}`);
    } catch (e) {
      console.log(`✗  ERR  ${s.name.padEnd(38)} ${s.url} — ${(e as Error).message}`);
    }
  }
})();
