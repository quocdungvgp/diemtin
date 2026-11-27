# Điểm tin 9h00 · Radar Pháp lý Đất đai – Xây dựng TP.HCM

Web tĩnh, không server, không API key:

```
08:00  GitHub Actions ──► cào RSS báo + Công báo/Chính phủ ──► lọc 6 trụ cột theo từ khoá
                         ──► public/data/briefings/<ngày>.json ──► push ──► Cloudflare Pages deploy
08:31  Tác vụ đã lên lịch của Claude ──► đọc văn bản gốc ──► viết Phiếu tóm tắt tác động (cũ↔mới,
                         đối tượng, hành động, trích dẫn) ──► finalize ──► push ──► deploy lại
09:00  Mọi người mở web xem
```

## Cài đặt 1 lần

1. **GitHub:** tạo repo `diem-tin-9h`, đẩy code này lên (nhánh `main`).
2. **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git → chọn repo.
   - Framework preset: *Next.js (Static HTML Export)* · Build command: `npm run build` · Output: `out`
   - Environment variable: `NODE_VERSION = 22`
   - Custom domains → thêm `diemtin.thietkevivi.com` (nếu DNS ở Cloudflare).
3. **Chạy thử ngay:** GitHub → tab Actions → "Điểm tin 08:00" → Run workflow.
4. **Claude 08:31:** tác vụ đã lên lịch đọc `docs/CLAUDE-ENRICH.md` và làm theo.

## Chạy trên máy (tuỳ chọn)

```bash
npm install
npm run check:sources          # nguồn nào sống
npm run briefing:build         # tạo bản tin hôm nay vào public/data
npm run dev                    # http://localhost:3000
```

Chưa có dữ liệu thì web hiện **dữ liệu mẫu** (có dải cảnh báo). Xem mẫu bất cứ lúc nào: `/?demo=1`.

`AI_PROVIDER` trong `.env`: `none` (từ khoá) · `ollama` (AI chạy local, miễn phí) · `anthropic` (Claude API).

## Cấu trúc

```
public/data/index.json                 danh sách ngày + KPI
public/data/briefings/<ngày>.json      bản tin (schema: src/lib/types.ts)
public/data/legal-documents.json       kho văn bản lâu dài (Phase 2: tra cứu)
src/lib/pipeline/sources.ts            nguồn tin — sửa ở đây
src/lib/pipeline/collect.ts            RSS / HTML / Playwright, khử trùng, lấy toàn văn
src/lib/pipeline/ai.ts                 AI 2 tầng (Claude API hoặc Ollama) — tuỳ chọn
src/lib/pipeline/run.ts                điều phối
scripts/build-briefing.ts              chạy pipeline (GitHub Actions gọi)
scripts/finalize-briefing.ts           chuẩn hoá sau khi Claude bổ sung phiếu
docs/CLAUDE-ENRICH.md                  quy trình cho Claude lúc 08:31
src/components/briefing/               UI Dashboard / Chuyên san
```

## Lưu ý

- `src/lib/mock.ts` là dữ liệu giả lập, không phải văn bản thật.
- Nguồn đã kiểm tra 27/11/2026: Tuổi Trẻ, Thanh Niên, CafeF, Công báo TP.HCM, vanban.chinhphu.vn đọc được.
  PLO, Báo Xây Dựng, Thư Viện Pháp Luật chặn một số công cụ đọc tự động — xem log Actions để biết.
- Phiếu phân tích do AI lập: đối chiếu văn bản gốc trước khi dùng cho hồ sơ.
