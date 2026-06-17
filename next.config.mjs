import { withNextVideo } from 'next-video/process';

import withPlaiceholder from '@plaiceholder/next';
import { createJiti } from 'jiti';
import { fileURLToPath } from 'node:url';

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./src/env.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  reactCompiler: false,
  cacheComponents: false,
  expireTime: 3600,
  experimental: {
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

export default withNextVideo(withPlaiceholder(nextConfig));
