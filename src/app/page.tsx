import type { Metadata } from 'next';

import { HomeContent } from '~/components/estudiantes/layout/HomeContent';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://artiefy.com'),
  title: 'Artiefy - Transforma tus ideas en realidad',
  description: 'Plataforma educativa líder en ciencia y tecnología. Aprende y desarrolla tus habilidades con los mejores expertos.',
  keywords: ['educación', 'cursos online', 'tecnología', 'ciencia', 'aprendizaje'],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://artiefy.com',
    siteName: 'Artiefy',
    title: 'Artiefy - Plataforma Educativa Digital',
    description: 'Transformando ideas en realidades con el poder del conocimiento',
  },
};

export default function HomePage() {
  return <HomeContent />;
}
