'use client';

import { useEffect, useState } from 'react';

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

      {/* SIN overlay de z-[9999] */}
      <div className="min-h-screen w-full bg-gradient-to-br from-[#01060f] to-[#0e1a2b] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-700 bg-gray-900 p-10 shadow-xl shadow-cyan-500/10">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-cyan-400">
            Formulario de Inscripción
          </h1>
          <p className="mb-8 text-gray-300">
            Completa tu inscripción con la información requerida. Haz clic en el
            botón para comenzar.
          </p>

          <button
            onClick={() => setOpen(true)}
            className="rounded bg-cyan-500 px-6 py-3 text-lg font-semibold text-black shadow-md transition hover:bg-cyan-400 hover:shadow-cyan-300"
          >
            Iniciar formulario
          </button>
        </div>

        <FormModal isOpen={open} onClose={() => setOpen(false)} />
      </div>
    </>
  );
}
