'use client';

import { useEffect, useRef, useState } from 'react';

import { FaFolderOpen } from 'react-icons/fa';

import { Header } from '~/components/estudiantes/layout/Header';

import ProyectoGrandeCard from './components/ProyectoGrandeCard';
import ProyectoMiniCard from './components/ProyectoMiniCard';

export default function ProyectosDestacadosPage() {
  const [proyectos, setProyectos] = useState<number[]>(() =>
    Array.from({ length: 5 }, (_, i) => i)
  );
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const cargarMasProyectos = () => {
    setTimeout(() => {
      setProyectos((prev) => [
        ...prev,
        ...Array.from({ length: 3 }, (_, i) => prev.length + i),
      ]);
    }, 1000);
  };

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          cargarMasProyectos();
        }
      },
      { threshold: 1.0 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observerRef.current.observe(currentLoader);
    }

    return () => {
      if (observerRef.current && currentLoader) {
        observerRef.current.unobserve(currentLoader);
      }
    };
  }, [loaderRef]);

  return (
    <div className="min-h-screen bg-[#041C3C] text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#041C3C] shadow-md">
        <Header />
      </div>

      {/* Contenido */}
      <main className="flex w-full gap-6 px-6 pt-6 pb-10">
        {/* Izquierda - Sticky al top */}
        <aside className="sticky top-[80px] z-40 flex h-fit w-1/5 flex-col items-center gap-4">
          <h2 className="text-lg font-semibold text-cyan-300">
            Proyectos destacados
          </h2>
          {[1, 2, 3].map((i) => (
            <ProyectoMiniCard key={`mini-${i}`} />
          ))}
          <button
            className="mt-2 text-sm text-cyan-300 hover:underline focus:outline-none"
            aria-label="Ver más proyectos"
          >
            Ver más +
          </button>
        </aside>

        {/* Centro - crece verticalmente con el scroll de la página */}
        <section className="scrollbar-hide flex w-3/5 flex-col items-center gap-6">
          {proyectos.map((id) => (
            <ProyectoGrandeCard key={`proyecto-${id}`} />
          ))}
          <div ref={loaderRef} className="mt-4 text-center text-cyan-300">
            Cargando más proyectos...
          </div>
        </section>

        {/* Derecha - Sticky al top */}
        <aside className="font-semibold sticky top-[80px] flex h-fit w-1/5 flex-col items-center justify-start text-sm text-cyan-300 hover:scale-110">
          <FaFolderOpen size={40} />
          <span className="mt-2">
            <a href="/proyectos/MisProyectos">Mis Proyectos</a>
          </span>
        </aside>
      </main>
    </div>
  );
}
