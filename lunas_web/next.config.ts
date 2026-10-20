import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // This repository sits below a separate user-level lockfile on the test machine.
    root: process.cwd(),
  },
  output: 'standalone', // Enable for Docker deployment
  async redirects() {
    return [{
      source: "/validation-routing/exceptions",
      destination: "/validation-routing/reports",
      permanent: false,
    }];
  },
};

export default nextConfig;
