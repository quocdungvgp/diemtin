import { formatDateVN } from "./date";
import { NEWS_CATEGORIES, PILLARS, PILLAR_MAP, STATUS_LABEL } from "./pillars";
import type { DailyBriefing, LegalDocument } from "./types";

const REL: Record<string, string> = {
  "thay-the": "Thay thế",
  "sua-doi": "Sửa đổi",
  "bai-bo": "Bãi bỏ",
  "huong-dan": "Hướng dẫn",
  "dan-chieu": "Dẫn chiếu",
};

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

export function docToMarkdown(d: LegalDocument): string {
  const L: string[] = [];
  L.push(`### ${d.docNumber} — ${d.title}`);
  L.push("");
  L.push(`- **Cơ quan ban hành:** ${d.issuer}`);
  L.push(`- **Ngày ban hành:** ${formatDateVN(d.issueDate)} · **Hiệu lực:** ${formatDateVN(d.effectiveDate)} (${STATUS_LABEL[d.status].label})`);
  L.push(`- **Trụ cột:** ${d.pillars.map((p) => PILLAR_MAP[p].name).join(", ")}`);
  if (d.relatedDocs.length)
    L.push(`- **Văn bản liên quan:** ${d.relatedDocs.map((r) => `${REL[r.relation] ?? r.relation} ${r.docNumber}${r.note ? ` (${r.note})` : ""}`).join("; ")}`);
  L.push("");
  L.push(d.summary);
  if (d.affectedSubjects.length) {
    L.push("", "**Đối tượng chịu tác động tại TP.HCM:**");
    d.affectedSubjects.forEach((s) => L.push(`- ${s}`));
  }
  if (d.comparisons.length) {
    L.push("", "| Nội dung | Quy định cũ | Quy định mới | Điều khoản |", "|---|---|---|---|");
    d.comparisons.forEach((c) => L.push(`| ${cell(c.topic)} | ${cell(c.oldRule)} | ${cell(c.newRule)} | ${cell(c.article ?? "")} |`));
  }
  if (d.actionItems.length) {
    L.push("", "**Hành động / Lưu ý thực thi:**");
    d.actionItems.forEach((a) => L.push(`- [ ] ${a.action}${a.target ? ` — _${a.target}_` : ""}${a.deadline ? ` (trước ${formatDateVN(a.deadline)})` : ""}`));
  }
  if (d.keyQuotes.length) {
    L.push("");
    d.keyQuotes.forEach((q) => L.push(`> **${q.article}:** ${q.text}`));
  }
  L.push("", `Nguồn: [${d.sourceName}](${d.sourceUrl})`, "");
  return L.join("\n");
}

export function briefingToMarkdown(b: DailyBriefing): string {
  const L: string[] = [];
  L.push(`# ĐIỂM TIN SÁNG 9H00 — ${formatDateVN(b.date, true)}`);
  if (b.isMock) L.push("", "_⚠ Dữ liệu mẫu — không phải văn bản thật._");
  if (b.editorNote) L.push("", `> ${b.editorNote}`);
  L.push("", "## PHẦN I. RADAR VĂN BẢN PHÁP LUẬT MỚI (TÂM ĐIỂM TP.HCM)", "");
  if (!b.legalDocuments.length) L.push("_Không có văn bản mới trong 24h qua._", "");
  b.legalDocuments.forEach((d) => L.push(docToMarkdown(d)));
  L.push("## PHẦN II. PHÂN TÍCH CHUYÊN SÂU THEO 6 TRỤ CỘT", "");
  PILLARS.forEach((p) => {
    const items = b.analyses.filter((a) => a.pillars.includes(p.id));
    if (!items.length) return;
    L.push(`### ${p.name}`, "");
    items.forEach((a) => {
      L.push(`**${a.title}** — [${a.sourceName}](${a.sourceUrl})`, "", a.summary);
      a.keyPoints.forEach((k) => L.push(`- ${k}`));
      L.push("");
    });
  });
  L.push("## PHẦN III. TOÀN CẢNH TIN TỨC 24H", "");
  NEWS_CATEGORIES.forEach((c) => {
    const items = b.news.filter((n) => n.category === c.id);
    if (!items.length) return;
    L.push(`### ${c.name}`);
    items.forEach((n) => L.push(`- **${n.title}** — ${n.summary} ([${n.sourceName}](${n.sourceUrl}))`));
    L.push("");
  });
  return L.join("\n");
}
