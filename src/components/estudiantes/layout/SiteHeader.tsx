'use client';

import { usePathname } from 'next/navigation';

import { Header } from '~/components/estudiantes/layout/Header';

// Route prefixes that must not render the site header. Mounted once from the
// root layout, the header survives navigation between every other route
// instead of being remounted by each page.
const HEADERLESS_ROUTE_PREFIXES = [
  '/dashboard',
  '/sign-in',
  '/sign-up',
  '/user-profile',
  '/agradecimiento-curso',
  '/agradecimiento-plan',
  '/gracias',
  '/consult',
  '/test-loading',
  // Social projects view: it ships its own layout with side rails.
  // Matched per segment so /estudiantes/proyectos-guiados still gets a header.
  '/estudiantes/proyectos',
];

const toSegments = (path: string) => path.split('/').filter(Boolean);

/**
 * Compares whole path segments so a prefix never matches a longer sibling
 * segment: '/estudiantes/proyectos' must not match '/estudiantes/proyectos-guiados'.
 */
const matchesPrefix = (pathname: string, prefix: string) => {
  const pathSegments = toSegments(pathname);
  const prefixSegments = toSegments(prefix);

  if (prefixSegments.length > pathSegments.length) return false;

  return prefixSegments.every(
    (segment, index) => segment === pathSegments[index]
  );
};

export function SiteHeader() {
  const pathname = usePathname() ?? '/';

  const isHeaderless = HEADERLESS_ROUTE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix)
  );

  if (isHeaderless) return null;

  return <Header />;
}
