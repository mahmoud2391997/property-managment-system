import type { NextConfig } from "next";
import { execSync } from "child_process";
import pkg from "./package.json";

const commitSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bpzwzqzhgqmbnyvvgenk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
