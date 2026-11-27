import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Điểm tin 9h00 — Radar Pháp lý TP.HCM",
    short_name: "Điểm tin 9h",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#991b1b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
