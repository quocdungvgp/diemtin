"use client";

import { ArrowUpRight, Building2, ChevronRight, FileStack, FileText, HardHat, Landmark, Ruler, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateVN, formatTimeVN } from "@/lib/date";
import { NEWS_CATEGORIES, PILLARS } from "@/lib/pillars";
import type { DailyBriefing, PillarId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HotBadge, KindBadge, type Selection, StatusBadge } from "./shared";

const PILLAR_ICON: Record<PillarId, React.ElementType> = {
  xpxd: FileText,
  "hoan-cong": HardHat,
  gcn: Landmark,
  "tieu-chuan": Ruler,
  "nha-o": Building2,
  gpmb: Scale,
};

export function ExecutiveView({
  briefing,
  full,
  onSelect,
  onPillarFocus,
}: {
  briefing: DailyBriefing;
  full: DailyBriefing;
  onSelect: (s: Selection) => void;
  onPillarFocus: (id: PillarId) => void;
}) {
  const k = full.kpis;
  const kpis = [
    { label: "Văn bản mới (24h)", value: k.totalNewDocs, icon: FileStack, accent: true },
    { label: "XPXD & Hoàn công", value: k.xpxdHoanCong, icon: HardHat },
    { label: "Cấp GCN", value: k.gcn, icon: Landmark },
    { label: "Tiêu chuẩn / Quy chuẩn", value: k.tieuChuan, icon: Ruler },
    { label: "Đền bù / GPMB", value: k.gpmb, icon: Scale },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-3 py-4 font-sans sm:px-6 sm:py-6">
      {full.editorNote && (
        <p className="rounded-lg border-l-4 border-red-800 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-700 shadow-sm">
          <b className="text-red-800">Tâm điểm: </b>
          {full.editorNote}
        </p>
      )}

      {/* Hàng 1 — KPI */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((c, i) => (
          <Card key={c.label} className={cn("p-4", c.accent && "border-red-800 bg-red-800 text-white", i === 0 && "col-span-2 sm:col-span-1")}>
            <div className="flex items-start justify-between">
              <span className={cn("text-xs font-medium", c.accent ? "text-red-100" : "text-zinc-500")}>{c.label}</span>
              <c.icon className={cn("size-4", c.accent ? "text-red-200" : "text-zinc-400")} />
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">{c.value}</div>
          </Card>
        ))}
      </section>

      {/* Hàng 2 — Radar 6 trụ cột */}
      <section>
        <SectionTitle title="Radar 6 trụ cột" sub="Tối đa 3 tác động nổi bật nhất / trụ cột trong 24h" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = PILLAR_ICON[p.id];
            const docs = briefing.legalDocuments.filter((d) => d.pillars.includes(p.id));
            const ans = briefing.analyses.filter((a) => a.pillars.includes(p.id));
            const items: { key: string; sel: Selection; head: string; impact: string; badge: React.ReactNode }[] = [
              ...docs
                .slice()
                .sort((a, b) => Number(b.isHot) - Number(a.isHot))
                .map((d) => ({
                  key: d.id,
                  sel: { type: "doc" as const, item: d },
                  head: d.docNumber,
                  impact: d.impactBullets[0] ?? d.summary,
                  badge: d.isHot ? <HotBadge /> : <StatusBadge status={d.status} />,
                })),
              ...ans.map((a) => ({
                key: a.id,
                sel: { type: "analysis" as const, item: a },
                head: a.sourceName,
                impact: a.title,
                badge: <KindBadge kind={a.kind} />,
              })),
            ];
            const shown = items.slice(0, 3);
            return (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <button onClick={() => onPillarFocus(p.id)} className="flex items-center gap-2 text-left" title={p.scope}>
                    <span className={cn("grid size-8 place-items-center rounded-lg border", p.tone)}>
                      <Icon className="size-4" />
                    </span>
                    <CardTitle>{p.name}</CardTitle>
                  </button>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">{items.length}</span>
                </CardHeader>
                <CardContent className="flex-1">
                  {shown.length === 0 ? (
                    <p className="py-4 text-center text-sm text-zinc-400">Không có cập nhật trong 24h</p>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {shown.map((it) => (
                        <li key={it.key}>
                          <button
                            onClick={() => onSelect(it.sel)}
                            className="group flex w-full items-start gap-2 py-2.5 text-left hover:bg-zinc-50"
                          >
                            <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", p.dot)} />
                            <span className="min-w-0 flex-1">
                              <span className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-semibold text-zinc-500">{it.head}</span>
                                {it.badge}
                              </span>
                              <span className="block text-sm leading-snug text-zinc-800">{it.impact}</span>
                            </span>
                            <ChevronRight className="mt-1 size-4 shrink-0 text-zinc-300 group-hover:text-zinc-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {items.length > 3 && (
                    <button onClick={() => onPillarFocus(p.id)} className="mt-1 text-xs font-medium text-red-800 hover:underline">
                      +{items.length - 3} mục khác
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Hàng 3 — Điểm tin tổng hợp */}
      <section>
        <SectionTitle title="Điểm tin tổng hợp 24h" sub={`${briefing.news.length} tin · VnExpress, Tuổi Trẻ, Thanh Niên, CafeF, VTV`} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {NEWS_CATEGORIES.map((c) => {
            const items = briefing.news.filter((n) => n.category === c.id).slice(0, 5);
            return (
              <Card key={c.id}>
                <CardHeader className="pt-3">
                  <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {items.length === 0 ? (
                    <p className="text-sm text-zinc-400">—</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {items.map((n) => (
                        <li key={n.id}>
                          <a href={n.sourceUrl} target="_blank" rel="noreferrer" className="group block">
                            <span className="text-sm font-medium leading-snug group-hover:text-red-800">
                              {n.title}
                              <ArrowUpRight className="ml-0.5 inline size-3 text-zinc-300 group-hover:text-red-800" />
                            </span>
                            <span className="mt-0.5 block text-[11px] text-zinc-400">
                              {n.sourceName} · {formatTimeVN(n.publishedAt)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="pb-6 text-center text-[11px] text-zinc-400">
        Bản tin ngày {formatDateVN(full.date)} · phát hành {formatTimeVN(full.publishAt)}
        {full.stats && ` · ${full.stats.rawCollected} tin thô → ${full.stats.afterDedupe} sau lọc → ${full.stats.legalDeepAnalyzed} văn bản phân tích sâu`}
      </footer>
    </main>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      {sub && <span className="hidden text-xs text-zinc-500 sm:inline">{sub}</span>}
    </div>
  );
}
