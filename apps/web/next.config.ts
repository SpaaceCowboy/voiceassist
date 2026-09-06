import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${process.env.API_URL ?? "http://localhost:4001"}/:path*` }];
  },
};
export default nextConfig;
