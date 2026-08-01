import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // This repository sits below a separate user-level lockfile on the test machine.
    root: process.cwd(),
  },
};

export default nextConfig;
