export const getWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://artiefy.com/#website',
  url: 'https://artiefy.com',
  name: 'artiefy',
  alternateName: ['Artiefy Educación', 'Artiefy Learning Platform'],
  description: 'Cursos online de calidad en diferentes áreas del conocimiento',
  publisher: {
    '@type': 'Organization',
    name: 'Artiefy',
    logo: {
      '@type': 'ImageObject',
      url: 'https://artiefy.com/artiefy-icon.png',
    },
    sameAs: [
      'https://facebook.com/artiefy',
      'https://twitter.com/artiefy',
      'https://instagram.com/artiefy',
    ],
  },
  mainEntity: {
    '@type': 'EducationalOrganization',
    name: 'Artiefy',
    description:
      'Cursos online de calidad en diferentes áreas del conocimiento',
    email: 'artiefy4@gmail.com',
  },
});

export const getWebPagesSchema = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://artiefy.com/#homepage',
    url: 'https://artiefy.com',
    name: 'Inicio',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://artiefy.com/estudiantes/#page',
    url: 'https://artiefy.com/estudiantes',
    name: 'Cursos',
    hasPart: [
      {
        '@type': 'WebPage',
        '@id': 'https://artiefy.com/planes/#page',
        url: 'https://artiefy.com/planes',
        name: 'Planes',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://artiefy.com/planes/#page',
    url: 'https://artiefy.com/planes',
    name: 'Planes',
  },
];
