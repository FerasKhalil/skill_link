import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  // Use webpack for compatibility with Node 26
  experimental: {},
};

export default nextConfig;
