'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import FormModal from './FormModal';

export default function FormInscriptionPage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('no-chrome', 'overflow-hidden');
    return () => {
      document.body.classList.remove('no-chrome', 'overflow-hidden');
    };
  }, []);

  return (
    <>
      {/* Oculta topbar y sidebar del layout */}
      <style jsx global>{`
        body.no-chrome nav.bg-background,
        body.no-chrome aside[aria-label='Sidebar'] {
          display: none !important;
        }
        /* Elimina offsets del layout si los hubiera */
        body.no-chrome .with-sidebar,
        body.no-chrome .content-with-sidebar,
        body.no-chrome .pt-20,
        body.no-chrome .pl-64 {
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>

      <div className="min-h-screen w-full bg-gradient-to-br from-[#01060f] to-[#0e1a2b] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-700 bg-gray-900 p-10 shadow-xl shadow-cyan-500/10">
          {/* Logos */}
          <div className="mb-8">
            <h2 className="mb-4 text-center text-sm tracking-widest text-gray-400 uppercase">
              Organiza
            </h2>
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-6 sm:gap-10">
              {/* Artiefy primero */}
              <div className="flex items-center justify-center rounded-lg p-3 sm:p-4">
                <Image
                  src="/artiefy-logo.png"
                  alt="Artiefy"
                  width={220}
                  height={64}
                  className="h-auto w-[160px] object-contain sm:w-[200px] md:w-[220px]"
                  priority
                />
              </div>

              {/* Ponao */}
              <div className="flex items-center justify-center rounded-lg p-3 sm:p-4">
                <Image
                  src="/logo-ponao.png"
                  alt="Ponao"
                  width={220}
                  height={64}
                  className="h-auto w-[150px] object-contain sm:w-[180px] md:w-[200px]"
                />
              </div>
            </div>
          </div>

          {/* Título / texto / CTA */}
          <h1 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-cyan-400 sm:text-4xl">
            Formulario de Inscripción
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-center text-gray-300">
            Completa tu inscripción con la información requerida. Haz clic en el
            botón para comenzar.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => setOpen(true)}
              className="rounded bg-cyan-500 px-6 py-3 text-lg font-semibold text-black shadow-md transition hover:bg-cyan-400 hover:shadow-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              Iniciar formulario
            </button>
          </div>
        </div>

        <FormModal isOpen={open} onClose={() => setOpen(false)} />
      </div>
    </>
  );
}
