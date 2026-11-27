import { atHourVN, todayVN } from "../date";
import { computeKpis } from "../kpis";
import type { DailyBriefing, LegalDocument, NewsItem, PillarAnalysis } from "../types";
import { aiProvider, analyzeLegalDoc, deriveStatus, summarizeAnalysis, triage, writeEditorNote, type TriageResult } from "./ai";
import { collectHtml, collectPlaywright, collectRss, DOC_NUMBER_RE, dedupe, fetchFullText, type RawArticle } from "./collect";
import { DEFAULT_SOURCES } from "./sources";
import { loadLegalRepo, loadSeen, saveBriefing, saveSeen } from "./storage";

export interface RunOptions {
  date?: string;
}

async function pool<T, R>(items: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const log = (m: string) =>
  console.log(`[${new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}] ${m}`);

export async function runDailyBriefing(opts: RunOptions = {}): Promise<DailyBriefing> {
  const t0 = Date.now();
  const date = opts.date ?? todayVN();
  const provider = aiProvider();

  // ── Giai đoạn 1: Thu thập ──
  const sources = DEFAULT_SOURCES;
  const since = new Date(atHourVN(date, 8).getTime() - 24 * 3600 * 1000);
  log(`Giai đoạn 1: thu thập từ ${sources.length} nguồn (từ ${since.toISOString()})`);
  const raws: RawArticle[] = [];
  await pool(sources, 6, async (s) => {
    try {
      const items =
        s.kind === "rss" ? await collectRss(s, since) : s.kind === "playwright" ? await collectPlaywright(s) : await collectHtml(s);
      raws.push(...items.slice(0, 60));
      log(`  ✓ ${items.length} — ${s.name} (${s.url})`);
    } catch (e) {
      log(`  ✗ ${s.name} (${s.url}): ${(e as Error).message}`);
    }
  });
  log(`  → ${raws.length} tin thô`);

  // bỏ URL đã xử lý ở các ngày trước
  const seenMap = await loadSeen();
  const fresh = dedupe(raws.filter((r) => !seenMap[r.url] || seenMap[r.url] >= date));
  log(`  → ${fresh.length} tin sau khử trùng`);

  // ── Giai đoạn 2a: lọc & gắn nhãn ──
  log(provider === "none" ? "Giai đoạn 2: lọc theo từ khoá (không AI)" : `Giai đoạn 2: AI tầng 1 (${provider}) — lọc & gắn nhãn`);
  const tri = provider === "none" ? keywordTriage(fresh) : await triage(fresh);
  const kept = fresh.filter((r) => tri.get(r.id)?.keep);
  log(`  → giữ ${kept.length}/${fresh.length}`);

  const byPriority = (a: RawArticle, b: RawArticle) => (tri.get(b.id)?.priority ?? 0) - (tri.get(a.id)?.priority ?? 0);
  const legalCandidates = kept
    .filter((r) => {
      const t = tri.get(r.id)!;
      return t.pillars.length > 0 && t.kind === "van-ban";
    })
    .sort(byPriority)
    .slice(0, Number(process.env.MAX_LEGAL_DEEP ?? 15));
  const analysisCandidates = kept
    .filter((r) => {
      const t = tri.get(r.id)!;
      return t.pillars.length > 0 && (t.kind === "phan-tich" || t.kind === "chi-dao");
    })
    .sort(byPriority)
    .slice(0, 18);

  // ── Giai đoạn 2b: phân tích sâu ──
  log(`Phân tích ${legalCandidates.length} văn bản, ${analysisCandidates.length} bài phân tích`);
  const docsRaw = await pool(legalCandidates, 3, async (a) => {
    try {
      if (provider === "none") return keywordDoc(a, date);
      const text = await fetchFullText(a.url);
      return await analyzeLegalDoc(a, text, date);
    } catch (e) {
      log(`  ✗ phân tích ${a.title.slice(0, 60)}: ${(e as Error).message}`);
      return null;
    }
  });
  const docMap = new Map<string, LegalDocument>();
  docsRaw
    .filter((d): d is LegalDocument => !!d)
    .forEach((d) => {
      if (!docMap.has(d.docNumber)) docMap.set(d.docNumber, { ...d, id: `doc-${docMap.size + 1}` });
    });
  // bỏ văn bản đã đưa tin ở các ngày trước
  const repo = await loadLegalRepo();
  repo.filter((o) => o.firstSeenDate < date).forEach((o) => docMap.delete(o.docNumber));
  const legalDocuments = [...docMap.values()]
    .map((d) => ({ ...d, enriched: provider !== "none" }))
    .sort((a, b) => Number(b.isHot) - Number(a.isHot));

  const analyses = (
    await pool(analysisCandidates, 3, async (a) => {
      const t = tri.get(a.id) as TriageResult;
      try {
        if (provider === "none") {
          const x: PillarAnalysis = {
            id: "",
            kind: t.kind === "chi-dao" ? "chi-dao" : "phan-tich",
            pillars: t.pillars,
            title: a.title,
            summary: a.snippet,
            keyPoints: [],
            sourceName: a.sourceName,
            sourceUrl: a.url,
            publishedAt: a.publishedAt,
          };
          return x;
        }
        const text = await fetchFullText(a.url, 25000).catch(() => a.snippet);
        return await summarizeAnalysis(a, t, text);
      } catch (e) {
        log(`  ✗ tóm tắt ${a.title.slice(0, 60)}: ${(e as Error).message}`);
        return null;
      }
    })
  )
    .filter((x): x is PillarAnalysis => !!x)
    .map((x, i) => ({ ...x, id: `an-${i + 1}` }));

  const news: NewsItem[] = kept
    .filter((r) => r.stream === "news" && tri.get(r.id)?.kind === "tin-tuc")
    .sort(byPriority)
    .map((r) => {
      const t = tri.get(r.id)!;
      return {
        id: r.id,
        category: (t.category ?? r.category ?? "thoi-su") as NewsItem["category"],
        title: r.title,
        summary: t.summary,
        sourceName: r.sourceName,
        sourceUrl: r.url,
        publishedAt: r.publishedAt,
      };
    })
    .reduce<NewsItem[]>((acc, n) => (acc.filter((x) => x.category === n.category).length < 6 ? [...acc, n] : acc), []);

  const editorNote = provider === "none" ? undefined : await writeEditorNote(legalDocuments, analyses).catch(() => undefined);

  // ── Giai đoạn 3: Lưu & xuất bản ──
  const briefing: DailyBriefing = {
    date,
    generatedAt: new Date().toISOString(),
    publishAt: atHourVN(date, Number(process.env.PUBLISH_HOUR ?? 9)).toISOString(),
    aiProvider: provider,
    enrichedAt: provider === "none" ? undefined : new Date().toISOString(),
    editorNote,
    kpis: computeKpis(legalDocuments, news),
    legalDocuments,
    analyses,
    news,
    stats: {
      rawCollected: raws.length,
      afterDedupe: fresh.length,
      legalDeepAnalyzed: provider === "none" ? 0 : legalCandidates.length,
      durationSec: Math.round((Date.now() - t0) / 1000),
    },
  };
  log("Giai đoạn 3: ghi public/data");
  await saveBriefing(briefing);
  fresh.forEach((r) => (seenMap[r.url] ??= date));
  await saveSeen(seenMap, date);
  log(`Xong trong ${briefing.stats!.durationSec}s — ${legalDocuments.length} văn bản, ${analyses.length} phân tích, ${news.length} tin`);
  return briefing;
}

// ───────── Chế độ không AI (AI_PROVIDER=none): chỉ dựa vào từ khoá ─────────
function keywordTriage(items: RawArticle[]): Map<string, TriageResult> {
  const ADS = /(mở bán|giá chỉ từ|chiết khấu|booking|nhận giữ chỗ|căn hộ mẫu|ưu đãi khủng)/i;
  const CHI_DAO = /(ubnd tp|chủ tịch ubnd|chỉ đạo|yêu cầu các sở|sở xây dựng|sở nông nghiệp)/i;
  const m = new Map<string, TriageResult>();
  for (const a of items) {
    const isAd = ADS.test(a.title);
    const kind: TriageResult["kind"] =
      a.kwPillars.length && a.looksLikeDoc
        ? "van-ban"
        : a.kwPillars.length && CHI_DAO.test(a.title)
          ? "chi-dao"
          : a.kwPillars.length && a.stream === "legal"
            ? "phan-tich"
            : "tin-tuc";
    m.set(a.id, {
      id: a.id,
      keep: !isAd && (a.stream === "news" || a.kwPillars.length > 0 || a.looksLikeDoc),
      kind,
      category: (a.category && a.category !== "phap-ly" ? a.category : null) as TriageResult["category"],
      pillars: a.kwPillars,
      isHot: false,
      priority: a.kwPillars.length + (a.looksLikeDoc ? 2 : 0),
      summary: a.snippet.slice(0, 220),
    });
  }
  return m;
}

function keywordDoc(a: RawArticle, date: string): LegalDocument {
  const num = a.title.match(DOC_NUMBER_RE)?.[0] ?? a.title.slice(0, 60);
  const issue = a.publishedAt ? todayVN(new Date(a.publishedAt)) : null;
  return {
    id: "",
    docNumber: num,
    title: a.title,
    docType: a.title.match(/^(luật|nghị định|nghị quyết|quyết định|thông tư|chỉ thị|công văn|kế hoạch|qcvn|tcvn)/i)?.[0] ?? "Văn bản",
    issuer: "—",
    issueDate: issue,
    effectiveDate: null,
    status: deriveStatus(issue, null, date),
    isHot: false,
    pillars: a.kwPillars,
    summary: a.snippet || a.title,
    impactBullets: [a.snippet.slice(0, 140) || a.title],
    relatedDocs: [],
    affectedSubjects: [],
    comparisons: [],
    actionItems: [],
    keyQuotes: [],
    sourceName: a.sourceName,
    sourceUrl: a.url,
    enriched: false,
  };
}
