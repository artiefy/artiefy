import { Merriweather, Montserrat } from 'next/font/google';

import { esMX } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { NotificationSubscription } from '~/components/estudiantes/layout/subscriptions/NotificationSubscription';
import { Toaster } from '~/components/estudiantes/ui/sonner';
import { getMetadataForRoute } from '~/lib/metadata/config';
import {
  getWebPagesSchema,
  getWebsiteSchema,
} from '~/lib/metadata/structured-data';

import Providers from './providers';

import '~/styles/globals.css';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const metadata = await getMetadataForRoute();
  let canonical = 'https://artiefy.com';
  if (
    typeof metadata.alternates === 'object' &&
    metadata.alternates &&
    'canonical' in metadata.alternates
  ) {
    const alt = metadata.alternates.canonical;
    if (typeof alt === 'string') {
      canonical = alt;
    } else if (alt instanceof URL) {
      canonical = alt.toString();
    }
    // Si es otro tipo (AlternateLinkDescriptor), puedes agregar lógica si lo necesitas
  }

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
          <link rel="canonical" href={canonical} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd, null, 2).replace(/</g, '\\u003c'),
            }}
          />
        </head>
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
