'use client';

import { useEffect } from 'react';

import { AlertTriangle } from 'lucide-react';

interface Props {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  /** Texto del botón que confirma. Por defecto, "Eliminar". */
  textoConfirmar?: string;
  /** true mientras corre la acción, para bloquear doble clic. */
  ocupado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Confirmación para acciones destructivas.
 *
 * Sustituye a `window.confirm`, que en vistas embebidas y en algunos
 * navegadores está bloqueado: devuelve `false` sin avisar y la acción parecía
 * no ejecutarse. Además permite adaptar el texto a cada caso y seguir el
 * estilo de la plataforma.
 */
export function ConfirmarAccion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Eliminar',
  ocupado = false,
  onConfirmar,
  onCancelar,
}: Props) {
  // Escape cancela: es lo que espera cualquiera ante un diálogo.
  useEffect(() => {
    if (!abierto) return;

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [abierto, onCancelar]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="
        fixed inset-0 z-[9999998] flex items-center justify-center bg-black/60
        p-4 backdrop-blur-sm
      "
      onClick={onCancelar}
    >
      <div
        // El clic dentro no debe cerrar: solo el de fuera.
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1a2e] p-6
          shadow-2xl shadow-black/60
        "
      >
        <div
          className="
            mx-auto mb-4 flex size-12 items-center justify-center rounded-full
            border border-red-400/25 bg-red-400/10
          "
        >
          <AlertTriangle className="size-6 text-red-400" />
        </div>

        <h3 className="mb-2 text-center text-lg font-bold text-white">
          {titulo}
        </h3>
        <p className="mb-6 text-center text-sm leading-relaxed text-white/60">
          {mensaje}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="
              flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm
              font-semibold text-white/70 transition-colors
              hover:bg-white/5 hover:text-white
            "
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className="
              flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold
              text-white transition-colors
              hover:bg-red-400
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {ocupado ? 'Eliminando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
