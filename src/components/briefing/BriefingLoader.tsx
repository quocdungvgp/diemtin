"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { formatDateVN, isValidDate, todayVN } from "@/lib/date";
import { getMockBriefing } from "@/lib/mock";
import type { BriefingKpis, DailyBriefing } from "@/lib/types";
import { BriefingApp } from "./BriefingApp";
import type { ViewMode } from "./Header";

interface IndexEntry {
  date: string;
  generatedAt: string;
  enriched: boolean;
  kpis: BriefingKpis;
}

type State =
  | { s: "loading" }
  | { s: "ready"; briefing: DailyBriefing; dates: string[] }
  | { s: "missing"; date: string; latest?: string };

const fetchJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const r = await fetch(url, { cache: "no-cache" });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
};

export function BriefingLoader() {
  const params = useSearchParams();
  const qDate = params.get("date");
  const view: ViewMode = params.get("view") === "editorial" ? "editorial" : "dashboard";
  const [state, setState] = useState<State>({ s: "loading" });

  useEffect(() => {
    let alive = true;
    (async () => {
      const index = (await fetchJson<IndexEntry[]>("/data/index.json")) ?? [];
      const dates = index.map((e) => e.date);
      const date = isValidDate(qDate) ? qDate : (dates[0] ?? todayVN());
      let briefing: DailyBriefing | null = null;
      if (params.get("demo") === "1" || !index.length) briefing = getMockBriefing(date);
      else if (dates.includes(date)) briefing = await fetchJson<DailyBriefing>(`/data/briefings/${date}.json`);
      if (!alive) return;
      setState(briefing ? { s: "ready", briefing, dates } : { s: "missing", date, latest: dates[0] });
    })();
    return () => {
      alive = false;
    };
  }, [qDate, params]);

  if (state.s === "loading")
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-zinc-500">
        <Loader2 className="size-6 animate-spin text-red-800" />
      </div>
    );

  if (state.s === "missing")
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <Clock className="mx-auto size-10 text-red-800" />
          <h1 className="text-xl font-bold">Chưa có bản tin ngày {formatDateVN(state.date)}</h1>
          <p className="text-sm text-zinc-500">Hệ thống tự thu thập từ sáng sớm và cập nhật phiếu phân tích trước 09:00 mỗi sáng.</p>
          {state.latest && (
            <Link href={`/?date=${state.latest}&view=${view}`} className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
              Xem bản tin mới nhất ({formatDateVN(state.latest)})
            </Link>
          )}
        </div>
      </main>
    );

  return <BriefingApp key={state.briefing.date} briefing={state.briefing} initialView={view} />;
}
