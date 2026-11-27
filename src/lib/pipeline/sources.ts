import type { NewsCategory } from "../types";

export interface SourceSelectors {
  /** CSS selector mỗi dòng/khối tin trong trang danh sách */
  item: string;
  /** selector link bên trong item (mặc định "a") */
  link?: string;
  /** selector tiêu đề (mặc định = text của link) */
  title?: string;
  /** selector ngày (text dd/mm/yyyy) */
  date?: string;
}

export interface SourceConfig {
  name: string;
  url: string;
  kind: "rss" | "html" | "playwright";
  stream: "news" | "legal";
  category?: NewsCategory | "phap-ly";
  selectors?: SourceSelectors;
}

/**
 * Danh sách nguồn mặc định. Được seed vào bảng `sources` — sau này sửa trên trang Admin.
 * ⚠ URL RSS / selector HTML của báo và cổng Nhà nước thay đổi thường xuyên: chạy `npm run check:sources`
 * để kiểm tra nguồn nào chết, rồi chỉnh lại.
 */
export const DEFAULT_SOURCES: SourceConfig[] = [
  // ───── LUỒNG 1: TIN TỔNG HỢP (RSS) ─────
  { name: "VnExpress", url: "https://vnexpress.net/rss/thoi-su.rss", kind: "rss", stream: "news", category: "thoi-su" },
  { name: "VnExpress", url: "https://vnexpress.net/rss/kinh-doanh.rss", kind: "rss", stream: "news", category: "kinh-te" },
  { name: "VnExpress", url: "https://vnexpress.net/rss/bat-dong-san.rss", kind: "rss", stream: "news", category: "bat-dong-san" },
  { name: "VnExpress", url: "https://vnexpress.net/rss/so-hoa.rss", kind: "rss", stream: "news", category: "cong-nghe" },
  { name: "VnExpress", url: "https://vnexpress.net/rss/the-gioi.rss", kind: "rss", stream: "news", category: "the-gioi" },
  { name: "VnExpress", url: "https://vnexpress.net/rss/phap-luat.rss", kind: "rss", stream: "legal", category: "phap-ly" },
  { name: "Tuổi Trẻ", url: "https://tuoitre.vn/rss/thoi-su.rss", kind: "rss", stream: "news", category: "thoi-su" },
  { name: "Tuổi Trẻ", url: "https://tuoitre.vn/rss/kinh-doanh.rss", kind: "rss", stream: "news", category: "kinh-te" },
  { name: "Tuổi Trẻ", url: "https://tuoitre.vn/rss/the-gioi.rss", kind: "rss", stream: "news", category: "the-gioi" },
  { name: "Tuổi Trẻ", url: "https://tuoitre.vn/rss/nhip-song-so.rss", kind: "rss", stream: "news", category: "cong-nghe" },
  { name: "Thanh Niên", url: "https://thanhnien.vn/rss/thoi-su.rss", kind: "rss", stream: "news", category: "thoi-su" },
  { name: "Thanh Niên", url: "https://thanhnien.vn/rss/kinh-te.rss", kind: "rss", stream: "news", category: "kinh-te" },
  { name: "Thanh Niên", url: "https://thanhnien.vn/rss/the-gioi.rss", kind: "rss", stream: "news", category: "the-gioi" },
  { name: "Thanh Niên", url: "https://thanhnien.vn/rss/cong-nghe.rss", kind: "rss", stream: "news", category: "cong-nghe" },
  { name: "CafeF", url: "https://cafef.vn/vi-mo-dau-tu.rss", kind: "rss", stream: "news", category: "kinh-te" },
  { name: "CafeF", url: "https://cafef.vn/bat-dong-san.rss", kind: "rss", stream: "news", category: "bat-dong-san" },
  { name: "VTV", url: "https://vtv.vn/rss/xa-hoi.rss", kind: "rss", stream: "news", category: "thoi-su" },
  { name: "VTV", url: "https://vtv.vn/rss/kinh-te.rss", kind: "rss", stream: "news", category: "kinh-te" },
  { name: "VTV", url: "https://vtv.vn/rss/the-gioi.rss", kind: "rss", stream: "news", category: "the-gioi" },

  // ───── LUỒNG 2: PHÁP LÝ CHUYÊN SÂU TP.HCM ─────
  // Bài phân tích (RSS)
  { name: "Pháp Luật TP.HCM", url: "https://plo.vn/rss/phap-luat-3.rss", kind: "rss", stream: "legal", category: "phap-ly" },
  { name: "Pháp Luật TP.HCM", url: "https://plo.vn/rss/bat-dong-san-11.rss", kind: "rss", stream: "legal", category: "phap-ly" },
  { name: "Báo Xây Dựng", url: "https://baoxaydung.vn/rss/chinh-sach.rss", kind: "rss", stream: "legal", category: "phap-ly" },
  // Văn bản gốc (HTML list) — selector để trống = heuristic: lấy mọi link có số hiệu văn bản / từ khoá trụ cột
  { name: "Công báo TP.HCM", url: "https://congbao.hochiminhcity.gov.vn", kind: "html", stream: "legal", category: "phap-ly" },
  { name: "Cổng TTĐT Chính phủ — Văn bản", url: "https://vanban.chinhphu.vn/he-thong-van-ban", kind: "html", stream: "legal", category: "phap-ly" },
  { name: "Bộ Xây dựng — Văn bản", url: "https://moc.gov.vn/vn/pages/vanbanphapquy.aspx", kind: "html", stream: "legal", category: "phap-ly" },
  { name: "Bộ Nông nghiệp & Môi trường — Văn bản", url: "https://mae.gov.vn/van-ban", kind: "html", stream: "legal", category: "phap-ly" },
  { name: "Sở Xây dựng TP.HCM", url: "https://soxaydung.hochiminhcity.gov.vn", kind: "html", stream: "legal", category: "phap-ly" },
  { name: "Thư Viện Pháp Luật — Văn bản mới", url: "https://thuvienphapluat.vn/van-ban-moi", kind: "html", stream: "legal", category: "phap-ly" },
  { name: "LuatVietnam — Văn bản mới", url: "https://luatvietnam.vn/van-ban-moi.html", kind: "html", stream: "legal", category: "phap-ly" },
];
