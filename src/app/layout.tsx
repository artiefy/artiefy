import { Merriweather, Montserrat } from 'next/font/google';

import '~/styles/globals.css';
import { esMX } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { NotificationSubscription } from '~/components/estudiantes/layout/subscriptions/NotificationSubscription';
import { Toaster } from '~/components/estudiantes/ui/sonner';
import { getMetadataForRoute } from '~/lib/metadata/config';
import {
	getWebsiteSchema,
	getWebPagesSchema,
} from '~/lib/metadata/structured-data';

import Providers from './providers';
import TourManager from '~/components/tour/tourManager';


const montserrat = Montserrat({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-montserrat',
	weight: ['100', '200', '300', '400', '500', '600', '700'],
	preload: false,
	adjustFontFallback: true,
});

const merriweather = Merriweather({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-merriweather',
	weight: ['300', '400', '700', '900'],
	preload: false,
	adjustFontFallback: true,
});

export async function generateMetadata() {
	return await getMetadataForRoute();
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [getWebsiteSchema(), getWebPagesSchema()],
	};

	return (
		<ClerkProvider localization={esMX}>
			<html
				lang="es"
				className={`${montserrat.variable} ${merriweather.variable}`}
			>
				<head>
					<meta
						name="google-site-verification"
						content="QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4"
					/>
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(jsonLd, null, 2),
						}}
					/>
				</head>
				<body className="bg-background text-primary font-sans">
					<Providers>
						<TourManager />
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
