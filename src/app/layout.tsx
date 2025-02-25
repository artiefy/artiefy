import { esMX } from '@clerk/localizations';
import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from '~/components/estudiantes/ui/toaster';
import { metadata as siteMetadata } from '~/lib/metadata';
import '~/styles/globals.css';
import Loading from './loading';

const montserrat = Montserrat({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-montserrat',
	preload: true,
	weight: ['400', '500', '600', '700'],
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata: Metadata = siteMetadata;

const jsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	url: 'https://artiefy.com/',
	name: 'Artiefy',
	description:
		'Artiefy es la plataforma de aprendizaje más innovadora para estudiantes y profesores.',
	logo: {
		'@type': 'ImageObject',
		url: 'https://artiefy.com/artiefy-icon.png',
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider localization={esMX} dynamic>
			<html lang="es" className={`${montserrat.variable}`}>
				<head>
					<Script
						id="json-ld"
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(jsonLd),
						}}
						strategy="afterInteractive"
					/>
				</head>
				<body className="bg-background font-sans text-primary">
					<NextTopLoader
						color="#2563eb"
						height={3}
						showSpinner={false}
						shadow="0 0 10px #2563eb,0 0 5px #2563eb"
					/>
					<ClerkLoading>
						<Loading />
					</ClerkLoading>
					<ClerkLoaded>
						{children}
						<SpeedInsights />
						<Analytics />
						<Toaster />
					</ClerkLoaded>
				</body>
			</html>
		</ClerkProvider>
	);
}
