import { buildSecurityHeaders } from "./security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: buildSecurityHeaders() }];
  },
};

export default nextConfig;
