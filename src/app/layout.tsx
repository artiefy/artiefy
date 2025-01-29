import { esMX } from '@clerk/localizations';
import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import Provider from '~/components/estudiantes/layout/ProgressBarProvider';
import { Toaster } from '~/components/estudiantes/ui/toaster';
import { metadata as siteMetadata } from '~/lib/metadata';
import Loading from './loading';
import '~/styles/globals.css';

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
		<ClerkProvider localization={esMX}>
			<html lang="es" className={`${montserrat.variable}`}>
				<head>
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(jsonLd),
						}}
					/>
				</head>
				<body className="bg-background font-sans text-primary">
					<ClerkLoading>
						<Loading />
					</ClerkLoading>
					<ClerkLoaded>
						<Provider>{children}</Provider>
						<Toaster />
					</ClerkLoaded>
				</body>
			</html>
		</ClerkProvider>
	);
}
