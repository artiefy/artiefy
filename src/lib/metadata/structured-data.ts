const BASE_URL = 'https://artiefy.com';

export const getWebsiteSchema = () => ({
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	'@id': `${BASE_URL}/#website`,
	url: BASE_URL,
	name: 'Artiefy',
	description: 'Plataforma Educativa Digital Líder',
	publisher: {
		'@type': 'Organization',
		name: 'Artiefy',
		logo: {
			'@type': 'ImageObject',
			url: `${BASE_URL}/artiefy-icon.png`,
		},
	},
	potentialAction: {
		'@type': 'SearchAction',
		target: `${BASE_URL}/search?q={search_term_string}`,
		'query-input': 'required name=search_term_string',
	},
});

export const getSiteLinksSearchBoxSchema = () => ({
	'@type': 'WebSite',
	url: BASE_URL,
	potentialAction: {
		'@type': 'SearchAction',
		target: `${BASE_URL}/search?q={search_term_string}`,
		'query-input': 'required name=search_term_string',
	},
	mainEntity: [
		{
			'@type': 'WebPage',
			'@id': `${BASE_URL}/#homepage`,
			url: BASE_URL,
			name: 'Inicio',
		},
		{
			'@type': 'WebPage',
			'@id': `${BASE_URL}/estudiantes/#page`,
			url: `${BASE_URL}/estudiantes`,
			name: 'Cursos y Programas',
		},
		{
			'@type': 'WebPage',
			'@id': `${BASE_URL}/planes/#page`,
			url: `${BASE_URL}/planes`,
			name: 'Planes de Suscripción',
		},
	],
});
