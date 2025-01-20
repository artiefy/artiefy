/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * @type {import('next').NextConfig}
 */

import './src/env.js';
import withPlaiceholder from '@plaiceholder/next';

const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: 's3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/artiefy-upload/**',
      },
      {
        protocol: "https",
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
      resolveAlias: {
        underscore: 'lodash',
        mocha: { browser: 'mocha/browser-entry.js' },
      },
      resolveExtensions: [
        '.mdx',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.mjs',
        '.json',
      ],
    },
  },
};

export default withPlaiceholder(nextConfig);
