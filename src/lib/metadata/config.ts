import type { Metadata } from 'next';

const SITE_URL = 'https://artiefy.com';
const SITE_NAME = 'Artiefy';

const ogImages = [
  {
    url: `${SITE_URL}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: 'Artiefy, plataforma educativa online de ciencia y tecnología',
  },
];

// Root metadata inherited by every route.
//
// `canonical: './'` and `og:url: './'` are resolved by Next.js against each
// route's own pathname (see `resolveRelativeUrl` in
// next/dist/lib/metadata/resolvers/resolve-url.js), so every page gets a
// self-referencing canonical without query strings. A hardcoded canonical here
// pointed every page to the homepage and kept /planes and /estudiantes out of
// the index.
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: 'Artiefy | Cursos online de ciencia y tecnología',
  },
  description:
    'Aprende ciencia y tecnología a tu ritmo con cursos, programas y proyectos guiados online. Obtén certificados y mentoría en Artiefy, tu plataforma educativa.',
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: './',
    siteName: SITE_NAME,
    title: 'Artiefy | Cursos online de ciencia y tecnología',
    description:
      'Aprende ciencia y tecnología a tu ritmo con cursos, programas y proyectos guiados online.',
    images: ogImages,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@artiefy',
    creator: '@artiefy',
  },
  verification: {
    google: 'QmeSGzDRcYJKY61p9oFybVx-HXlsoT5ZK6z9x2L3Wp4',
    other: {
      'facebook-domain-verification': 'zxh6j216xifuou0gxlb1hp0zomyjx0',
    },
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
    },
  },
};

// Metadata for an indexable public route. Child `openGraph` replaces the
// parent's object instead of merging, so it is rebuilt here with the shared
// image and locale.
export function pageMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url: './',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ogImages,
    },
  };
}
