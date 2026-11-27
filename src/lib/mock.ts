/**
 * DỮ LIỆU GIẢ LẬP — chỉ để dựng & test UI. Số hiệu, nội dung văn bản là MẪU, không phải văn bản thật.
 */
import type { DailyBriefing, LegalDocument, NewsItem, PillarAnalysis } from "./types";
import { computeKpis } from "./kpis";

function shift(date: string, days: number): string {
  const d = new Date(date + "T00:00:00+07:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function getMockBriefing(date: string): DailyBriefing {
  const y = date.slice(0, 4);
  const legalDocuments: LegalDocument[] = [
    {
      id: "doc-1",
      docNumber: `45/${y}/QĐ-UBND`,
      title: "Quyết định quy định chi tiết về cấp giấy phép xây dựng có thời hạn và miễn giấy phép đối với nhà ở riêng lẻ trên địa bàn TP.HCM",
      docType: "Quyết định",
      issuer: "UBND TP.HCM",
      issueDate: shift(date, -1),
      effectiveDate: shift(date, 9),
      status: "sap-hieu-luc",
      isHot: true,
      pillars: ["xpxd", "nha-o"],
      summary:
        "Thay thế quy định cũ về GPXD có thời hạn; chuyển thẩm quyền cấp phép nhà ở riêng lẻ về UBND phường/xã sau sắp xếp; bổ sung điều kiện cấp phép có thời hạn tại khu vực đã có quy hoạch phân khu nhưng chưa có kế hoạch sử dụng đất.",
      impactBullets: [
        "UBND phường/xã cấp GPXD nhà ở riêng lẻ — Sở XD chỉ cấp công trình cấp II trở lên",
        "GPXD có thời hạn: tối đa 4 tầng (cũ 3 tầng), ghi rõ thời hạn tồn tại theo kế hoạch SDĐ",
        "Hồ sơ phải kèm cam kết tự tháo dỡ không bồi thường phần xây dựng sau thời hạn",
      ],
      relatedDocs: [
        { docNumber: `(QĐ cũ về GPXD có thời hạn) — MẪU`, relation: "thay-the", note: "Thay thế toàn bộ" },
        { docNumber: "Luật Xây dựng (sửa đổi)", relation: "huong-dan", note: "Quy định chi tiết Điều 94, 89" },
      ],
      affectedSubjects: [
        "Hộ gia đình, cá nhân xây nhà ở riêng lẻ tại khu vực đã có quy hoạch nhưng chưa thu hồi đất",
        "UBND các phường/xã (cơ quan cấp phép mới)",
        "Đơn vị tư vấn thiết kế lập hồ sơ xin phép",
      ],
      comparisons: [
        { topic: "Thẩm quyền cấp GPXD nhà ở riêng lẻ", oldRule: "UBND quận/huyện cấp", newRule: "UBND phường/xã cấp; Sở XD cấp công trình cấp II trở lên", article: "Điều 4" },
        { topic: "Quy mô GPXD có thời hạn", oldRule: "Tối đa 3 tầng (1 trệt 2 lầu)", newRule: "Tối đa 4 tầng, chiều cao ≤ 16m, không có tầng hầm", article: "Khoản 2 Điều 6" },
        { topic: "Thời hạn tồn tại công trình", oldRule: "Theo kế hoạch thực hiện quy hoạch", newRule: "Theo kế hoạch sử dụng đất hằng năm cấp huyện; nếu chưa có — tối đa 5 năm, được gia hạn", article: "Khoản 3 Điều 6" },
      ],
      actionItems: [
        { action: "Cập nhật mẫu đơn đề nghị cấp GPXD có thời hạn & mẫu bản cam kết tự tháo dỡ", target: "Đơn vị tư vấn" },
        { action: "Rà soát hồ sơ đang nộp tại quận cũ — chuyển tiếp về UBND phường theo quy định chuyển tiếp", target: "Chủ đầu tư / Tư vấn", deadline: shift(date, 9) },
        { action: "Điều chỉnh khung tên bản vẽ: cơ quan cấp phép = UBND phường", target: "Bộ phận CAD" },
      ],
      keyQuotes: [
        { article: "Khoản 2 Điều 6", text: "Công trình được cấp giấy phép xây dựng có thời hạn có quy mô tối đa 04 tầng, chiều cao không quá 16 mét… (văn bản MẪU)" },
      ],
      sourceName: "Công báo TP.HCM",
      sourceUrl: "https://congbao.hochiminhcity.gov.vn",
    },
    {
      id: "doc-2",
      docNumber: `12/${y}/QĐ-UBND`,
      title: "Quyết định sửa đổi, bổ sung Bảng giá đất trên địa bàn TP.HCM áp dụng từ năm " + y,
      docType: "Quyết định",
      issuer: "UBND TP.HCM",
      issueDate: shift(date, -1),
      effectiveDate: shift(date, -1),
      status: "moi-ban-hanh",
      isHot: true,
      pillars: ["gpmb", "gcn"],
      summary:
        "Điều chỉnh giá đất ở tại một số tuyến đường khu vực phường ven trung tâm sau sắp xếp đơn vị hành chính; bổ sung giá đất cho các tuyến đường mới đặt tên; làm căn cứ tính tiền bồi thường, tiền SDĐ khi chuyển mục đích.",
      impactBullets: [
        "Giá đất ở một số tuyến khu Bình Quới – Thanh Đa điều chỉnh tăng 8–15%",
        "Bổ sung giá cho 37 tuyến đường mới đặt tên — hết cảnh 'áp giá tuyến tương đồng'",
        "Áp dụng ngay cho hồ sơ bồi thường chưa phê duyệt phương án",
      ],
      relatedDocs: [{ docNumber: "QĐ Bảng giá đất TP.HCM hiện hành — MẪU", relation: "sua-doi" }],
      affectedSubjects: ["Hộ dân thuộc diện thu hồi đất", "Tổ chức làm nhiệm vụ bồi thường, GPMB", "Người chuyển mục đích SDĐ, cấp GCN lần đầu phải nộp tiền SDĐ"],
      comparisons: [
        { topic: "Giá đất ở tuyến nội bộ khu Thanh Đa (MẪU)", oldRule: "Áp giá tuyến tương đồng", newRule: "Có giá riêng theo phụ lục II", article: "Phụ lục II" },
        { topic: "Quy định chuyển tiếp", oldRule: "—", newRule: "Phương án bồi thường đã phê duyệt trước ngày hiệu lực giữ nguyên", article: "Điều 3" },
      ],
      actionItems: [
        { action: "Tính lại dự toán bồi thường các hộ chưa phê duyệt phương án", target: "Tổ bồi thường / Ban QLDA" },
        { action: "Cập nhật bảng tra giá đất trong công cụ nội bộ", target: "Bộ phận kỹ thuật" },
      ],
      keyQuotes: [{ article: "Điều 3", text: "Trường hợp phương án bồi thường, hỗ trợ, tái định cư đã được phê duyệt trước ngày Quyết định này có hiệu lực thì tiếp tục thực hiện theo phương án đã phê duyệt. (MẪU)" }],
      sourceName: "Công báo TP.HCM",
      sourceUrl: "https://congbao.hochiminhcity.gov.vn",
    },
    {
      id: "doc-3",
      docNumber: `QCVN 06:${y}/BXD`,
      title: "Quy chuẩn kỹ thuật quốc gia về An toàn cháy cho nhà và công trình (sửa đổi)",
      docType: "QCVN",
      issuer: "Bộ Xây dựng",
      issueDate: shift(date, -2),
      effectiveDate: shift(date, 60),
      status: "sap-hieu-luc",
      isHot: false,
      pillars: ["tieu-chuan", "hoan-cong"],
      summary:
        "Nới yêu cầu lối thoát nạn thứ hai cho nhà ở riêng lẻ kết hợp kinh doanh ≤ 7 tầng; bổ sung yêu cầu ngăn cháy giữa tầng kinh doanh và tầng ở.",
      impactBullets: [
        "Nhà ở kết hợp KD ≤ 7 tầng được dùng 1 thang bộ nếu có giải pháp ngăn cháy tầng trệt",
        "Bắt buộc vách ngăn cháy EI 60 giữa khu kinh doanh và khu ở",
        "Ảnh hưởng hồ sơ nghiệm thu PCCC nhà ở kết hợp kinh doanh",
      ],
      relatedDocs: [{ docNumber: "QCVN 06:2022/BXD", relation: "sua-doi", note: "Sửa đổi 1 — MẪU" }],
      affectedSubjects: ["Chủ nhà ở riêng lẻ kết hợp kinh doanh", "Đơn vị thiết kế, thẩm tra PCCC", "Cơ quan nghiệm thu PCCC"],
      comparisons: [
        { topic: "Số lối thoát nạn nhà ở kết hợp KD", oldRule: "≥ 2 lối khi diện tích sàn KD > 300 m²", newRule: "Cho phép 1 thang bộ nếu ≤ 7 tầng và có ngăn cháy EI 60", article: "Mục 3.2.6" },
      ],
      actionItems: [
        { action: "Cập nhật thuyết minh PCCC mẫu cho nhà ở kết hợp kinh doanh", target: "Đơn vị tư vấn" },
        { action: "Bổ sung chi tiết vách ngăn cháy EI 60 vào thư viện bản vẽ", target: "Bộ phận CAD" },
      ],
      keyQuotes: [],
      sourceName: "Bộ Xây dựng — Tiêu chuẩn Quy chuẩn",
      sourceUrl: "https://moc.gov.vn",
    },
    {
      id: "doc-4",
      docNumber: `88/${y}/NĐ-CP`,
      title: "Nghị định sửa đổi quy định về điều kiện tách thửa, hợp thửa và diện tích tối thiểu",
      docType: "Nghị định",
      issuer: "Chính phủ",
      issueDate: shift(date, -3),
      effectiveDate: shift(date, 40),
      status: "sap-hieu-luc",
      isHot: false,
      pillars: ["gcn"],
      summary: "Bổ sung nguyên tắc tách thửa đối với thửa đất có nhiều mục đích sử dụng; giao UBND cấp tỉnh quy định chi tiết trong 30 ngày.",
      impactBullets: [
        "Thửa đất ở + nông nghiệp: được tách phần đất nông nghiệp nếu đáp ứng DT tối thiểu riêng",
        "TP.HCM phải ban hành QĐ diện tích tối thiểu mới trong 30 ngày",
      ],
      relatedDocs: [{ docNumber: "NĐ quy định chi tiết Luật Đất đai — MẪU", relation: "sua-doi" }],
      affectedSubjects: ["Người sử dụng đất có nhu cầu tách thửa", "Văn phòng đăng ký đất đai"],
      comparisons: [{ topic: "Tách thửa đất nhiều mục đích", oldRule: "Chưa quy định rõ", newRule: "Xác định DT tối thiểu theo từng mục đích", article: "Khoản 3 Điều 1" }],
      actionItems: [{ action: "Theo dõi QĐ diện tích tối thiểu mới của UBND TP.HCM", target: "Pháp chế" }],
      keyQuotes: [],
      sourceName: "vanban.chinhphu.vn",
      sourceUrl: "https://vanban.chinhphu.vn",
    },
  ];

  const analyses: PillarAnalysis[] = [
    {
      id: "an-1",
      kind: "chi-dao",
      pillars: ["gpmb"],
      title: "UBND TP chỉ đạo đẩy nhanh bồi thường, bàn giao mặt bằng các dự án trọng điểm trước 31/12",
      summary: "TP yêu cầu các phường hoàn tất kiểm đếm, phê duyệt phương án cho các dự án giao thông và khu đô thị trọng điểm; người đứng đầu chịu trách nhiệm nếu chậm.",
      keyPoints: ["Hạn chót bàn giao mặt bằng giai đoạn 1: 31/12", "Ưu tiên bố trí quỹ nhà tái định cư tại chỗ", "Báo cáo tiến độ hằng tuần về Sở XD"],
      sourceName: "Pháp Luật TP.HCM",
      sourceUrl: "https://plo.vn",
      publishedAt: shift(date, 0) + "T06:30:00+07:00",
    },
    {
      id: "an-2",
      kind: "phan-tich",
      pillars: ["hoan-cong", "xpxd"],
      title: "Xây sai phép phần tầng tum: khi nào được hoàn công, khi nào buộc tháo dỡ?",
      summary: "Phân tích các tình huống sai phép phổ biến ở nhà phố TP.HCM và hướng xử lý theo quy định xử phạt hiện hành.",
      keyPoints: ["Sai phép nhưng phù hợp quy hoạch → nộp phạt, điều chỉnh GPXD rồi hoàn công", "Vượt tầng cao quy hoạch → buộc tháo dỡ phần vi phạm"],
      sourceName: "Thư Viện Pháp Luật",
      sourceUrl: "https://thuvienphapluat.vn",
      publishedAt: shift(date, -1) + "T15:00:00+07:00",
    },
    {
      id: "an-3",
      kind: "phan-tich",
      pillars: ["nha-o"],
      title: "Lộ giới hẻm dưới 3,5m: chỉ giới xây dựng và số tầng tối đa theo quy chế kiến trúc",
      summary: "Tổng hợp cách xác định số tầng tối đa theo chiều rộng hẻm và yêu cầu khoảng lùi khi hẻm chưa mở rộng theo lộ giới.",
      keyPoints: ["Hẻm < 3,5m: tối đa 3 tầng + tum", "Phần đất trong lộ giới chỉ được xây tạm, không cấp GCN quyền sở hữu"],
      sourceName: "LuatVietnam",
      sourceUrl: "https://luatvietnam.vn",
      publishedAt: shift(date, -1) + "T10:00:00+07:00",
    },
    {
      id: "an-4",
      kind: "tin-nong",
      pillars: ["gcn"],
      title: "Văn phòng đăng ký đất đai TP triển khai nộp hồ sơ biến động 100% trực tuyến",
      summary: "Từ tháng tới, hồ sơ đăng ký biến động sau hoàn công có thể nộp trực tuyến qua Cổng DVC, nhận kết quả tại phường.",
      keyPoints: ["Áp dụng cho đăng ký biến động tài sản gắn liền với đất", "Rút thời gian giải quyết còn 7 ngày làm việc"],
      sourceName: "Báo Xây Dựng",
      sourceUrl: "https://baoxaydung.vn",
      publishedAt: shift(date, 0) + "T07:10:00+07:00",
    },
  ];

  const n = (id: string, category: NewsItem["category"], title: string, summary: string, sourceName: string, sourceUrl: string, h: string): NewsItem => ({
    id, category, title, summary, sourceName, sourceUrl, publishedAt: `${date}T${h}:00+07:00`,
  });

  const news: NewsItem[] = [
    n("n1", "thoi-su", "TP.HCM khởi công tuyến metro số 2 đoạn Bến Thành – Tham Lương giai đoạn mới", "Dự án điều chỉnh tiến độ, mục tiêu vận hành thương mại trước 2030.", "VnExpress", "https://vnexpress.net", "06:00"),
    n("n2", "thoi-su", "Triều cường đỉnh điểm, nhiều tuyến đường ven sông ngập sâu", "Đài KTTV dự báo đỉnh triều 1,7m trong 3 ngày tới tại trạm Phú An.", "Tuổi Trẻ", "https://tuoitre.vn", "05:30"),
    n("n3", "thoi-su", "Quốc hội thông qua Luật sửa đổi một số luật về đầu tư công", "Rút gọn thủ tục chuẩn bị dự án, phân cấp mạnh cho địa phương.", "Thanh Niên", "https://thanhnien.vn", "07:00"),
    n("n4", "kinh-te", "Ngân hàng Nhà nước giữ nguyên lãi suất điều hành", "Lãi suất cho vay mua nhà bình quân quanh 7–9%/năm.", "CafeF", "https://cafef.vn", "07:45"),
    n("n5", "kinh-te", "GDP quý III tăng 7,1%, đầu tư công giải ngân đạt 68%", "Xây dựng là động lực chính với mức tăng 9%.", "VTV", "https://vtv.vn", "06:15"),
    n("n6", "kinh-te", "Giá thép xây dựng tăng phiên thứ 3 liên tiếp", "Các doanh nghiệp điều chỉnh tăng 150.000–200.000 đồng/tấn.", "CafeF", "https://cafef.vn", "08:00"),
    n("n7", "bat-dong-san", "Thị trường nhà phố TP.HCM: giao dịch hẻm xe hơi tăng 20%", "Nhu cầu tập trung phân khúc dưới 8 tỷ tại các phường ven trung tâm.", "VnExpress", "https://vnexpress.net", "07:20"),
    n("n8", "bat-dong-san", "Khu đô thị mới Bình Quới – Thanh Đa chuẩn bị chi trả bồi thường đợt 2", "Ban QLDA hoàn thiện phương án bồi thường cho các hộ còn lại.", "Pháp Luật TP.HCM", "https://plo.vn", "06:50"),
    n("n9", "cong-nghe", "Cổng Dịch vụ công quốc gia tích hợp định danh VNeID mức 2 cho mọi thủ tục đất đai", "Người dân không cần nộp bản sao CCCD khi làm thủ tục.", "Thanh Niên", "https://thanhnien.vn", "06:40"),
    n("n10", "cong-nghe", "Ứng dụng AI đọc bản vẽ xin phép xây dựng được thí điểm tại một số phường", "Rút ngắn thời gian kiểm tra hồ sơ từ 5 ngày xuống 1 ngày.", "Báo Xây Dựng", "https://baoxaydung.vn", "07:05"),
    n("n11", "the-gioi", "Fed phát tín hiệu giảm lãi suất cuối năm", "Thị trường châu Á tăng điểm phiên sáng.", "VTV", "https://vtv.vn", "07:30"),
    n("n12", "the-gioi", "Trung Quốc tung gói hỗ trợ thị trường bất động sản mới", "Gói tín dụng tập trung vào nhà ở xã hội và dự án dở dang.", "Tuổi Trẻ", "https://tuoitre.vn", "06:10"),
  ];

  const b: DailyBriefing = {
    date,
    generatedAt: `${date}T08:42:00+07:00`,
    publishAt: `${date}T09:00:00+07:00`,
    isMock: true,
    editorNote: "Tâm điểm hôm nay: TP.HCM chuyển thẩm quyền cấp GPXD nhà ở riêng lẻ về phường và điều chỉnh bảng giá đất — ảnh hưởng trực tiếp hồ sơ xin phép và phương án bồi thường đang làm.",
    kpis: computeKpis(legalDocuments, news),
    legalDocuments,
    analyses,
    news,
    stats: { rawCollected: 412, afterDedupe: 186, legalDeepAnalyzed: 4, durationSec: 2510 },
  };
  return b;
}
