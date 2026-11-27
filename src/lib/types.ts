/**
 * DATA SCHEMA chuẩn (Mục 5 spec) — Backend lưu đúng cấu trúc này vào daily_briefings.payload,
 * Frontend render cả Dashboard lẫn Chuyên san từ cùng một object.
 */

export type PillarId = "xpxd" | "hoan-cong" | "gcn" | "tieu-chuan" | "nha-o" | "gpmb";

export type DocStatus = "moi-ban-hanh" | "sap-hieu-luc" | "dang-hieu-luc" | "het-hieu-luc";

export type NewsCategory = "thoi-su" | "kinh-te" | "bat-dong-san" | "cong-nghe" | "the-gioi";

export interface RelatedDoc {
  docNumber: string;
  relation: "thay-the" | "sua-doi" | "bai-bo" | "huong-dan" | "dan-chieu";
  note?: string;
}

export interface RuleComparison {
  topic: string; // Nội dung so sánh: "Thẩm quyền cấp GPXD nhà ở riêng lẻ"
  oldRule: string; // Quy định cũ
  newRule: string; // Quy định mới
  article?: string; // Điều/khoản: "Khoản 2 Điều 5"
}

export interface ActionItem {
  action: string; // Cập nhật biểu mẫu, quy trình thẩm định, hồ sơ thiết kế...
  target?: string; // Ai phải làm: Chủ đầu tư / Đơn vị tư vấn / UBND phường...
  deadline?: string;
}

export interface KeyQuote {
  article: string;
  text: string; // trích nguyên văn
}

/** Phiếu Tóm Tắt Tác Động Nghiệp Vụ */
export interface LegalDocument {
  id: string;
  docNumber: string;
  title: string;
  docType: string;
  issuer: string;
  issueDate: string | null; // YYYY-MM-DD
  effectiveDate: string | null;
  status: DocStatus;
  isHot: boolean;
  pillars: PillarId[];
  summary: string;
  impactBullets: string[]; // tối đa 3 — hiển thị trên widget Radar
  relatedDocs: RelatedDoc[]; // văn bản bị thay thế / sửa đổi
  affectedSubjects: string[]; // đối tượng chịu tác động trực tiếp tại TP.HCM
  comparisons: RuleComparison[];
  actionItems: ActionItem[];
  keyQuotes: KeyQuote[];
  sourceName: string;
  sourceUrl: string;
  /** true khi đã có phiếu phân tích AI đầy đủ; false = mới lọc từ khoá, chờ Claude bổ sung */
  enriched?: boolean;
}

/** Bài phân tích chuyên sâu / chỉ đạo điều hành theo trụ cột */
export interface PillarAnalysis {
  id: string;
  kind: "phan-tich" | "chi-dao" | "tin-nong";
  pillars: PillarId[];
  title: string;
  summary: string;
  keyPoints: string[];
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null; // ISO
}

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
}

export interface BriefingKpis {
  totalNewDocs: number;
  xpxdHoanCong: number;
  gcn: number;
  tieuChuan: number;
  gpmb: number;
  nhaO: number;
  totalNews: number;
}

export interface DailyBriefing {
  date: string; // YYYY-MM-DD (giờ VN)
  generatedAt: string; // ISO
  publishAt: string; // ISO
  isMock?: boolean;
  /** none = chỉ lọc từ khoá; anthropic/ollama = AI trong pipeline; claude-task = Claude bổ sung theo lịch */
  aiProvider?: string;
  enrichedAt?: string;
  editorNote?: string;
  kpis: BriefingKpis;
  legalDocuments: LegalDocument[];
  analyses: PillarAnalysis[];
  news: NewsItem[];
  stats?: {
    rawCollected: number;
    afterDedupe: number;
    legalDeepAnalyzed: number;
    durationSec: number;
  };
}
