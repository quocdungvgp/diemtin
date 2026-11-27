import Anthropic from "@anthropic-ai/sdk";
import { PILLARS } from "../pillars";
import type { DocStatus, LegalDocument, NewsCategory, PillarAnalysis, PillarId } from "../types";
import type { RawArticle } from "./collect";

const client = () => new Anthropic(); // đọc ANTHROPIC_API_KEY từ env
const TRIAGE_MODEL = () => process.env.AI_TRIAGE_MODEL || "claude-haiku-5-5";
const LEGAL_MODEL = () => process.env.AI_LEGAL_MODEL || "claude-sonnet-5-5";

const PILLAR_IDS = PILLARS.map((p) => p.id);
const PILLAR_GUIDE = PILLARS.map((p) => `- ${p.id}: ${p.name} — ${p.scope}`).join("\n");

export type AiProvider = "anthropic" | "ollama" | "none";
export const aiProvider = (): AiProvider => {
  const p = (process.env.AI_PROVIDER || "").toLowerCase();
  if (p === "anthropic" || p === "ollama" || p === "none") return p;
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "none";
};

/** Gọi model và ép trả JSON đúng schema (Claude: tool-use · Ollama: structured outputs) */
async function callJson<T>(opts: {
  model: string;
  system: string;
  user: string;
  toolName: string;
  schema: Record<string, unknown>;
  maxTokens: number;
}): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (aiProvider() === "ollama") return await callOllama<T>(opts);
      const res = await client().messages.create({
        model: opts.model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        tools: [{ name: opts.toolName, description: "Trả kết quả có cấu trúc", input_schema: opts.schema as Anthropic.Tool.InputSchema }],
        tool_choice: { type: "tool", name: opts.toolName },
        messages: [{ role: "user", content: opts.user }],
      });
      const block = res.content.find((b) => b.type === "tool_use");
      if (!block || block.type !== "tool_use") throw new Error("Model không trả tool_use");
      return block.input as T;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** Ollama chạy local (mặc định http://localhost:11434) — không cần API key */
async function callOllama<T>(opts: { system: string; user: string; schema: Record<string, unknown>; maxTokens: number }): Promise<T> {
  const base = process.env.OLLAMA_URL || "http://localhost:11434";
  const numCtx = Number(process.env.OLLAMA_NUM_CTX || 16384);
  // cắt bớt đầu vào cho vừa context model local (~3 ký tự tiếng Việt / token)
  const room = Math.max(4000, (numCtx - opts.maxTokens - 1500) * 3);
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "qwen2.5:14b",
      stream: false,
      format: opts.schema,
      options: { temperature: 0.1, num_ctx: numCtx, num_predict: opts.maxTokens },
      messages: [
        { role: "system", content: opts.system + "\nTrả lời DUY NHẤT bằng JSON đúng schema, nội dung tiếng Việt." },
        { role: "user", content: opts.user.slice(0, room) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return JSON.parse(data.message?.content ?? "{}") as T;
}

// ───────────────────────── TẦNG 1: TRIAGE & TAGGING ─────────────────────────

export interface TriageResult {
  id: string;
  keep: boolean;
  reason?: "quang-cao" | "trung" | "khong-lien-quan" | "ok";
  kind: "van-ban" | "phan-tich" | "chi-dao" | "tin-tuc";
  category: NewsCategory | null;
  pillars: PillarId[];
  isHot: boolean;
  priority: number; // 1–5
  summary: string;
}

const TRIAGE_SYSTEM = `Bạn là biên tập viên bản tin sáng cho một đơn vị tư vấn xây dựng & bồi thường GPMB tại TP.HCM.
Nhiệm vụ: phân loại nhanh từng tin đầu vào.
- Loại bỏ (keep=false): quảng cáo/PR bất động sản, rao bán dự án, tin trùng nội dung với tin khác trong lô (giữ bản đầy đủ nhất), tin giải trí/thể thao/đời sống không liên quan.
- kind: "van-ban" nếu là văn bản QPPL/QCVN/TCVN/công văn chỉ đạo gốc mới ban hành (hoặc tin thông báo văn bản mới có số hiệu cụ thể); "chi-dao" nếu là chỉ đạo điều hành của UBND TP.HCM/Sở ngành; "phan-tich" nếu là bài phân tích, giải đáp pháp lý; còn lại "tin-tuc".
- pillars: chỉ gắn khi nội dung thực sự tác động tới một trong 6 trụ cột:
${PILLAR_GUIDE}
  Ưu tiên phạm vi TP.HCM và văn bản trung ương áp dụng trực tiếp cho TP.HCM.
- category (cho tin tổng hợp): thoi-su | kinh-te | bat-dong-san | cong-nghe | the-gioi.
- isHot: tác động lớn, cấp bách (thay đổi thẩm quyền, bảng giá đất, hạn chót...).
- priority 1–5 (5 = phải đọc ngay).
- summary: 1–2 câu tiếng Việt, súc tích, nêu "cái mới" và tác động — không lặp tiêu đề.`;

const TRIAGE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          keep: { type: "boolean" },
          reason: { type: "string", enum: ["quang-cao", "trung", "khong-lien-quan", "ok"] },
          kind: { type: "string", enum: ["van-ban", "phan-tich", "chi-dao", "tin-tuc"] },
          category: { type: ["string", "null"], enum: ["thoi-su", "kinh-te", "bat-dong-san", "cong-nghe", "the-gioi", null] },
          pillars: { type: "array", items: { type: "string", enum: PILLAR_IDS } },
          isHot: { type: "boolean" },
          priority: { type: "integer", minimum: 1, maximum: 5 },
          summary: { type: "string" },
        },
        required: ["id", "keep", "kind", "pillars", "isHot", "priority", "summary"],
      },
    },
  },
  required: ["items"],
};

