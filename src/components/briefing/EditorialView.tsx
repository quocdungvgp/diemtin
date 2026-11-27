"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Download, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateVN, formatTimeVN } from "@/lib/date";
import { briefingToMarkdown } from "@/lib/markdown";
import { NEWS_CATEGORIES, PILLARS } from "@/lib/pillars";
import type { DailyBriefing } from "@/lib/types";
import { HotBadge, KindBadge, LegalDocSheet, PillarTag, SourceLink, StatusBadge } from "./shared";

export function EditorialView({ briefing }: { briefing: DailyBriefing }) {
  const pillarsWithAnalyses = PILLARS.filter((p) => briefing.analyses.some((a) => a.pillars.includes(p.id)));
  const toc = [
    { id: "phan-1", label: "I. Radar văn bản pháp luật mới", children: briefing.legalDocuments.map((d) => ({ id: `doc-${d.id}`, label: d.docNumber })) },
    { id: "phan-2", label: "II. Phân tích theo 6 trụ cột", children: pillarsWithAnalyses.map((p) => ({ id: `tc-${p.id}`, label: p.name })) },
    { id: "phan-3", label: "III. Toàn cảnh tin tức 24h", children: NEWS_CATEGORIES.filter((c) => briefing.news.some((n) => n.category === c.id)).map((c) => ({ id: `tt-${c.id}`, label: c.name })) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Masthead */}
      <header className="mb-8 border-b-4 border-double border-zinc-800 pb-5 text-center">
        <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-red-800">Chuyên san pháp lý · Đất đai – Xây dựng TP.HCM</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Điểm tin sáng 9h00</h1>
        <div className="mt-2 font-sans text-sm text-zinc-600">
          {formatDateVN(briefing.date, true)} · phát hành {formatTimeVN(briefing.publishAt)}
        </div>
        {briefing.editorNote && <p className="mx-auto mt-4 max-w-3xl text-lg italic leading-relaxed text-zinc-700">{briefing.editorNote}</p>}
        <ExportBar briefing={briefing} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <article className="min-w-0 space-y-14">
          {/* PHẦN I */}
          <section id="phan-1" className="scroll-mt-32">
            <PartHeading no="I" title="Radar văn bản pháp luật mới" sub="Tâm điểm TP.HCM — Phiếu tóm tắt tác động nghiệp vụ" />
            {briefing.legalDocuments.length === 0 && <Empty />}
            <div className="space-y-10">
              {briefing.legalDocuments.map((d, i) => (
                <article key={d.id} id={`doc-${d.id}`} className="scroll-mt-32 rounded-xl border border-zinc-300/70 bg-white/80 p-5 shadow-sm sm:p-7">
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 font-sans">
                    <span className="mr-1 text-xs font-bold text-zinc-400">PHIẾU {String(i + 1).padStart(2, "0")}</span>
                    <StatusBadge status={d.status} />
                    {d.isHot && <HotBadge />}
                    {d.pillars.map((p) => (
                      <PillarTag key={p} id={p} />
                    ))}
                    <span className="ml-auto text-xs text-zinc-500">{d.docType}</span>
                  </div>
                  <h3 className="mb-4 text-xl font-bold leading-snug sm:text-2xl">
                    <span className="text-red-800">{d.docNumber}</span> — {d.title}
                  </h3>
                  <LegalDocSheet doc={d} serif />
                </article>
              ))}
            </div>
          </section>

          {/* PHẦN II */}
          <section id="phan-2" className="print-break scroll-mt-32">
            <PartHeading no="II" title="Phân tích chuyên sâu theo 6 trụ cột" sub="Bài phân tích, chỉ đạo điều hành của UBND TP.HCM và các Sở ngành" />
            {pillarsWithAnalyses.length === 0 && <Empty />}
            <div className="space-y-10">
              {pillarsWithAnalyses.map((p) => (
                <div key={p.id} id={`tc-${p.id}`} className="scroll-mt-32">
                  <h3 className="mb-4 flex items-center gap-2 border-b border-zinc-300 pb-2 font-sans text-sm font-bold uppercase tracking-wider">
                    <span className={`size-2.5 rounded-full ${p.dot}`} />
                    {p.name}
                  </h3>
                  <div className="space-y-6">
                    {briefing.analyses
                      .filter((a) => a.pillars.includes(p.id))
                      .map((a) => (
                        <div key={a.id} className="prose-body">
                          <div className="mb-1 flex flex-wrap items-center gap-2 font-sans">
                            <KindBadge kind={a.kind} />
                            <span className="text-xs text-zinc-500">
                              {a.sourceName} · {formatDateVN(a.publishedAt)} {formatTimeVN(a.publishedAt)}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold leading-snug">{a.title}</h4>
                          <p className="mt-1 text-zinc-800">{a.summary}</p>
                          {a.keyPoints.length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-zinc-700">
                              {a.keyPoints.map((k, i) => (
                                <li key={i}>{k}</li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-1 font-sans">
                            <SourceLink name="Đọc bài gốc" url={a.sourceUrl} />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PHẦN III */}
          <section id="phan-3" className="print-break scroll-mt-32">
            <PartHeading no="III" title="Toàn cảnh tin tức 24h" sub="Vĩ mô trong nước và quốc tế" />
            <div className="space-y-8">
              {NEWS_CATEGORIES.map((c) => {
                const items = briefing.news.filter((n) => n.category === c.id);
                if (!items.length) return null;
                return (
                  <div key={c.id} id={`tt-${c.id}`} className="scroll-mt-32">
                    <h3 className="mb-3 border-b border-zinc-300 pb-1 font-sans text-sm font-bold uppercase tracking-wider">{c.name}</h3>
                    <ul className="space-y-3">
                      {items.map((n) => (
                        <li key={n.id} className="leading-relaxed">
                          <a href={n.sourceUrl} target="_blank" rel="noreferrer" className="font-bold hover:text-red-800">
                            {n.title}
                          </a>{" "}
                          — <span className="text-zinc-700">{n.summary}</span>{" "}
                          <span className="font-sans text-xs text-zinc-500">({n.sourceName})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </article>

        {/* Mục lục bám dính */}
        <aside className="no-print hidden lg:block">
          <nav className="sticky top-32 rounded-xl border border-zinc-300/70 bg-white/70 p-4 font-sans text-sm">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Mục lục</div>
            <ol className="space-y-3">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="font-semibold hover:text-red-800">
                    {t.label}
                  </a>
                  {t.children.length > 0 && (
                    <ul className="mt-1 space-y-1 border-l border-zinc-200 pl-3">
                      {t.children.map((c) => (
                        <li key={c.id}>
                          <a href={`#${c.id}`} className="text-zinc-600 hover:text-red-800">
                            {c.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </div>
  );
}

function PartHeading({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <div className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-red-800">Phần {no}</div>
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="font-sans text-sm text-zinc-500">{sub}</p>
    </div>
  );
}

function Empty() {
  return <p className="italic text-zinc-500">Không có nội dung phù hợp bộ lọc.</p>;
}

function ExportBar({ briefing }: { briefing: DailyBriefing }) {
  const [copied, setCopied] = useState(false);
  const md = () => briefingToMarkdown(briefing);

  const copy = async () => {
    const text = md();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([md()], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `diem-tin-${briefing.date}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="no-print mt-5 flex flex-wrap justify-center gap-2 font-sans">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer /> In
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()} title="Chọn 'Lưu thành PDF' trong hộp thoại in">
        <FileDown /> Xuất PDF
      </Button>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <ClipboardCopy />} {copied ? "Đã copy" : "Copy Markdown"}
      </Button>
      <Button variant="outline" size="sm" onClick={download}>
        <Download /> Tải .md
      </Button>
    </div>
  );
}
