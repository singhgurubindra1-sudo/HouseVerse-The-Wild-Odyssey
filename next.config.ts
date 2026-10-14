import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Proof photos are sent through a server action, so allow a few MB.
      bodySizeLimit: "5mb",
      // Cloud editors (GitHub Codespaces, Gitpod) serve the site from a different
      // address than the server sees, so Next.js would block every form. Allow them.
      allowedOrigins: ["**.github.dev", "**.gitpod.io", "**.app.github.dev", "localhost:3000"],
    },
  },
};

export default nextConfig;
