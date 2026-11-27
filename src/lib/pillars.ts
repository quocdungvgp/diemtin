import type { DocStatus, NewsCategory, PillarId } from "./types";

export interface PillarDef {
  id: PillarId;
  short: string;
  name: string;
  scope: string;
  /** class Tailwind cho badge/viền */
  tone: string;
  dot: string;
  /** từ khoá lọc sơ bộ (không dấu hoá khi so khớp) */
  keywords: string[];
}

export const PILLARS: PillarDef[] = [
  {
    id: "xpxd",
    short: "XPXD",
    name: "Xin phép xây dựng",
    scope: "Miễn phép, thẩm quyền cấp phép (Phường/Sở), mật độ, chiều cao, khoảng lùi, GPXD có thời hạn",
    tone: "border-sky-300 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
    keywords: ["giấy phép xây dựng", "gpxd", "cấp phép xây dựng", "miễn giấy phép", "giấy phép có thời hạn", "mật độ xây dựng", "chiều cao công trình", "khoảng lùi", "luật xây dựng"],
  },
  {
    id: "hoan-cong",
    short: "Hoàn công",
    name: "Hoàn công & Nghiệm thu",
    scope: "Hồ sơ hoàn công nhà ở riêng lẻ, xử lý sai phép/không phép, nghiệm thu PCCC",
    tone: "border-indigo-300 bg-indigo-50 text-indigo-800",
    dot: "bg-indigo-500",
    keywords: ["hoàn công", "nghiệm thu", "sai phép", "không phép", "xây dựng trái phép", "xử phạt vi phạm hành chính trong hoạt động xây dựng", "nghiệm thu pccc", "nhà ở kết hợp kinh doanh"],
  },
  {
    id: "gcn",
    short: "Sổ hồng",
    name: "Cấp Giấy chứng nhận",
    scope: "Cấp GCN lần đầu, đăng ký biến động, tách thửa, chuyển mục đích sử dụng đất",
    tone: "border-rose-300 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
    keywords: ["giấy chứng nhận quyền sử dụng đất", "sổ hồng", "cấp giấy chứng nhận", "đăng ký biến động", "tách thửa", "hợp thửa", "chuyển mục đích sử dụng đất", "diện tích tối thiểu", "đăng ký đất đai"],
  },
  {
    id: "tieu-chuan",
    short: "QCVN/TCVN",
    name: "Tiêu chuẩn & Quy chuẩn",
    scope: "QCVN, TCVN mới về thiết kế, kết cấu, an toàn chịu lực, PCCC công trình dân dụng",
    tone: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    keywords: ["qcvn", "tcvn", "quy chuẩn kỹ thuật", "tiêu chuẩn quốc gia", "an toàn cháy", "phòng cháy chữa cháy", "kết cấu", "chịu lực", "thiết kế công trình"],
  },
  {
    id: "nha-o",
    short: "Nhà riêng lẻ",
    name: "Nhà ở riêng lẻ (Tổng hợp)",
    scope: "Quy định quản lý kiến trúc TP.HCM, quy hoạch 1/500, lộ giới hẻm, đất hỗn hợp/nông nghiệp",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
    keywords: ["nhà ở riêng lẻ", "quy chế quản lý kiến trúc", "quản lý kiến trúc", "quy hoạch chi tiết 1/500", "quy hoạch 1/2000", "lộ giới", "hẻm", "đất hỗn hợp", "đất nông nghiệp", "chỉ giới xây dựng"],
  },
  {
    id: "gpmb",
    short: "Đền bù",
    name: "Đền bù & GPMB",
    scope: "Bảng giá đất, hệ số K, bồi thường/tái định cư, đơn giá vật kiến trúc, dự án trọng điểm",
    tone: "border-orange-300 bg-orange-50 text-orange-800",
    dot: "bg-orange-500",
    keywords: ["bồi thường", "hỗ trợ tái định cư", "tái định cư", "giải phóng mặt bằng", "thu hồi đất", "bảng giá đất", "hệ số điều chỉnh giá đất", "hệ số k", "đơn giá vật kiến trúc", "đơn giá bồi thường", "dự án trọng điểm"],
  },
];

export const PILLAR_MAP: Record<PillarId, PillarDef> = Object.fromEntries(
  PILLARS.map((p) => [p.id, p]),
) as Record<PillarId, PillarDef>;

export const STATUS_LABEL: Record<DocStatus, { label: string; cls: string }> = {
  "moi-ban-hanh": { label: "Mới ban hành", cls: "bg-blue-600 text-white" },
  "sap-hieu-luc": { label: "Sắp có hiệu lực", cls: "bg-amber-500 text-white" },
  "dang-hieu-luc": { label: "Đang hiệu lực", cls: "bg-emerald-600 text-white" },
  "het-hieu-luc": { label: "Hết hiệu lực", cls: "bg-zinc-500 text-white" },
};

export const NEWS_CATEGORIES: { id: NewsCategory; name: string }[] = [
  { id: "thoi-su", name: "Thời sự" },
  { id: "kinh-te", name: "Kinh tế vĩ mô" },
  { id: "bat-dong-san", name: "Bất động sản" },
  { id: "cong-nghe", name: "Công nghệ" },
  { id: "the-gioi", name: "Thế giới" },
];

/** Bỏ dấu tiếng Việt để so khớp từ khoá/tìm kiếm */
export function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

const PILLAR_KW_NORM = PILLARS.map((p) => ({ id: p.id, kws: p.keywords.map(normalizeVi) }));

/** Gắn nhãn trụ cột sơ bộ bằng từ khoá (trước khi qua AI tầng 1) */
export function matchPillars(text: string): PillarId[] {
  const t = normalizeVi(text);
  return PILLAR_KW_NORM.filter((p) => p.kws.some((k) => t.includes(k))).map((p) => p.id);
}
