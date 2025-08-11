export const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://artiefy.com/#website",
  url: "https://artiefy.com",
  name: "Artiefy",
  alternateName: ["Artiefy Educación", "Artiefy Learning Platform"],
  description:
    "Plataforma de cursos online de calidad en diferentes áreas del conocimiento",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://artiefy.com/estudiantes?query={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    "@id": "https://artiefy.com/#organization",
    name: "Artiefy",
    logo: {
      "@type": "ImageObject",
      url: "https://artiefy.com/artiefy-icon.png",
      width: "192",
      height: "192",
    },
    sameAs: [
      "https://facebook.com/artiefy",
      "https://twitter.com/artiefy",
      "https://instagram.com/artiefy",
    ],
  },
  mainEntity: {
    "@type": "EducationalOrganization",
    "@id": "https://artiefy.com/#educationalorganization",
    name: "Artiefy",
    description:
      "Cursos online de calidad en diferentes áreas del conocimiento",
    email: "artiefy4@gmail.com",
  },
});

export const getWebPagesSchema = () => [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://artiefy.com/#homepage",
    url: "https://artiefy.com",
    name: "Inicio",
    description:
      "Cursos online de calidad en diferentes áreas del conocimiento",
    isPartOf: { "@id": "https://artiefy.com/#website" },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://artiefy.com/estudiantes/#page",
    url: "https://artiefy.com/estudiantes",
    name: "Cursos",
    description:
      "Explora nuestra biblioteca de cursos y programas diseñados para potenciar tu desarrollo profesional",
    isPartOf: { "@id": "https://artiefy.com/#website" },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://artiefy.com/planes/#page",
    url: "https://artiefy.com/planes",
    name: "Planes Artiefy",
    description:
      "Encuentra el plan perfecto para tu formación. Acceso ilimitado a contenido educativo de calidad.",
    isPartOf: { "@id": "https://artiefy.com/#website" },
  },
];

export const getSiteNavigationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  "@id": "https://artiefy.com/#sitenavigation",
  name: "Navegación principal",
  description: "Navegación principal del sitio Artiefy",
  isPartOf: {
    "@id": "https://artiefy.com/#website",
  },
  hasPart: [
    {
      "@type": "SiteNavigationElement",
      name: "Inicio",
      url: "https://artiefy.com",
      position: 1,
      description: "Página principal de Artiefy",
    },
    {
      "@type": "SiteNavigationElement",
      name: "Cursos",
      url: "https://artiefy.com/estudiantes",
      position: 2,
      description: "Explora nuestra biblioteca de cursos y programas",
    },
    {
      "@type": "SiteNavigationElement",
      name: "Planes Artiefy",
      url: "https://artiefy.com/planes",
      position: 3,
      description: "Encuentra el plan perfecto para tu formación",
    },
  ],
});

export const getBreadcrumbSchema = () => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://artiefy.com/#breadcrumb",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: "https://artiefy.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Cursos",
      item: "https://artiefy.com/estudiantes",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Planes Artiefy",
      item: "https://artiefy.com/planes",
    },
  ],
});

export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://artiefy.com/#organization",
  name: "Artiefy",
  url: "https://artiefy.com",
  logo: {
    "@type": "ImageObject",
    url: "https://artiefy.com/artiefy-icon.png",
    width: "192",
    height: "192",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "artiefy4@gmail.com",
    contactType: "customer service",
  },
  sameAs: [
    "https://facebook.com/artiefy",
    "https://twitter.com/artiefy",
    "https://instagram.com/artiefy",
  ],
});
