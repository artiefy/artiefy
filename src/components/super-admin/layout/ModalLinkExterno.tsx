'use client';

import { useEffect, useState } from 'react';

import { ExternalLink, Link2, Pencil, Trash2, X } from 'lucide-react';

interface Props {
  abierto: boolean;
  /** El enlace guardado. */
  url: string;
  /** Nombre de la clase, para situar al operador. */
  tituloClase: string;
  guardando?: boolean;
  onGuardar: (nuevaUrl: string) => void;
  onEliminar: () => void;
  onCerrar: () => void;
}

/**
 * Ficha del LINK EXTERNO de una clase.
 *
 * Reúne en un solo sitio las tres cosas que se pueden hacer con él: abrirlo,
 * cambiarlo y borrarlo. Antes vivían como botones sueltos en la fila de la
 * clase, mezclados con los de la grabación, y era fácil confundir cuál era
 * cuál.
 */
export function ModalLinkExterno({
  abierto,
  url,
  tituloClase,
  guardando = false,
  onGuardar,
  onEliminar,
  onCerrar,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(url);

  // Al reabrir sobre otra clase hay que partir de su enlace, no del anterior.
  useEffect(() => {
    if (abierto) {
      setBorrador(url);
      setEditando(false);
    }
  }, [abierto, url]);

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Link externo de la clase"
      onClick={onCerrar}
      className="
        fixed inset-0 z-[9999998] flex items-center justify-center bg-black/60
        p-4 backdrop-blur-sm
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-lg rounded-2xl border border-white/10
          bg-[#0b1a2e] p-6 shadow-2xl shadow-black/60
        "
      >
        {/* Anclada a la esquina, fuera del flujo: dentro de un flex se
            desplazaba cuando el nombre de la clase era largo. */}
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="
            absolute top-4 right-4 rounded-lg p-1.5 text-white/50
            transition-colors
            hover:bg-white/10 hover:text-white
          "
        >
          <X className="size-4" />
        </button>

        {/* pr-10 reserva el hueco de la X para que el título no pase por
            debajo. */}
        <div className="mb-4 flex items-center gap-3 pr-10">
          <span
            className="
              flex size-10 shrink-0 items-center justify-center rounded-xl
              border border-[#22C4D3]/25 bg-[#22C4D3]/10
            "
          >
            <Link2 className="size-5 text-[#22C4D3]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Link externo</h3>
            <p className="truncate text-xs text-white/50">{tituloClase}</p>
          </div>
        </div>

        {editando ? (
          <input
            type="url"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            autoFocus
            placeholder="https://..."
            className="
              mb-4 w-full rounded-xl border border-white/10 bg-black/30 px-3
              py-2.5 text-sm text-white
              placeholder:text-white/30
              focus:border-[#22C4D3]/60 focus:ring-2 focus:ring-[#22C4D3]/20
              focus:outline-none
            "
          />
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              mb-4 flex items-center gap-2 rounded-xl border border-white/10
              bg-black/25 px-3 py-2.5 text-sm text-[#22C4D3] transition-colors
              hover:border-[#22C4D3]/40 hover:bg-black/40
            "
          >
            <span className="min-w-0 flex-1 truncate">{url}</span>
            <ExternalLink className="size-4 shrink-0" />
          </a>
        )}

        <div className="flex flex-wrap gap-2">
          {editando ? (
            <>
              <button
                type="button"
                disabled={guardando || !borrador.trim()}
                onClick={() => onGuardar(borrador)}
                className="
                  flex-1 rounded-xl bg-[#22C4D3] px-4 py-2.5 text-sm font-bold
                  text-[#04101f] transition-colors
                  hover:bg-[#3ad4e2]
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBorrador(url);
                  setEditando(false);
                }}
                className="
                  rounded-xl border border-white/10 px-4 py-2.5 text-sm
                  font-semibold text-white/70 transition-colors
                  hover:bg-white/5 hover:text-white
                "
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="
                  flex flex-1 items-center justify-center gap-2 rounded-xl
                  border border-white/10 px-4 py-2.5 text-sm font-semibold
                  text-white/80 transition-colors
                  hover:bg-white/5 hover:text-white
                "
              >
                <Pencil className="size-4" />
                Editar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={onEliminar}
                className="
                  flex flex-1 items-center justify-center gap-2 rounded-xl
                  border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm
                  font-semibold text-red-300 transition-colors
                  hover:bg-red-400/20
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                <Trash2 className="size-4" />
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
