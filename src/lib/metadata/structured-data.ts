const BASE_URL = 'https://artiefy.com';

export const getWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  url: BASE_URL,
  name: 'artiefy',
  alternateName: ['Artiefy Educación', 'Artiefy Learning Platform'],
  description: 'Plataforma Educativa Digital Líder en Latinoamérica',
  publisher: {
    '@type': 'Organization',
    name: 'Artiefy',
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/artiefy-icon.png`,
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
      'Plataforma de educación online líder en cursos y programas digitales',
    email: 'artiefy4@gmail.com',
  },
});

export const getWebPagesSchema = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${BASE_URL}/#homepage`,
    url: BASE_URL,
    name: 'Inicio',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${BASE_URL}/estudiantes/#page`,
    url: `${BASE_URL}/estudiantes`,
    name: 'Cursos y Programas',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${BASE_URL}/planes/#page`,
    url: `${BASE_URL}/planes`,
    name: 'Planes de Suscripción',
  },
];
