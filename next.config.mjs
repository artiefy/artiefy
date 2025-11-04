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
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 14400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-east-2.amazonaws.com',
        pathname: '/artiefy-upload/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.example.com',
        pathname: '/**',
      },
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
  },
  expireTime: 3600,
};

export default withNextVideo(withPlaiceholder(nextConfig));
