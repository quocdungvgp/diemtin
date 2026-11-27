/**
 * Lưu trữ dạng file JSON trong public/data — web tĩnh (Cloudflare Pages) đọc trực tiếp.
 *   public/data/index.json            danh sách ngày + KPI (mới nhất trước)
 *   public/data/briefings/<date>.json bản tin từng ngày (DailyBriefing)
 *   public/data/legal-documents.json  kho văn bản lâu dài (Phase 2: tra cứu)
 *   public/data/seen.json             URL đã xử lý (chống trùng giữa các ngày, giữ 14 ngày)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { computeKpis } from "../kpis";
import type { BriefingKpis, DailyBriefing, LegalDocument } from "../types";

export const DATA_DIR = path.resolve(process.cwd(), "public/data");

export interface BriefingIndexEntry {
  date: string;
  generatedAt: string;
  enriched: boolean;
  kpis: BriefingKpis;
}
export interface LegalRepoEntry extends LegalDocument {
  firstSeenDate: string;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function writeJson(file: string, data: unknown) {
  const full = path.join(DATA_DIR, file);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(data, null, 1) + "\n", "utf8");
}

export const loadBriefing = (date: string) => readJson<DailyBriefing | null>(`briefings/${date}.json`, null);

export async function loadSeen(): Promise<Record<string, string>> {
  return readJson<Record<string, string>>("seen.json", {});
}
export async function saveSeen(seen: Record<string, string>, today: string) {
  const cutoff = new Date(new Date(today).getTime() - 14 * 86400000).toISOString().slice(0, 10);
  const pruned = Object.fromEntries(Object.entries(seen).filter(([, d]) => d >= cutoff));
  await writeJson("seen.json", pruned);
}

export async function loadLegalRepo(): Promise<LegalRepoEntry[]> {
  return readJson<LegalRepoEntry[]>("legal-documents.json", []);
}

/** Ghi bản tin + cập nhật index + kho văn bản. Tính lại KPI từ dữ liệu. */
export async function saveBriefing(b: DailyBriefing) {
  b.kpis = computeKpis(b.legalDocuments, b.news);
  await writeJson(`briefings/${b.date}.json`, b);

  const index = await readJson<BriefingIndexEntry[]>("index.json", []);
  const entry: BriefingIndexEntry = {
    date: b.date,
    generatedAt: b.generatedAt,
    enriched: !!b.enrichedAt,
    kpis: b.kpis,
  };
  const next = [entry, ...index.filter((e) => e.date !== b.date)].sort((x, y) => (x.date < y.date ? 1 : -1));
  await writeJson("index.json", next);

  const repo = await loadLegalRepo();
  const byNum = new Map(repo.map((d) => [d.docNumber, d]));
  for (const d of b.legalDocuments) {
    const old = byNum.get(d.docNumber);
    byNum.set(d.docNumber, { ...d, firstSeenDate: old?.firstSeenDate ?? b.date });
  }
  await writeJson(
    "legal-documents.json",
    [...byNum.values()].sort((x, y) => (x.firstSeenDate < y.firstSeenDate ? 1 : -1)),
  );
}
