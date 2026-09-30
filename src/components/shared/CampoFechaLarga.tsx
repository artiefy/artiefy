'use client';

import { X } from 'lucide-react';

import { formatFechaLarga } from '~/lib/formatDate';

/**
 * Campo de fecha que muestra "junio 20, 2026" en vez de dd/mm/aaaa.
 *
 * El input type="date" nativo siempre usa el formato del navegador, así que
 * va invisible encima del texto y solo se usa para abrir el calendario.
 * El valor sigue siendo "YYYY-MM-DD".
 */
export function CampoFechaLarga({
  valor,
  placeholder,
  onCambio,
  className = `
    rounded bg-gray-700 p-1 text-xs
    sm:text-sm
  `,
}: {
  valor: string;
  placeholder: string;
  onCambio: (valor: string) => void;
  className?: string;
}) {
  return (
    <div className={`relative flex w-full items-center ${className}`}>
      <span
        className={`min-w-0 flex-1 truncate ${valor ? 'text-white' : 'text-gray-400'}`}
      >
        {valor ? formatFechaLarga(valor) : placeholder}
      </span>
      <input
        type="date"
        value={valor}
        aria-label={placeholder}
        onChange={(e) => onCambio(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker();
          } catch {
            // Navegadores sin showPicker: el input abre al enfocarlo.
          }
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambio('')}
          className="relative z-10 ml-1 shrink-0 text-gray-400 hover:text-white"
          aria-label="Quitar fecha"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
