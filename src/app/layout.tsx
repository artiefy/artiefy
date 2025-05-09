// 1. React/Next.js core imports
import { Suspense } from 'react';
// 2. Global styles
import '~/styles/globals.css';
import { Merriweather, Montserrat } from 'next/font/google';

// 3. External libraries
import { esMX } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { type Metadata } from 'next';

// 4. Internal components
import { Toaster } from '~/components/estudiantes/ui/sonner';

import Loading from './loading';
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
		default: 'Artiefy - Plataforma Educativa Digital Líder',
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
		title: 'Artiefy - Plataforma Educativa Digital Líder',
		description: 'Artiefy es la plataforma de aprendizaje más innovadora.',
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
		icon: [
			{ url: '/favicon.ico', sizes: 'any' },
			{ url: '/artiefy-icon.png', type: 'image/png' },
		],
		shortcut: '/favicon.ico',
		apple: { url: '/artiefy-icon.png', sizes: '180x180' },
	},
	verification: {
		google: 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
	},
	other: {
		'google-site-verification': 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
		'google-sitelinks': JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			url: 'https://artiefy.com/',
			potentialAction: [
				{
					'@type': 'SearchAction',
					target: 'https://artiefy.com/search?q={search_term_string}',
					'query-input': 'required name=search_term_string',
				},
			],
			siteLinks: [
				{
					url: 'https://artiefy.com/estudiantes',
					name: 'Artiefy - Plataforma Educativa Digital Líder',
				},
				{
					url: 'https://artiefy.com/planes',
					name: 'Artiefy - Plataforma Educativa Digital Líder',
				},
			],
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
		<html
			lang="es"
			className={`${montserrat.variable} ${merriweather.variable}`}
		>
			<meta
				name="google-site-verification"
				content="QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4"
			/>
			<body className="bg-background text-primary font-sans">
				<ClerkProvider localization={esMX}>
					<Suspense fallback={<Loading />}>
						<Providers>{children}</Providers>
					</Suspense>
				</ClerkProvider>
				<SpeedInsights />
				<Analytics />
				<Toaster />
			</body>
		</html>
	);
}
