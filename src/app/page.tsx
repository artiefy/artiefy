import { HomeContent } from '~/components/estudiantes/layout/HomeContent';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artiefy - Transforma tus ideas en realidad',
  description: 'La plataforma educativa líder en ciencia y tecnología. Aprende desarrollo web, programación y más con expertos de la industria.',
  alternates: {
    canonical: 'https://artiefy.com',
  },
  openGraph: {
    title: 'Artiefy - Plataforma Educativa Digital',
    description: 'Aprende y desarrolla tus habilidades tecnológicas con los mejores expertos',
  },
};

export default function HomePage() {
  return <HomeContent />;
}
