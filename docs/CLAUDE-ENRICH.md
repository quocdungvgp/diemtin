# Hướng dẫn cho Claude — bổ sung Phiếu Tóm Tắt Tác Động (chạy 08:31 mỗi sáng)

Lúc 08:00 GitHub Actions đã cào tin và lọc theo từ khoá vào `public/data/briefings/<YYYY-MM-DD>.json`
(giờ VN). Nhiệm vụ: biến danh sách thô thành bản tin chuyên môn trước 09:00 rồi đẩy lên GitHub
(Cloudflare Pages tự deploy).

## Các bước

1. `git pull`. Ngày hôm nay theo giờ VN: `TZ=Asia/Ho_Chi_Minh date +%F`.
2. Chưa có file của hôm nay: chờ rồi `git pull` lại mỗi 2 phút, tối đa 20 phút. Vẫn chưa có thì báo lại
   (GitHub Actions trễ hoặc lỗi) và dừng.
3. Đọc file. Cấu trúc ở `src/lib/types.ts` (DailyBriefing, LegalDocument, PillarAnalysis); 6 trụ cột ở
   `src/lib/pillars.ts`.
4. Mỗi phần tử `legalDocuments` có `enriched: false`:
   - Đọc văn bản gốc qua `sourceUrl` (WebFetch). Không đọc được thì tìm toàn văn theo số hiệu trên
     vanban.chinhphu.vn, congbao.hochiminhcity.gov.vn, thuvienphapluat.vn, luatvietnam.vn.
   - Không thuộc 6 trụ cột (VD: TTHC lĩnh vực khác, điều lệ hội), hoặc là văn bản của tỉnh/thành khác
     (không phải TP.HCM, không phải văn bản trung ương) → XOÁ khỏi danh sách.
   - Điền đủ: `docNumber` (chuẩn), `title`, `docType`, `issuer`, `issueDate`, `effectiveDate` (YYYY-MM-DD),
     `pillars`, `isHot`, `summary`, `impactBullets` (≤3 dòng, ≤20 từ/dòng, tác động thực tế cho người làm hồ
     sơ XPXD/hoàn công/cấp GCN/bồi thường), `relatedDocs` (bị thay thế/sửa đổi/bãi bỏ), `affectedSubjects`
     (tại TP.HCM), `comparisons` (quy định cũ ↔ mới + điều khoản), `actionItems` (cập nhật biểu mẫu, quy
     trình thẩm định, hồ sơ thiết kế, dự toán bồi thường…), `keyQuotes` (≤3 đoạn trích nguyên văn điều khoản).
   - Đặt `enriched: true`.
   - KHÔNG bịa số hiệu, ngày, điều khoản. Không chắc → null / mảng rỗng. `oldRule` không xác định được thì
     ghi "Chưa xác định từ nội dung văn bản".
5. Rà vanban.chinhphu.vn/he-thong-van-ban, congbao.hochiminhcity.gov.vn, moc.gov.vn (văn bản, tiêu chuẩn –
   quy chuẩn), mae.gov.vn, soxaydung.hochiminhcity.gov.vn, plo.vn, baoxaydung.vn (mấy trang sau GitHub
   Actions không đọc được): văn bản ban hành trong 48h qua
   thuộc 6 trụ cột mà danh sách còn thiếu thì thêm vào (phiếu đầy đủ, `enriched: true`, `id` dạng `doc-N`
   không trùng).
6. `analyses`: viết lại `summary` (3–4 câu) và `keyPoints` (≤5 ý); bỏ bài không liên quan và trang công cụ
   (VD: "Tra cứu diện tích tách thửa"). Tin về văn bản mới của TP.HCM (VD: "bổ sung nhóm công trình miễn GPXD")
   thì tìm văn bản gốc và đưa vào `legalDocuments` với phiếu đầy đủ. `news`: giữ
   nguyên, chỉ sửa `summary` nếu đang lộn xộn.
7. `editorNote`: 1–2 câu "Tâm điểm hôm nay" cho người làm hồ sơ xây dựng/đất đai tại TP.HCM.
8. `aiProvider: "claude-task"`, `enrichedAt` = thời điểm hiện tại (ISO).
9. `npm ci && npm run briefing:finalize -- <ngày>`. Lỗi thì sửa JSON rồi chạy lại.
10. `git add public/data && git commit -m "Claude: phiếu phân tích <ngày>" && git push`.
11. Báo lại ngắn: số văn bản đã phân tích / xoá / thêm, và văn bản nóng nhất.
