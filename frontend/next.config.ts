import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
  },

  webpack(config) {
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};

// Add runtime configuration check
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('Warning: NEXT_PUBLIC_API_URL not set in environment');
}

if (!process.env.NEXT_PUBLIC_WS_URL) {
  console.warn('Warning: NEXT_PUBLIC_WS_URL not set in environment');
}

export default nextConfig;