import './src/env.js'; // Importa variables de entorno
import withPlaiceholder from '@plaiceholder/next'; // Importa la configuración de @plaiceholder/next

/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
	reactStrictMode: true, // Habilita el modo estricto de React para detectar problemas potenciales en la aplicación
	images: {
		dangerouslyAllowSVG: true, // Permite el uso de imágenes SVG
		contentDispositionType: 'attachment', // Configura el tipo de disposición del contenido para imágenes
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Configura la política de seguridad de contenido para imágenes
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Define los tamaños de dispositivo para imágenes responsivas
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Define los tamaños de imagen para imágenes responsivas
		minimumCacheTTL: 60, // Define el tiempo mínimo de vida en caché para imágenes en segundos
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 's3.us-east-2.amazonaws.com',
				port: '',
				pathname: '/artiefy-upload/**',
			},
			{
				protocol: 'https',
				hostname: 'placehold.co',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'img.clerk.com',
				port: '',
				pathname: '/**',
			},
		], // Define patrones remotos para permitir la carga de imágenes desde dominios específicos
	},
	experimental: {
		turbo: {
			rules: {
				'*.svg': {
					loaders: [
						{
							loader: '@svgr/webpack',
							options: {
								svgo: true,
								svgoConfig: {
									plugins: [
										{
											name: 'preset-default',
											params: {
												overrides: {
													removeViewBox: false,
													convertStyleToAttrs: true,
													cleanupAttrs: true,
													removeDoctype: true,
													removeXMLProcInst: true,
													removeComments: true,
													removeMetadata: true,
													removeTitle: true,
													removeDesc: true,
													removeEmptyAttrs: true,
													removeHiddenElems: true,
													removeEmptyText: true,
													removeEmptyContainers: true,
													minifyStyles: true,
													convertColors: true,
													convertPathData: true,
													convertTransform: true,
													removeUnknownsAndDefaults: true,
													removeNonInheritableGroupAttrs: true,
													removeUselessStrokeAndFill: true,
													removeUnusedNS: true,
													cleanupIds: true,
													cleanupNumericValues: true,
													moveElemsAttrsToGroup: true,
													moveGroupAttrsToElems: true,
													collapseGroups: true,
													removeRasterImages: true,
													mergePaths: true,
													convertShapeToPath: true,
													sortAttrs: true,
													removeDimensions: true,
												},
											},
										},
									],
								},
							},
						},
					],
					as: '*.js',
				},
			},
			resolveAlias: {
				underscore: 'lodash', // Alias para reemplazar 'underscore' con 'lodash'
				mocha: { browser: 'mocha/browser-entry.js' }, // Alias para reemplazar 'mocha' con la entrada del navegador de 'mocha'
			},
			resolveExtensions: [
				'.mdx',
				'.tsx',
				'.ts',
				'.jsx',
				'.js',
				'.mjs',
				'.json',
			], // Define las extensiones de archivo que se resolverán automáticamente
		},
		// Add memory optimization for webpack
		swcMinify: true,
		optimizeFonts: true,
		optimizeImages: true,
		workerThreads: true,
		memoryLimit: 4096, // 4GB limit for webpack
	},
	expireTime: 3600, // Define un tiempo de expiración personalizado para el encabezado Cache-Control (1 hora)
};
export default withPlaiceholder(nextConfig);
