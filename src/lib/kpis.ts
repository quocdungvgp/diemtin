import type { BriefingKpis, LegalDocument, NewsItem } from "./types";

export function computeKpis(docs: LegalDocument[], news: NewsItem[]): BriefingKpis {
  const has = (d: LegalDocument, ...ids: string[]) => d.pillars.some((p) => ids.includes(p));
  return {
    totalNewDocs: docs.length,
    xpxdHoanCong: docs.filter((d) => has(d, "xpxd", "hoan-cong")).length,
    gcn: docs.filter((d) => has(d, "gcn")).length,
    tieuChuan: docs.filter((d) => has(d, "tieu-chuan")).length,
    gpmb: docs.filter((d) => has(d, "gpmb")).length,
    nhaO: docs.filter((d) => has(d, "nha-o")).length,
    totalNews: news.length,
  };
}