export async function triage(items: RawArticle[], batchSize = aiProvider() === "ollama" ? 12 : 40): Promise<Map<string, TriageResult>> {
  const out = new Map<string, TriageResult>();
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const payload = batch.map((a) => ({
      id: a.id,
      nguon: a.sourceName,
      luong: a.stream,
      chuyen_muc: a.category,
      tieu_de: a.title,
      mo_ta: a.snippet.slice(0, 400),
      goi_y_tru_cot: a.kwPillars,
    }));
    const res = await callJson<{ items: TriageResult[] }>({
      model: TRIAGE_MODEL(),
      system: TRIAGE_SYSTEM,
      user: `Phân loại ${batch.length} tin sau (trả đủ từng id):\n${JSON.stringify(payload)}`,
      toolName: "ket_qua_phan_loai",
      schema: TRIAGE_SCHEMA,
      maxTokens: 8000,
    });
    for (const r of res.items ?? []) {
      out.set(r.id, { ...r, pillars: (r.pillars ?? []).filter((p) => PILLAR_IDS.includes(p)) });
    }
  }
  return out;
}

// ───────────────────────── TẦNG 2: DEEP LEGAL ANALYSIS ─────────────────────────

const LEGAL_SYSTEM = `Bạn là chuyên gia pháp chế lĩnh vực đất đai – xây dựng tại TP.HCM (Luật Đất đai 2024, Luật Xây dựng, Luật Nhà ở, các nghị định hướng dẫn, quy định của UBND TP.HCM).
Đọc TOÀN VĂN văn bản/bài viết và lập "Phiếu Tóm Tắt Tác Động Nghiệp Vụ".
Nguyên tắc bắt buộc:
- Chỉ dùng thông tin có trong nội dung được cung cấp. Không bịa số hiệu, ngày, điều khoản. Không rõ thì để null/mảng rỗng.
- Ngày dạng YYYY-MM-DD.
- comparisons: chỉ so sánh khi văn bản nêu rõ hoặc thay thế/sửa đổi quy định cụ thể; oldRule ghi ngắn gọn quy định trước đây (nếu nội dung cung cấp không nêu, ghi "Chưa xác định từ nội dung văn bản").
- keyQuotes: trích NGUYÊN VĂN, tối đa 3 đoạn quan trọng nhất, mỗi đoạn ≤ 60 từ.
- impactBullets: tối đa 3 gạch đầu dòng, mỗi dòng ≤ 20 từ, nói tác động thực tế cho người làm hồ sơ (xin phép, hoàn công, cấp GCN, bồi thường).
- actionItems: việc cụ thể phải làm (cập nhật biểu mẫu, quy trình thẩm định, hồ sơ thiết kế, khung tên bản vẽ, dự toán bồi thường...), kèm đối tượng thực hiện.
- affectedSubjects: đối tượng chịu tác động trực tiếp tại TP.HCM.
Gắn pillars theo 6 trụ cột:
${PILLAR_GUIDE}`;

