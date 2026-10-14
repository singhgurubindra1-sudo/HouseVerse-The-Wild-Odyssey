import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Proof photos are sent through a server action, so allow a few MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
