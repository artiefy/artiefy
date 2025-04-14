import Script from 'next/script';

import { HomeContent } from '~/components/estudiantes/layout/HomeContent';

import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase: new URL('https://artiefy.com'),
	title: 'Artiefy - Transforma tus ideas en realidad',
	description: 'La plataforma educativa líder en ciencia y tecnología...',
	openGraph: {
		type: 'website',
		url: 'https://artiefy.com',
		title: 'Artiefy - Plataforma Educativa Digital',
		description: 'Aprende y desarrolla tus habilidades tecnológicas...',
	},
};

export default function HomePage() {
	return (
		<>
			<Script id="organization-schema" type="application/ld+json">
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'Organization',
					'@id': 'https://artiefy.com/#organization',
					name: 'Artiefy',
					url: 'https://artiefy.com',
					logo: 'https://artiefy.com/artiefy-icon.png',
				})}
			</Script>

			<Script id="website-schema" type="application/ld+json">
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					'@id': 'https://artiefy.com/#website',
					name: 'Artiefy - Plataforma Educativa',
					url: 'https://artiefy.com',
				})}
			</Script>

			<HomeContent />
		</>
	);
}
