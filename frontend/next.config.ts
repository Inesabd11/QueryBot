//frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  // images: {
  //   domains: ['localhost', 'My-backend.com'], // replace 'My-backend.com' with  actual domain later
  // },
  webpack(config) {
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};

export default nextConfig;
