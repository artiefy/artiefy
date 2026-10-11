// Site-wide JSON-LD rendered once in the root layout.
//
// Only entities that are true on every page belong here. Page-specific types
// (BreadcrumbList, WebPage, Course) must be emitted by their own route; a
// site-wide breadcrumb claimed every page was "Inicio > Cursos > Planes".
// `sameAs` is omitted until the official social profile URLs are confirmed.
const SITE_URL = 'https://artiefy.com';

export const getSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Artiefy',
      url: SITE_URL,
      description:
        'Plataforma educativa online con cursos, programas y proyectos guiados de ciencia y tecnología.',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/artiefy-icon.png`,
      },
      email: 'artiefy4@gmail.com',
      areaServed: { '@type': 'Country', name: 'Colombia' },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'artiefy4@gmail.com',
        contactType: 'customer service',
        availableLanguage: 'es',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Artiefy',
      inLanguage: 'es-CO',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
});
