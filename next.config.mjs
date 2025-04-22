import './src/env.js';
import withPlaiceholder from '@plaiceholder/next';
import { withNextVideo } from 'next-video/process';

// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
	reactStrictMode: true,
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 60,
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
				port: '',
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
	},
	turbopack: {
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
			'.mp4',
		],
		rules: {
			'*.svg': {
				loaders: ['@svgr/webpack'],
				as: '*.js',
			},
			'**/*.mp4': {
				loaders: ['next-video/webpack/video-loader'],
				type: 'asset',
			},
		},
	},
	expireTime: 3600,
};

export default withNextVideo(withPlaiceholder(nextConfig));
