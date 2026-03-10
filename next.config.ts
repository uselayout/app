import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow large request bodies for screenshot data in design-md generation
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
