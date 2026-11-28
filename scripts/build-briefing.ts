/**
 * Chạy pipeline 1 lần và ghi ra public/data (GitHub Actions gọi lúc ~06:17 VN).
 *   npm run briefing:build                 → hôm nay
 *   npm run briefing:build -- 2026-11-27   → ngày chỉ định
 * AI_PROVIDER: none (mặc định trên GitHub) | ollama | anthropic
 */
import "dotenv/config";
import { isValidDate } from "../src/lib/date";
import { runDailyBriefing } from "../src/lib/pipeline/run";

const arg = process.argv[2];
runDailyBriefing({ date: isValidDate(arg) ? arg : undefined })
  .then((b) => {
    console.log(`OK ${b.date}: ${b.kpis.totalNewDocs} văn bản, ${b.analyses.length} phân tích, ${b.news.length} tin`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
