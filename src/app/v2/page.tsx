import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import SmoothGradient from '~/components/estudiantes/layout/Gradient';
import { Header } from '~/components/estudiantes/layout/Header';
import { Educators } from '~/components/v2/Educators';
import { Features } from '~/components/v2/Features';
import { Hero } from '~/components/v2/Hero';
import NeuralBackground from '~/components/v2/NeuralBackground';
import { StickySearchBar } from '~/components/v2/StickySearchBar';
import { Testimonials } from '~/components/v2/Testimonials';

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
      <NeuralBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <StickySearchBar />

        <main className="flex grow flex-col">
          <Hero />

          {/* Calm the animated background behind reading content so sections
              stay legible while the neural net still glows through. */}
          <div className="relative bg-slate-950/60">
            <Features />
            <Testimonials />
            <Educators />
            {/* <Pricing /> */}
          </div>
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
