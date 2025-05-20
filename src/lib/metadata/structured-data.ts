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
	potentialAction: [
		{
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
			},
			'query-input': 'required name=search_term_string',
		},
	],
	sameAs: [
		'https://twitter.com/artiefy',
		// Add other social media URLs
	],
});

export const getSiteLinksSearchBoxSchema = () => ({
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	url: BASE_URL,
	potentialAction: {
		'@type': 'SearchAction',
		target: `${BASE_URL}/search?q={search_term_string}`,
		'query-input': 'required name=search_term_string',
	},
});

export const getBreadcrumbSchema = (
	items: { name: string; item: string }[]
) => ({
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.name,
		item: `${BASE_URL}${item.item}`,
	})),
});
