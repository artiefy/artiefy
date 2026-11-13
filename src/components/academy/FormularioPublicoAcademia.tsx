'use client';

import { useState } from 'react';

import FormModal from '~/app/dashboard/formulario/FormModal';

// Formulario de inscripción de la academia: la misma página que
// artiefy.com/dashboard/formulario ("Organiza" con logos, título y botón
// "Iniciar formulario"), con los logos y colores de la academia. El
// formulario (FormModal) es el de Artiefy, apuntando a las rutas de la
// academia.

// El formulario de Artiefy con los colores de la academia: sus variables
// (--fm-*) y los tonos cian/gris que usa pasan a los de la marca. Va en :root
// (solo en esta página) porque el modal se monta fuera de este contenedor.
const COLORES_FORMULARIO = `:root{
  --fm-fondo:var(--ac-fondo);
  --fm-campo:var(--ac-superficie);
  --fm-campo2:var(--ac-superficie);
  --fm-sobre-primario:var(--ac-primario-texto);
  --color-cyan-300:var(--ac-primario);
  --color-cyan-400:var(--ac-primario);
  --color-cyan-500:var(--ac-primario);
  --color-cyan-900:var(--ac-borde);
  --color-gray-600:var(--ac-borde);
  --color-gray-800:var(--ac-superficie);
  --color-gray-900:var(--ac-superficie);
}`;

export function FormularioPublicoAcademia({
  slug,
  nombre,
  logos,
}: {
  slug: string;
  nombre: string;
  logos: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const base = `/api/academia/${slug}/formulario`;

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-[var(--ac-fondo)] to-[var(--ac-superficie)] px-6 py-12 text-white">
      <style>{COLORES_FORMULARIO}</style>
      <div className="mx-auto max-w-3xl rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-10 shadow-xl">
        {logos.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-center text-sm tracking-widest text-white/50 uppercase">
              Organiza
            </h2>
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-6 sm:gap-10">
              {logos.map((src) => (
                <div
                  key={src}
                  className="flex items-center justify-center rounded-lg p-3 sm:p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={nombre}
                    className="h-auto max-h-24 w-[160px] object-contain sm:w-[200px] md:w-[220px]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <h1 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-[var(--ac-primario)] sm:text-4xl">
          Formulario de Inscripción
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-center text-white/70">
          Completa tu inscripción con la información requerida. Haz clic en el
          botón para comenzar.
        </p>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="rounded bg-[var(--ac-primario)] px-6 py-3 text-lg font-semibold text-[var(--ac-primario-texto)] shadow-md transition hover:opacity-90 focus:ring-2 focus:ring-[var(--ac-primario)] focus:outline-none"
          >
            Iniciar formulario
          </button>
        </div>
      </div>

      <FormModal
        isOpen={abierto}
        onClose={() => setAbierto(false)}
        destino={{ nombre, url: '/' }}
        apis={{
          opciones: base,
          programas: `${base}/programas`,
          enviar: base,
        }}
      />
    </div>
  );
}
