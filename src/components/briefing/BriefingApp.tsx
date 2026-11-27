"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { normalizeVi, PILLARS } from "@/lib/pillars";
import type { DailyBriefing, PillarId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EditorialView } from "./EditorialView";
import { ExecutiveView } from "./ExecutiveView";
import { Header, type ViewMode } from "./Header";
import { AnalysisSheet, KindBadge, LegalDocSheet, PillarTag, type Selection, StatusBadge } from "./shared";

export function BriefingApp({ briefing, initialView }: { briefing: DailyBriefing; initialView: ViewMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<ViewMode>(initialView);
  const [query, setQuery] = useState("");
  const [pillars, setPillars] = useState<PillarId[]>([]);
  const [selected, setSelected] = useState<Selection | null>(null);

  const changeView = (v: ViewMode) => {
    setView(v);
    const sp = new URLSearchParams(params.toString());
    sp.set("view", v);
    window.history.replaceState(null, "", `?${sp.toString()}`);
    window.scrollTo({ top: 0 });
  };

  const changeDate = (d: string) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("date", d);
    sp.set("view", view);
    router.push(`/?${sp.toString()}`);
  };

  const filtered = useMemo<DailyBriefing>(() => {
    const q = normalizeVi(query);
    const hit = (...parts: (string | undefined | null)[]) => !q || normalizeVi(parts.filter(Boolean).join(" ")).includes(q);
    const inPillar = (ps: PillarId[]) => !pillars.length || ps.some((p) => pillars.includes(p));
    return {
      ...briefing,
      legalDocuments: briefing.legalDocuments.filter(
        (d) =>
          inPillar(d.pillars) &&
          hit(d.docNumber, d.title, d.summary, d.issuer, d.impactBullets.join(" "), d.comparisons.map((c) => c.topic + c.newRule).join(" ")),
      ),
      analyses: briefing.analyses.filter((a) => inPillar(a.pillars) && hit(a.title, a.summary, a.keyPoints.join(" "))),
      news: briefing.news.filter((n) => hit(n.title, n.summary, n.sourceName)),
    };
  }, [briefing, query, pillars]);

  const togglePillar = (id: PillarId) =>
    setPillars((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className={cn("min-h-dvh", view === "editorial" && "editorial")}>
      <Header
        briefing={briefing}
        view={view}
        onViewChange={changeView}
        query={query}
        onQueryChange={setQuery}
        onDateChange={changeDate}
      >
        {/* Bộ lọc 6 trụ cột */}
        <div className="border-t border-zinc-100">
          <div className="scrollbar-none mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-3 py-2 sm:px-6">
            <button
              onClick={() => setPillars([])}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                !pillars.length ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-600",
              )}
            >
              Tất cả
            </button>
            {PILLARS.map((p) => {
              const on = pillars.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePillar(p.id)}
                  title={p.scope}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    on ? p.tone + " ring-1 ring-current" : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  <span className={cn("size-2 rounded-full", p.dot)} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </Header>

      {briefing.isMock && (
        <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center font-sans text-xs text-amber-800">
          <AlertTriangle className="mr-1 inline size-3.5" />
          Đang hiển thị <b>DỮ LIỆU MẪU</b> — số hiệu, nội dung văn bản là giả lập để dựng giao diện.
        </div>
      )}

      {view === "dashboard" ? (
        <ExecutiveView briefing={filtered} full={briefing} onSelect={setSelected} onPillarFocus={(id) => setPillars([id])} />
      ) : (
        <EditorialView briefing={filtered} />
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <div className="border-b border-zinc-200 px-5 pb-4 pt-5 pr-12">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selected.type === "doc" ? (
                    <StatusBadge status={selected.item.status} />
                  ) : (
                    <KindBadge kind={selected.item.kind} />
                  )}
                  {selected.item.pillars.map((p) => (
                    <PillarTag key={p} id={p} />
                  ))}
                </div>
                <SheetTitle className="text-lg font-semibold leading-snug">
                  {selected.type === "doc" ? `${selected.item.docNumber} — ${selected.item.title}` : selected.item.title}
                </SheetTitle>
                <SheetDescription className="sr-only">Chi tiết</SheetDescription>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {selected.type === "doc" ? <LegalDocSheet doc={selected.item} /> : <AnalysisSheet a={selected.item} />}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
