import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import SmoothGradient from '~/components/estudiantes/layout/Gradient';
import { Header } from '~/components/estudiantes/layout/Header';
import HeroCanvas from '~/components/estudiantes/layout/HeroCanvas';
import { Features } from '~/components/v2/Features';
import { Hero } from '~/components/v2/Hero';

export const metadata: Metadata = {
  title: 'Artiefy - Transformamos ideas en realidades',
  description:
    'Descubre nuestros cursos y potencia tus conocimientos con ciencia y tecnología.',
};

export default function V2LandingPage() {
  if (process.env.NEXT_PUBLIC_SHOW_V2_LANDING !== 'true') {
    notFound();
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-slate-50">
      <SmoothGradient />
      <HeroCanvas />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex grow flex-col">
          <Hero />
          <Features />
          {/* <Testimonials /> */}
          {/* <Pricing /> */}
        </main>

        {/* Footer Placeholder */}
        <footer className="border-t border-white/10 bg-black/50 py-8 text-center text-sm text-slate-400 backdrop-blur-md">
          &copy; {new Date().getFullYear()} Artiefy. Todos los derechos
          reservados.
        </footer>
      </div>
    </div>
  );
}
