import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${process.env.API_URL ?? "http://localhost:4001"}/:path*` }];
  },
};
export default nextConfig;
