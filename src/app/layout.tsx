import { Montserrat, Merriweather } from 'next/font/google';
import '~/styles/globals.css';
import Script from 'next/script';

import { esMX } from '@clerk/localizations';
import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import {
	type EducationalOrganization,
	type WebSite,
	type WithContext,
} from 'schema-dts';

import { Toaster } from '~/components/estudiantes/ui/sonner';
import { metadata as siteMetadata } from '~/lib/metadata';

import Loading from './loading';
import Providers from './providers';

import type { Metadata, Viewport } from 'next';

const montserrat = Montserrat({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-montserrat',
	weight: ['100', '200', '300', '400', '500', '600', '700'],
	preload: true, // Change to true because it's used in root layout
	adjustFontFallback: true, // Add this to optimize font loading
});

const merriweather = Merriweather({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-merriweather',
	weight: ['300', '400', '700', '900'],
	preload: true, // Change to true because it's used in root layout
	adjustFontFallback: true, // Add this to optimize font loading
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata: Metadata = siteMetadata;

const organizationJsonLd: WithContext<EducationalOrganization> = {
	'@context': 'https://schema.org',
	'@type': 'EducationalOrganization',
	'@id': 'https://artiefy.com/#organization',
	name: 'Artiefy',
	url: 'https://artiefy.com',
	logo: {
		'@type': 'ImageObject',
		url: 'https://artiefy.com/artiefy-icon.png',
	},
	description:
		'Plataforma educativa colombiana especializada en programas y cursos de tecnología y ciencias.',
	address: {
		'@type': 'PostalAddress',
		addressLocality: 'Cali',
		addressRegion: 'Valle Del Cauca',
		addressCountry: {
			'@type': 'Country',
			name: 'CO',
		},
	},
	email: 'contacto@artiefy.com',
	sameAs: [
		'https://facebook.com/artiefy',
		'https://twitter.com/artiefy',
		'https://instagram.com/artiefy',
	],
	hasOfferCatalog: {
		'@type': 'OfferCatalog',
		name: 'Planes Artiefy',
		itemListElement: [
			{
				'@type': 'Offer',
				name: 'Plan Pro',
				description: 'Acceso a cursos y programas seleccionados',
				price: '100000',
				priceCurrency: 'COP',
			},
			{
				'@type': 'Offer',
				name: 'Plan Premium',
				description: 'Acceso completo a todos los cursos y programas',
				price: '150000',
				priceCurrency: 'COP',
			},
			{
				'@type': 'Offer',
				name: 'Plan Enterprise',
				description: 'Solución completa para empresas',
				price: '200000',
				priceCurrency: 'COP',
			},
		],
	},
};

const websiteJsonLd: WithContext<WebSite> = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	'@id': 'https://artiefy.com/#website',
	url: 'https://artiefy.com',
	name: 'Artiefy - Plataforma Educativa',
	description:
		'Plataforma educativa colombiana especializada en programas y cursos de tecnología y ciencias.',
	publisher: {
		'@id': 'https://artiefy.com/#organization',
	},
	potentialAction: [
		{
			'@type': 'ViewAction',
			target: [
				{
					'@type': 'EntryPoint',
					urlTemplate: 'https://artiefy.com/planes',
				},
				{
					'@type': 'EntryPoint',
					urlTemplate: 'https://artiefy.com/estudiantes',
				},
			],
		},
	],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider localization={esMX} dynamic>
			<html
				lang="es"
				className={`${montserrat.variable} ${merriweather.variable}`}
			>
				<head>
					<meta name="robots" content="index, follow" />
					<link rel="canonical" href="https://artiefy.com" />
					<Script
						id="organization-jsonld"
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(organizationJsonLd),
						}}
						strategy="afterInteractive"
					/>
					<Script
						id="website-jsonld"
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(websiteJsonLd),
						}}
						strategy="afterInteractive"
					/>
				</head>
				<body className="bg-background font-sans text-primary">
					<ClerkLoading>
						<Loading />
					</ClerkLoading>
					<ClerkLoaded>
						<Providers>{children}</Providers>
					</ClerkLoaded>
					<SpeedInsights />
					<Analytics />
					<Toaster />
				</body>
			</html>
		</ClerkProvider>
	);
}
