import type { NextConfig } from "next";

const apiOrigin = process.env.LINGXI_API_ORIGIN || "http://127.0.0.1:8080";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@lingxi/ui",
    "@lingxi/utils",
    "@lingxi/request",
    "@lingxi/i18n",
    "@lingxi/types",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
