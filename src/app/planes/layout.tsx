import { pageMetadata } from '~/lib/metadata/config';

import type { Metadata } from 'next';

// The page is a Client Component, so its metadata lives in this layout.
export const metadata: Metadata = pageMetadata({
  title: 'Planes y precios',
  description:
    'Compara los planes de Artiefy y elige el tuyo: acceso a cursos, programas y proyectos guiados, certificados y mentoría. Paga en pesos colombianos.',
});

export default function PlanesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
