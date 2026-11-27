"use client";

import { ExternalLink, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateVN } from "@/lib/date";
import { PILLAR_MAP, STATUS_LABEL } from "@/lib/pillars";
import type { DocStatus, LegalDocument, PillarAnalysis, PillarId } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Selection = { type: "doc"; item: LegalDocument } | { type: "analysis"; item: PillarAnalysis };

export function StatusBadge({ status }: { status: DocStatus }) {
  const s = STATUS_LABEL[status];
  return <Badge className={s.cls}>{s.label}</Badge>;
}

export function HotBadge() {
  return (
    <Badge className="bg-red-600 text-white">
      <Flame className="size-3" /> Tin nóng
    </Badge>
  );
}

const KIND: Record<PillarAnalysis["kind"], { label: string; cls: string }> = {
  "chi-dao": { label: "Chỉ đạo điều hành", cls: "bg-violet-600 text-white" },
  "phan-tich": { label: "Phân tích", cls: "bg-zinc-700 text-white" },
  "tin-nong": { label: "Tin nóng", cls: "bg-red-600 text-white" },
};
export function KindBadge({ kind }: { kind: PillarAnalysis["kind"] }) {
  return <Badge className={KIND[kind].cls}>{KIND[kind].label}</Badge>;
}

export function PillarTag({ id, className }: { id: PillarId; className?: string }) {
  const p = PILLAR_MAP[id];
  return <Badge className={cn("border", p.tone, className)}>{p.short}</Badge>;
}

const REL: Record<string, string> = {
  "thay-the": "Thay thế",
  "sua-doi": "Sửa đổi",
  "bai-bo": "Bãi bỏ",
  "huong-dan": "Hướng dẫn",
  "dan-chieu": "Dẫn chiếu",
};

/** Phiếu Tóm Tắt Tác Động Nghiệp Vụ — dùng chung cho Drawer và Chuyên san */
export function LegalDocSheet({ doc, serif = false }: { doc: LegalDocument; serif?: boolean }) {
  return (
    <div className={cn("space-y-5 text-[15px]", serif && "font-serif")}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-sm sm:grid-cols-4">
        <Meta k="Số hiệu" v={doc.docNumber} />
        <Meta k="Cơ quan ban hành" v={doc.issuer} />
        <Meta k="Ngày ban hành" v={formatDateVN(doc.issueDate)} />
        <Meta k="Ngày hiệu lực" v={formatDateVN(doc.effectiveDate)} />
      </dl>

      <p className="leading-relaxed text-zinc-800">{doc.summary}</p>

      {doc.enriched === false && (
        <p className="rounded-md border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2 font-sans text-xs text-amber-800">
          Văn bản mới được nhận diện theo từ khoá — phiếu so sánh cũ/mới, đối tượng tác động và hành động thực thi đang chờ Claude phân tích.
        </p>
      )}

      {doc.relatedDocs.length > 0 && (
        <Section title="Văn bản bị thay thế / sửa đổi">
          <ul className="space-y-1 text-sm">
            {doc.relatedDocs.map((r, i) => (
              <li key={i}>
                <span className="font-semibold">{REL[r.relation] ?? r.relation}:</span> {r.docNumber}
                {r.note && <span className="text-zinc-500"> — {r.note}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {doc.affectedSubjects.length > 0 && (
        <Section title="Đối tượng chịu tác động trực tiếp tại TP.HCM">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {doc.affectedSubjects.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {doc.comparisons.length > 0 && (
        <Section title="Đối chiếu Quy định cũ ↔ Quy định mới">
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="w-[24%] p-2">Nội dung</th>
                  <th className="w-[33%] p-2">Quy định cũ</th>
                  <th className="w-[33%] p-2">Quy định mới</th>
                  <th className="p-2">Điều khoản</th>
                </tr>
              </thead>
              <tbody>
                {doc.comparisons.map((c, i) => (
                  <tr key={i} className="border-t border-zinc-200 align-top">
                    <td className="p-2 font-medium">{c.topic}</td>
                    <td className="p-2 text-zinc-500 line-through decoration-zinc-300">{c.oldRule}</td>
                    <td className="bg-emerald-50/60 p-2 text-emerald-900">{c.newRule}</td>
                    <td className="p-2 text-xs text-zinc-500">{c.article}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {doc.actionItems.length > 0 && (
        <Section title="Hành động / Lưu ý thực thi">
          <ul className="space-y-2 text-sm">
            {doc.actionItems.map((a, i) => (
              <li key={i} className="flex gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-2">
                <span className="mt-0.5 inline-block size-4 shrink-0 rounded border border-amber-400 bg-white" />
                <span>
                  {a.action}
                  {(a.target || a.deadline) && (
                    <span className="block text-xs text-zinc-500">
                      {a.target}
                      {a.target && a.deadline && " · "}
                      {a.deadline && `Hạn: ${formatDateVN(a.deadline)}`}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {doc.keyQuotes.length > 0 && (
        <Section title="Trích dẫn nguyên văn">
          {doc.keyQuotes.map((q, i) => (
            <blockquote key={i} className="border-l-4 border-red-700 bg-white py-1 pl-3 font-serif text-sm italic text-zinc-700">
              <span className="not-italic font-semibold">{q.article}: </span>
              {q.text}
            </blockquote>
          ))}
        </Section>
      )}

      <SourceLink name={doc.sourceName} url={doc.sourceUrl} />
    </div>
  );
}

export function AnalysisSheet({ a }: { a: PillarAnalysis }) {
  return (
    <div className="space-y-4 text-[15px]">
      <p className="leading-relaxed text-zinc-800">{a.summary}</p>
      {a.keyPoints.length > 0 && (
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {a.keyPoints.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      )}
      <SourceLink name={a.sourceName} url={a.sourceUrl} />
    </div>
  );
}

export function SourceLink({ name, url }: { name: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-red-800 hover:underline">
      <ExternalLink className="size-3.5" /> {name}
    </a>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-zinc-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</h4>
      {children}
    </section>
  );
}
