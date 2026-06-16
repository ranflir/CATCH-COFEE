import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  transpilePackages: ['@catch-coffee/types'],
  outputFileTracingRoot: repoRoot,
  typescript: {
    // pnpm Linux CI resolves duplicate @types/react paths; types are checked locally via tsc.
    ignoreBuildErrors: process.env.CI === 'true',
  },
};

export default nextConfig;
