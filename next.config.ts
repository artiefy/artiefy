import { withNextVideo } from 'next-video/process';

import type { NextConfig } from 'next';

// Import env here to validate environment variables at build time.
// Next.js 16+ resolves this natively — jiti is no longer required.
import './src/env.ts';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [
      {
        // Always serve the freshest service worker and the correct MIME type.
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  reactCompiler: false,
  cacheComponents: false,
  expireTime: 3600,
  experimental: {
    // `useTypeScriptCli: true` makes `next build` run the project-local `tsc`
    // (TypeScript 7) instead of loading the TypeScript JavaScript compiler
    // API. It shipped in 16.3.0-canary.79 and is NOT in 16.2.11: the key is
    // absent from `ExperimentalConfig`, so it fails the typecheck and Next
    // logs "Unrecognized key(s) in object" and ignores it. Re-enable after
    // upgrading to a release that includes vercel/next.js#95639.
    serverActions: {
      bodySizeLimit: '100mb',
      allowedOrigins: [
        'https://artiefy.com',
        'https://accounts.artiefy.com',
        'http://localhost:3000',
      ],
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 14400,
    remotePatterns: [
      new URL('https://s3.us-east-2.amazonaws.com/artiefy-upload/**'),
      new URL('https://artiefy-upload.s3.us-east-2.amazonaws.com/**'),
      { protocol: 'https', hostname: 'placehold.co' },
      new URL('https://i.pravatar.cc/**'),
      new URL('https://img.clerk.com/**'),
      new URL('https://assets.example.com/**'),
    ],
    localPatterns: [
      { pathname: '/api/image-proxy', search: '?url=*' },
      { pathname: '/**' },
    ],
    qualities: [70, 75, 85, 100],
    maximumRedirects: 3,
    dangerouslyAllowLocalIP: false,
  },
};

export default withNextVideo(nextConfig);
