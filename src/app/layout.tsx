import { Montserrat, Merriweather } from 'next/font/google';
import '~/styles/globals.css';
import Script from 'next/script';

import { esMX } from '@clerk/localizations';
import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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

const organizationJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	'@id': 'https://artiefy.com/#organization',
	name: 'Artiefy',
	url: 'https://artiefy.com',
	logo: {
		'@type': 'ImageObject',
		url: 'https://artiefy.com/artiefy-icon.png',
		width: '512',
		height: '512',
	},
	sameAs: [
		'https://facebook.com/artiefy',
		'https://twitter.com/artiefy',
		'https://instagram.com/artiefy',
	],
};

const educationalOrgJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'EducationalOrganization',
	'@id': 'https://artiefy.com/#educational',
	name: 'Artiefy Learning Platform',
	parentOrganization: {
		'@id': 'https://artiefy.com/#organization',
	},
	description:
		'Plataforma de aprendizaje innovadora para estudiantes y profesores, especializada en ciencia y tecnología.',
	offers: {
		'@type': 'Offer',
		'@id': 'https://artiefy.com/#membership',
		name: 'Membresía Artiefy',
		category: 'Subscription',
		availability: 'https://schema.org/InStock',
		priceCurrency: 'COP',
		aggregateOffer: {
			'@type': 'AggregateOffer',
			priceCurrency: 'COP',
			offerCount: '3',
			highPrice: '99900',
			lowPrice: '29900',
		},
	},
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
						id="educational-jsonld"
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(educationalOrgJsonLd),
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