const LEGAL_SCHEMA = {
  type: "object",
  properties: {
    isRelevant: { type: "boolean", description: "false nếu thực ra không phải văn bản/thông tin pháp lý thuộc 6 trụ cột" },
    docNumber: { type: "string" },
    title: { type: "string" },
    docType: { type: "string" },
    issuer: { type: "string" },
    issueDate: { type: ["string", "null"] },
    effectiveDate: { type: ["string", "null"] },
    isHot: { type: "boolean" },
    pillars: { type: "array", items: { type: "string", enum: PILLAR_IDS } },
    summary: { type: "string" },
    impactBullets: { type: "array", items: { type: "string" }, maxItems: 3 },
    relatedDocs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          docNumber: { type: "string" },
          relation: { type: "string", enum: ["thay-the", "sua-doi", "bai-bo", "huong-dan", "dan-chieu"] },
          note: { type: "string" },
        },
        required: ["docNumber", "relation"],
      },
    },
    affectedSubjects: { type: "array", items: { type: "string" } },
    comparisons: {
      type: "array",
      items: {
        type: "object",
        properties: { topic: { type: "string" }, oldRule: { type: "string" }, newRule: { type: "string" }, article: { type: "string" } },
        required: ["topic", "oldRule", "newRule"],
      },
    },
    actionItems: {
      type: "array",
      items: {
        type: "object",
        properties: { action: { type: "string" }, target: { type: "string" }, deadline: { type: ["string", "null"] } },
        required: ["action"],
      },
    },
    keyQuotes: {
      type: "array",
      maxItems: 3,
      items: { type: "object", properties: { article: { type: "string" }, text: { type: "string" } }, required: ["article", "text"] },
    },
  },
  required: ["isRelevant", "docNumber", "title", "docType", "issuer", "pillars", "summary", "impactBullets", "affectedSubjects", "comparisons", "actionItems", "keyQuotes", "relatedDocs", "isHot"],
};

type LegalRaw = Omit<LegalDocument, "id" | "status" | "sourceName" | "sourceUrl"> & { isRelevant: boolean };

