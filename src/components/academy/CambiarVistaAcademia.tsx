'use client';

import { useState } from 'react';

import { FiChevronDown, FiRepeat } from 'react-icons/fi';
import useSWR from 'swr';

import { urlAcademia } from '~/lib/academy/host';
import { cn } from '~/lib/utils';

interface Vista {
  slug: string;
  nombre: string;
  role: 'super-admin' | 'educador' | 'estudiante';
}

const ETIQUETA_ROL: Record<Vista['role'], string> = {
  'super-admin': 'Admin',
  educador: 'Profe',
  estudiante: 'Estudiante',
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('No se pudieron cargar las vistas');
    return r.json() as Promise<{ vistas: Vista[] }>;
  });

/**
 * Selector de vista: pasa de Artiefy a tu vista en cada academia en la que
 * tienes acceso (p. ej. profe de Condor o de Niupi). No se muestra si tu
 * cuenta no pertenece a ninguna academia.
 */
export function CambiarVistaAcademia({ className }: { className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const { data } = useSWR('/api/academias/mis-vistas', fetcher, {
    revalidateOnFocus: false,
  });
  const vistas = data?.vistas ?? [];
  if (vistas.length === 0) return null;

  const ir = (slug: string) => {
    window.location.assign(
      urlAcademia(slug, '/dashboard', window.location.origin)
    );
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        title="Cambiar de vista"
        className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-[#01152d]/55 px-3 text-sm font-semibold text-white backdrop-blur-2xl hover:bg-white/10"
      >
        <FiRepeat className="size-4 text-primary" />
        <span className="hidden sm:inline">Vista</span>
        <FiChevronDown className="size-3.5 opacity-60" />
      </button>
      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setAbierto(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#061c37] py-1 shadow-2xl"
          >
            <div
              role="menuitem"
              aria-current="true"
              className="flex items-center justify-between px-3 py-2 text-sm text-primary"
            >
              <span className="font-semibold">Artiefy</span>
              <span className="text-xs text-white/50">Vista actual</span>
            </div>
            {vistas.map((v) => (
              <button
                key={v.slug}
                type="button"
                role="menuitem"
                onClick={() => ir(v.slug)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/5"
              >
                <span className="truncate">{v.nombre}</span>
                <span className="ml-2 shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                  {ETIQUETA_ROL[v.role]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
