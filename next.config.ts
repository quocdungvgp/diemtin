import type { NextConfig } from "next";

// Web tĩnh: `npm run build` → thư mục out/ (Cloudflare Pages / GitHub Pages / bất kỳ host tĩnh)
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
