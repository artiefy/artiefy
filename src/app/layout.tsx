import '~/styles/globals.css';

import { Merriweather, Montserrat } from 'next/font/google';

import { esMX } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { type Metadata } from 'next';

import { Toaster } from '~/components/estudiantes/ui/sonner';
import { NotificationSubscription } from '~/components/estudiantes/layout/subscriptions/NotificationSubscription';

import Providers from './providers';

const montserrat = Montserrat({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-montserrat',
	weight: ['100', '200', '300', '400', '500', '600', '700'],
	preload: true,
	adjustFontFallback: true,
});

const merriweather = Merriweather({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-merriweather',
	weight: ['300', '400', '700', '900'],
	preload: true,
	adjustFontFallback: true,
});

export const metadata: Metadata = {
	metadataBase: new URL('https://artiefy.com'),
	title: {
		template: '%s | Artiefy',
		default: 'Artiefy - Plataforma Educativa Digital',
	},
	description:
		'Aprende desarrollo web, programación y más con expertos de la industria en Artiefy, la plataforma líder en educación digital.',
	keywords: ['cursos', 'aprendizaje', 'educación', 'profesores', 'estudiantes'],
	applicationName: 'Artiefy',
	authors: [{ name: 'Equipo Artiefy', url: 'https://artiefy.com' }],
	creator: 'Equipo Artiefy',
	category: 'Educacion',
	openGraph: {
		type: 'website',
		locale: 'es_ES',
		url: 'https://artiefy.com',
		title: 'Artiefy - Aprende y Crea',
		description: 'Artiefy es la plataforma de aprendizaje más innovadora.',
		siteName: 'Artiefy - Plataforma de Educación Online',
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
		card: 'summary_large_image',
		site: '@artiefy',
		creator: '@artiefy',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
			noimageindex: true,
		},
	},
	icons: {
		icon: '/favicon.ico',
		apple: '/artiefy-icon.png',
	},
	verification: {
		google: 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
	},
	other: {
		'google-site-verification': 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
		'google-sitelinks-searchbox': JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			url: 'https://artiefy.com/',
			potentialAction: {
				'@type': 'SearchAction',
				target: 'https://artiefy.com/search?q={search_term_string}',
				'query-input': 'required name=search_term_string',
			},
		}),
	},
	alternates: {
		canonical: 'https://artiefy.com',
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider localization={esMX}>
			<html
				lang="es"
				className={`${montserrat.variable} ${merriweather.variable}`}
			>
				<meta
					name="google-site-verification"
					content="QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4"
				/>
				<body className="bg-background text-primary font-sans">
					<Providers>
						{children}
						<NotificationSubscription />
					</Providers>
					<SpeedInsights />
					<Analytics />
					<Toaster />
				</body>
			</html>
		</ClerkProvider>
	);
}