export function deriveStatus(issueDate: string | null, effectiveDate: string | null, today: string): DocStatus {
  if (effectiveDate && effectiveDate > today) return "sap-hieu-luc";
  if (issueDate && daysBetween(issueDate, today) <= 7) return "moi-ban-hanh";
  if (effectiveDate && daysBetween(effectiveDate, today) <= 7) return "moi-ban-hanh";
  return "dang-hieu-luc";
}
function daysBetween(a: string, b: string) {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

export async function analyzeLegalDoc(a: RawArticle, fullText: string, today: string): Promise<LegalDocument | null> {
  const r = await callJson<LegalRaw>({
    model: LEGAL_MODEL(),
    system: LEGAL_SYSTEM,
    user: `Ngày bản tin: ${today}\nNguồn: ${a.sourceName}\nURL: ${a.url}\nTiêu đề: ${a.title}\n\n=== TOÀN VĂN ===\n${fullText}`,
    toolName: "phieu_tom_tat_tac_dong",
    schema: LEGAL_SCHEMA,
    maxTokens: 6000,
  });
  if (!r.isRelevant || !r.pillars?.length) return null;
  const clean = (d: string | null | undefined) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  const issueDate = clean(r.issueDate);
  const effectiveDate = clean(r.effectiveDate);
  return {
    id: "",
    docNumber: r.docNumber?.trim() || a.title.slice(0, 60),
    title: r.title || a.title,
    docType: r.docType || "Văn bản",
    issuer: r.issuer || "—",
    issueDate,
    effectiveDate,
    status: deriveStatus(issueDate, effectiveDate, today),
    isHot: !!r.isHot,
    pillars: r.pillars.filter((p) => PILLAR_IDS.includes(p)),
    summary: r.summary,
    impactBullets: (r.impactBullets ?? []).slice(0, 3),
    relatedDocs: r.relatedDocs ?? [],
    affectedSubjects: r.affectedSubjects ?? [],
    comparisons: r.comparisons ?? [],
    actionItems: (r.actionItems ?? []).map((x) => ({ ...x, deadline: clean(x.deadline) ?? undefined })),
    keyQuotes: r.keyQuotes ?? [],
    sourceName: a.sourceName,
    sourceUrl: a.url,
  };
}

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string", description: "3–4 câu" },
    keyPoints: { type: "array", items: { type: "string" }, maxItems: 5 },
    pillars: { type: "array", items: { type: "string", enum: PILLAR_IDS } },
  },
  required: ["title", "summary", "keyPoints", "pillars"],
};

export async function summarizeAnalysis(
  a: RawArticle,
  t: TriageResult,
  fullText: string,
): Promise<PillarAnalysis> {
  const r = await callJson<{ title: string; summary: string; keyPoints: string[]; pillars: PillarId[] }>({
    model: LEGAL_MODEL(),
    system: `${LEGAL_SYSTEM}\nLần này: tóm tắt bài phân tích/chỉ đạo điều hành — nêu luận điểm chính, hướng xử lý thực tế. Không bịa.`,
    user: `Nguồn: ${a.sourceName}\nTiêu đề: ${a.title}\n\n${fullText.slice(0, 25000)}`,
    toolName: "tom_tat_bai",
    schema: ANALYSIS_SCHEMA,
    maxTokens: 2000,
  });
  return {
    id: "",
    kind: t.kind === "chi-dao" ? "chi-dao" : t.isHot ? "tin-nong" : "phan-tich",
    pillars: r.pillars?.length ? r.pillars : t.pillars,
    title: r.title || a.title,
    summary: r.summary,
    keyPoints: r.keyPoints ?? [],
    sourceName: a.sourceName,
    sourceUrl: a.url,
    publishedAt: a.publishedAt,
  };
}

export async function writeEditorNote(docs: LegalDocument[], analyses: PillarAnalysis[]): Promise<string | undefined> {
  if (!docs.length && !analyses.length) return undefined;
  const r = await callJson<{ note: string }>({
    model: TRIAGE_MODEL(),
    system: "Viết 1–2 câu 'Tâm điểm hôm nay' cho bản tin pháp lý sáng, tiếng Việt, súc tích, nêu điều quan trọng nhất cho người làm hồ sơ xây dựng/đất đai tại TP.HCM. Chỉ dựa trên dữ liệu đưa vào.",
    user: JSON.stringify({
      van_ban: docs.map((d) => ({ so: d.docNumber, ten: d.title, tac_dong: d.impactBullets, nong: d.isHot })),
      bai: analyses.map((a) => a.title),
    }),
    toolName: "tam_diem",
    schema: { type: "object", properties: { note: { type: "string" } }, required: ["note"] },
    maxTokens: 400,
  });
  return r.note;
}
