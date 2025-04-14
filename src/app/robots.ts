import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: ['/loading', '/loading/', '/_next/', '/api/', '/dashboard/'],
			},
		],
		sitemap: 'https://artiefy.com/sitemap.xml',
	};
}
