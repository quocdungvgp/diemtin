import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Điểm tin 9h00 · Radar Pháp lý Đất đai – Xây dựng TP.HCM",
  description: "Bản tin tự động mỗi sáng: văn bản pháp luật mới về đất đai, xây dựng TP.HCM và tin tức tổng hợp 24h.",
  applicationName: "Điểm tin 9h00",
  appleWebApp: { capable: true, title: "Điểm tin 9h", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#991b1b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
