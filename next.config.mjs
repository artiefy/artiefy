import { withNextVideo } from 'next-video/process';

import withPlaiceholder from '@plaiceholder/next';
import { createJiti } from 'jiti';
import { fileURLToPath } from 'node:url';

const jiti = createJiti(fileURLToPath(import.meta.url));

// Validar variables de entorno
jiti('./src/env.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  cacheComponents: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384], // 16 removed by default in v16
    minimumCacheTTL: 14400, // 4 hours default in v16
    remotePatterns: [
      new URL('https://s3.us-east-2.amazonaws.com/artiefy-upload/**'),
      new URL('https://placehold.co/**'),
      new URL('https://img.clerk.com/**'),
      new URL('https://assets.example.com/**'),
    ],
    localPatterns: [
      {
        pathname: '/api/image-proxy',
        search: '?url=*',
      },
      {
        pathname: '/**',
      },
    ],
    qualities: [100, 75], // Default in v16
    maximumRedirects: 3, // Explicit default in v16 for security
    dangerouslyAllowLocalIP: false, // Default security restriction in v16
  },
  expireTime: 3600,
  // Turbopack is now default; no --turbopack needed in scripts
  // Add turbopack config here if custom options needed (e.g., resolveAlias)
  // turbopack: {},
};

export default withNextVideo(withPlaiceholder(nextConfig));
