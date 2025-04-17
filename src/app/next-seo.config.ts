export const seoConfig = {
	titleTemplate: '%s | Artiefy',
	defaultTitle: 'Artiefy - Plataforma Educativa Digital',
	description:
		'Artiefy es la plataforma líder en educación digital. Aprende desarrollo web, programación y más con expertos de la industria.',
	openGraph: {
		type: 'website',
		locale: 'es_ES',
		url: 'https://artiefy.com',
		siteName: 'Artiefy',
		images: [
			{
				url: 'https://artiefy.com/opengraph-image',
				width: 1200,
				height: 630,
				alt: 'Artiefy - App Web Educativa de Cursos Online',
			},
		],
	},
	twitter: {
		handle: '@artiefy',
		site: '@artiefy',
		cardType: 'summary_large_image',
	},
	additionalMetaTags: [
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1',
		},
		{
			name: 'google-site-verification',
			content: 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
		},
	],
};
