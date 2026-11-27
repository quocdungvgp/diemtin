"use client";

import { BookOpenText, LayoutDashboard, Search, Sparkles, Tags } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatDateVN, formatTimeVN } from "@/lib/date";
import type { DailyBriefing } from "@/lib/types";

export type ViewMode = "dashboard" | "editorial";

export function Header(props: {
  briefing: DailyBriefing;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  query: string;
  onQueryChange: (q: string) => void;
  onDateChange: (d: string) => void;
  children?: React.ReactNode;
}) {
  const { briefing, view } = props;
  return (
    <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 font-sans backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-800 text-[11px] font-black leading-none text-white">
            9H
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold">Điểm tin 9h00 · Radar Pháp lý</div>
            <div className="truncate text-[11px] text-zinc-500">
              {formatDateVN(briefing.date, true)} · cập nhật {formatTimeVN(briefing.generatedAt)}
            </div>
          </div>
        </div>

        <div className="order-3 flex w-full items-center gap-2 md:order-2 md:ml-auto md:w-auto">
          <input
            type="date"
            value={briefing.date}
            max={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })}
            onChange={(e) => e.target.value && props.onDateChange(e.target.value)}
            className="h-9 shrink-0 rounded-md border border-zinc-300 bg-white px-2 text-sm"
            aria-label="Chọn ngày"
          />
          <label className="relative flex-1 md:w-64 md:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={props.query}
              onChange={(e) => props.onQueryChange(e.target.value)}
              placeholder="Tìm số hiệu, từ khoá… (không dấu cũng được)"
              className="h-9 w-full rounded-md border border-zinc-300 bg-white pl-8 pr-2 text-sm placeholder:text-zinc-400"
            />
          </label>
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3 md:ml-0">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
            <LayoutDashboard className={view === "dashboard" ? "size-4 text-red-800" : "size-4 text-zinc-400"} />
            <span className="hidden text-xs font-medium lg:inline">Dashboard</span>
            <Switch
              checked={view === "editorial"}
              onCheckedChange={(c) => props.onViewChange(c ? "editorial" : "dashboard")}
              aria-label="Chuyển Dashboard / Chuyên san"
            />
            <span className="hidden text-xs font-medium lg:inline">Chuyên san</span>
            <BookOpenText className={view === "editorial" ? "size-4 text-red-800" : "size-4 text-zinc-400"} />
          </div>
          <AiBadge briefing={briefing} />
        </div>
      </div>
      {props.children}
    </header>
  );
}

function AiBadge({ briefing }: { briefing: DailyBriefing }) {
  const ai = !!briefing.enrichedAt || briefing.isMock;
  return (
    <span
      title={ai ? "Văn bản đã có phiếu phân tích AI" : "Mới lọc theo từ khoá — phiếu phân tích sẽ được Claude bổ sung"}
      className={
        "inline-flex h-9 items-center gap-1 rounded-md border px-2 text-xs font-medium " +
        (ai ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")
      }
    >
      {ai ? <Sparkles className="size-4" /> : <Tags className="size-4" />}
      <span className="hidden sm:inline">{ai ? "Đã phân tích" : "Chờ phân tích"}</span>
    </span>
  );
}
