import Script from 'next/script';

import { HomeContent } from '~/components/estudiantes/layout/HomeContent';

import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase: new URL('https://artiefy.com'),
	title: 'Artiefy - Plataforma Educativa Digital Líder',
	description:
		'Únete a nosotros y transforma tus ideas en realidades con el poder del conocimiento. Bienvenido a Artiefy.',
	openGraph: {
		type: 'website',
		url: 'https://artiefy.com',
		title: 'Artiefy - Plataforma Educativa Digital',
		description: 'Aprende y desarrolla tus habilidades tecnológicas...',
	},
	alternates: {
		canonical: 'https://artiefy.com',
	},
};

export default function HomePage() {
	return (
		<>
			<Script id="organization-schema" type="application/ld+json">
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					name: 'Artiefy',
					url: 'https://artiefy.com',
					sameAs: [
						'https://artiefy.com/planes',
						'https://artiefy.com/estudiantes',
					],
					potentialAction: {
						'@type': 'SearchAction',
						target: 'https://artiefy.com/search?q={search_term_string}',
						'query-input': 'required name=search_term_string',
					},
					mainEntity: {
						'@type': 'Organization',
						name: 'Artiefy',
						url: 'https://artiefy.com',
						logo: 'https://artiefy.com/artiefy-icon.png',
						siteNavigationElement: [
							{
								'@type': 'SiteNavigationElement',
								name: 'Inicio',
								url: 'https://artiefy.com',
							},
							{
								'@type': 'SiteNavigationElement',
								name: 'Planes',
								url: 'https://artiefy.com/planes',
							},
							{
								'@type': 'SiteNavigationElement',
								name: 'Panel de Estudiantes',
								url: 'https://artiefy.com/estudiantes',
							},
						],
					},
				})}
			</Script>

			<Script id="site-structure" type="application/ld+json">
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'Organization',
					'@id': 'https://artiefy.com/#organization',
					name: 'Artiefy',
					url: 'https://artiefy.com',
					logo: 'https://artiefy.com/artiefy-icon.png',
					sameAs: [
						'https://artiefy.com/planes',
						'https://artiefy.com/estudiantes',
					],
					subOrganization: [
						{
							'@type': 'EducationalOrganization',
							name: 'Artiefy Planes',
							url: 'https://artiefy.com/planes',
							description: 'Planes y suscripciones de Artiefy',
						},
						{
							'@type': 'EducationalOrganization',
							name: 'Artiefy Estudiantes',
							url: 'https://artiefy.com/estudiantes',
							description: 'Portal de estudiantes de Artiefy',
						},
					],
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