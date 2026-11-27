import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { matchPillars, normalizeVi } from "../pillars";
import type { PillarId } from "../types";
import type { SourceConfig } from "./sources";

export interface RawArticle {
  id: string;
  url: string;
  title: string;
  snippet: string;
  sourceName: string;
  stream: "news" | "legal";
  category?: string;
  publishedAt: string | null;
  /** nhãn trụ cột sơ bộ theo từ khoá */
  kwPillars: PillarId[];
  /** có dáng văn bản QPPL (số hiệu, "Nghị định", "Quyết định"...) */
  looksLikeDoc: boolean;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 DiemTin9h/1.0";

// Có năm (45/2026/QĐ-UBND) hoặc không năm (2309/QĐ-TTg, 12126/VPCP-KGVX) + QCVN/TCVN
export const DOC_NUMBER_RE =
  /\b\d{1,5}\/(?:\d{4}\/)?(?:NĐ-CP|NQ-CP|NQ-HĐND|QĐ-UBND|QĐ-TTg|CĐ-TTg|CT-TTg|CT-UBND|KH-UBND|TB-UBND|UBND-[A-ZĐ]+|VPCP-[A-ZĐ]+|QĐ-B[A-ZĐ]+|TT-B[A-ZĐ]+|QH\d{2}|SXD-[A-ZĐ]+)(?![\p{L}\d])|\bQCVN\s?\d{2}:\d{4}\/[A-ZĐ]+|\bTCVN\s?\d{3,5}:\d{4}/iu;
const DOC_TITLE_RE = /^(luật|nghị định|nghị quyết|quyết định|thông tư|chỉ thị|qcvn|tcvn|công văn|kế hoạch|thông báo)\b/i;

export function looksLikeDoc(title: string) {
  return DOC_NUMBER_RE.test(title) || DOC_TITLE_RE.test(title.trim());
}

async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "vi,en;q=0.8" }, signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function toRaw(src: SourceConfig, url: string, title: string, snippet: string, publishedAt: string | null): RawArticle {
  const text = `${title} ${snippet}`;
  return {
    id: "",
    url,
    title: title.replace(/\s+/g, " ").trim(),
    snippet: snippet.replace(/\s+/g, " ").trim().slice(0, 600),
    sourceName: src.name,
    stream: src.stream,
    category: src.category,
    publishedAt,
    kwPillars: matchPillars(text),
    looksLikeDoc: looksLikeDoc(title),
  };
}

const rss = new Parser({ timeout: 20000, headers: { "User-Agent": UA } });

export async function collectRss(src: SourceConfig, since: Date): Promise<RawArticle[]> {
  const feed = await rss.parseURL(src.url);
  return (feed.items ?? [])
    .filter((it) => it.link && it.title)
    .filter((it) => {
      const iso = rssDate(it.isoDate, it.pubDate);
      return !iso || new Date(iso) >= since;
    })
    .map((it) => {
      const snippet = it.contentSnippet ?? cheerio.load(it.content ?? "").text();
      return toRaw(src, it.link!.trim(), decodeEntities(it.title!), decodeEntities(snippet), rssDate(it.isoDate, it.pubDate));
    });
}

