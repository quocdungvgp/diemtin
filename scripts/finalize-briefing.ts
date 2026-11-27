/**
 * Chạy sau khi Claude (lịch 08:20) đã sửa public/data/briefings/<date>.json:
 * kiểm tra cấu trúc, tính lại trạng thái hiệu lực + KPI, cập nhật index.json và legal-documents.json.
 *   npm run briefing:finalize -- 2026-11-27
 */
import { isValidDate, todayVN } from "../src/lib/date";
import { PILLARS } from "../src/lib/pillars";
import { deriveStatus } from "../src/lib/pipeline/ai";
import { loadBriefing, saveBriefing } from "../src/lib/pipeline/storage";

const PIDS = new Set(PILLARS.map((p) => p.id as string));

(async () => {
  const date = isValidDate(process.argv[2]) ? process.argv[2] : todayVN();
  const b = await loadBriefing(date);
  if (!b) throw new Error(`Không có public/data/briefings/${date}.json`);
  const errs: string[] = [];
  b.legalDocuments = b.legalDocuments.map((d, i) => {
    const arr = <T,>(x: T[] | undefined) => (Array.isArray(x) ? x : []);
    if (!d.docNumber) errs.push(`doc[${i}] thiếu docNumber`);
    const okDate = (s: string | null | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
    const issueDate = okDate(d.issueDate);
    const effectiveDate = okDate(d.effectiveDate);
    return {
      ...d,
      id: d.id || `doc-${i + 1}`,
      issueDate,
      effectiveDate,
      status: deriveStatus(issueDate, effectiveDate, date),
      pillars: arr(d.pillars).filter((p) => PIDS.has(p)),
      impactBullets: arr(d.impactBullets).slice(0, 3),
      relatedDocs: arr(d.relatedDocs),
      affectedSubjects: arr(d.affectedSubjects),
      comparisons: arr(d.comparisons),
      actionItems: arr(d.actionItems),
      keyQuotes: arr(d.keyQuotes).slice(0, 3),
    };
  });
  b.legalDocuments.sort((x, y) => Number(y.isHot) - Number(x.isHot));
  if (b.legalDocuments.some((d) => d.enriched) && !b.enrichedAt) b.enrichedAt = new Date().toISOString();
  await saveBriefing(b);
  console.log(`Finalize ${date}: ${b.legalDocuments.length} văn bản (${b.legalDocuments.filter((d) => d.enriched).length} đã phân tích)`);
  if (errs.length) console.warn("Cảnh báo:\n" + errs.join("\n"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
