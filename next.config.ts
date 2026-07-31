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
  // `experimental.useTypeScriptCli: true` makes `next build` run the
  // project-local `tsc` binary instead of TypeScript's JavaScript compiler
  // API. It is available in this version, but it is only required with
  // TypeScript 7 — this project is on TypeScript 6, where the default
  // in-process checker works and produces better Next.js code frames.
  experimental: {
    // Server Actions are stable since Next.js 14; only these tuning options
    // still live under `experimental`.
    serverActions: {
      // Applies to Server Action requests only, never to Route Handlers.
      // File uploads go through `src/app/api/**` with S3 presigned URLs, so
      // this only has to cover serialized action arguments. Next's default
      // is 1MB; 5MB leaves headroom for the largest payloads without
      // opening a cheap resource-exhaustion vector.
      bodySizeLimit: '5mb',
      // `allowedOrigins` is intentionally omitted: same-origin requests are
      // always allowed, and the app is not served behind a reverse proxy
      // that rewrites the host. If one is ever added, list bare hosts here
      // (`['artiefy.com', '*.artiefy.com']`) — Next compares them against
      // `new URL(origin).host`, so entries with a protocol never match.
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
    // `localPatterns` is an OR list, so a catch-all entry subsumes every
    // narrower one. Local images live at the root of `public/`, so the
    // catch-all is required. `/api/image-proxy` is not restricted here
    // because it validates its own `url` param against the allowed S3
    // origins and bucket key (see `src/app/api/image-proxy/route.ts`).
    localPatterns: [{ pathname: '/**' }],
    qualities: [70, 75, 85, 100],
    maximumRedirects: 3,
    dangerouslyAllowLocalIP: false,
  },
};

export default withNextVideo(nextConfig);