/** Tiêu đề RSS (Thanh Niên) còn entity HTML trong CDATA: &otilde; &#039; */
function decodeEntities(s: string): string {
  return /&[#a-z0-9]+;/i.test(s) ? cheerio.load(`<p>${s}</p>`)("p").text() : s;
}

/** Chuẩn hoá ngày RSS: Tuổi Trẻ dùng "11/27/2026 3:06:00 AM" (giờ VN, không múi giờ) */
function rssDate(isoDate?: string, pubDate?: string): string | null {
  const us = pubDate?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (us) {
    let h = Number(us[4]);
    if (us[7]) h = (h % 12) + (us[7].toUpperCase() === "PM" ? 12 : 0);
    const iso = `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}T${String(h).padStart(2, "0")}:${us[5]}:${us[6] ?? "00"}+07:00`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(isoDate ?? pubDate ?? "");
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseViDate(s: string | undefined): string | null {
  const m = s?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00+07:00`).toISOString();
}

/** Trích danh sách link từ HTML trang danh mục văn bản */
export function extractListFromHtml(src: SourceConfig, html: string): RawArticle[] {
  const $ = cheerio.load(html);
  const out: RawArticle[] = [];
  const abs = (href: string) => {
    try {
      return new URL(href, src.url).toString();
    } catch {
      return null;
    }
  };

  if (src.selectors?.item) {
    const s = src.selectors;
    $(s.item).each((_, el) => {
      const a = $(el).find(s.link ?? "a").first();
      const url = abs(a.attr("href") ?? "");
      const title = (s.title ? $(el).find(s.title).text() : a.text()) || a.attr("title") || "";
      if (url && title.trim()) out.push(toRaw(src, url, title, $(el).text(), parseViDate(s.date ? $(el).find(s.date).text() : $(el).text())));
    });
    return out;
  }

  // Heuristic: link có số hiệu văn bản, mở đầu bằng loại văn bản, hoặc chứa từ khoá trụ cột
  const seen = new Set<string>();
  $("a[href]").each((_, el) => {
    const a = $(el);
    let title = (a.attr("title") || a.text()).replace(/\s+/g, " ").trim();
    const ctx = a.closest("tr, li, article, div").first().text().replace(/\s+/g, " ").trim();
    // trang chỉ để số hiệu làm link (vanban.chinhphu.vn) → lấy cả dòng làm tiêu đề
    if (title.length < 15 && DOC_NUMBER_RE.test(title)) title = ctx.slice(0, 250);
    if (title.length < 15) return;
    if (!looksLikeDoc(title) && !looksLikeDoc(ctx.slice(0, 120)) && matchPillars(title).length === 0) return;
    const url = abs(a.attr("href")!);
    if (!url || seen.has(url) || url.startsWith("javascript")) return;
    seen.add(url);
    out.push(toRaw(src, url, title, ctx.slice(0, 600), parseViDate(ctx)));
  });
  return out;
}

export async function collectHtml(src: SourceConfig): Promise<RawArticle[]> {
  return extractListFromHtml(src, await fetchText(src.url));
}

/** Nguồn render bằng JS (Công báo...). Cần ENABLE_PLAYWRIGHT=true và `npx playwright install chromium` */
export async function collectPlaywright(src: SourceConfig): Promise<RawArticle[]> {
  if (process.env.ENABLE_PLAYWRIGHT !== "true") return collectHtml(src);
  const html = await renderWithPlaywright(src.url);
  return extractListFromHtml(src, html);
}

async function renderWithPlaywright(url: string): Promise<string> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ userAgent: UA, locale: "vi-VN" });
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}

/** Lấy toàn văn (bỏ menu/quảng cáo) để gửi tầng 2 */
export async function fetchFullText(url: string, maxChars = 60000): Promise<string> {
  let html: string;
  try {
    html = await fetchText(url, 30000);
  } catch (e) {
    if (process.env.ENABLE_PLAYWRIGHT === "true") html = await renderWithPlaywright(url);
    else throw e;
  }
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, header, footer, aside, form, iframe, .ads, .advertisement, .banner, .menu, .breadcrumb").remove();
  const candidates = [
    "#divContentDoc", ".content1", ".noidungvanban", ".vbContent", "#toanvancontent", // trang văn bản
    "article", ".detail-content", ".article-content", ".fck_detail", ".detail__content", "main", "#content",
  ];
  let text = "";
  for (const c of candidates) {
    const t = $(c).first().text();
    if (t && t.trim().length > 800) {
      text = t;
      break;
    }
  }
  if (!text) text = $("body").text();
  const pdfLinks = $("a[href$='.pdf'], a[href*='.pdf?']")
    .map((_, a) => new URL($(a).attr("href")!, url).toString())
    .get()
    .slice(0, 3);
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (pdfLinks.length) text += `\n\n[File đính kèm: ${pdfLinks.join(", ")}]`;
  return text.slice(0, maxChars);
}

/** Khử trùng: URL chuẩn hoá + tiêu đề gần giống (Jaccard ≥ 0.75) */
export function dedupe(items: RawArticle[]): RawArticle[] {
  const normUrl = (u: string) => u.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
  const tokens = (t: string) => new Set(normalizeVi(t).split(/[^a-z0-9]+/).filter((w) => w.length > 1));
  const kept: { item: RawArticle; tk: Set<string> }[] = [];
  const urls = new Set<string>();
  for (const it of items) {
    const u = normUrl(it.url);
    if (urls.has(u)) continue;
    const tk = tokens(it.title);
    const dup = kept.find((k) => {
      let inter = 0;
      tk.forEach((w) => k.tk.has(w) && inter++);
      const union = tk.size + k.tk.size - inter;
      return union > 0 && inter / union >= 0.75;
    });
    if (dup) {
      // giữ bản thuộc luồng pháp lý / có số hiệu
      if (it.looksLikeDoc && !dup.item.looksLikeDoc) dup.item = it;
      continue;
    }
    urls.add(u);
    kept.push({ item: it, tk });
  }
  return kept.map((k, i) => ({ ...k.item, id: `r${i}` }));
}
