import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  transpilePackages: ['@catch-coffee/types'],
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
