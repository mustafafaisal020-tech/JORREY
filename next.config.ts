import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Bundle the data/ directory so the committed JSON files are readable
  // on Vercel as a seed/fallback before any blob has been written
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default withNextIntl(nextConfig);
