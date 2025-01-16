import type { NextConfig } from 'next';
import './src/env.js';

const coreConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/artiefy-upload/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
};

export default coreConfig;
