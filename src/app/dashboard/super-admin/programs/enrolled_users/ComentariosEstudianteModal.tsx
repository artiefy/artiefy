'use client';

import { useCallback, useEffect, useState } from 'react';

import { Loader2, MessageSquare, Plus, Trash2, X } from 'lucide-react';

interface Comentario {
  id: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  authorId: string | null;
  authorName: string | null;
}

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

/**
 * Modal de comentarios de un estudiante (por persona, no por grupo). Permite
 * crear comentarios, eliminarlos y responder a cada uno (hilos de 1 nivel).
 */
export default function ComentariosEstudianteModal({
  userId,
  nombre,
  onClose,
}: {
  userId: string;
  nombre: string;
  onClose: () => void;
}) {
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nuevo comentario raíz
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nuevoTexto, setNuevoTexto] = useState('');

  // Respuesta a un comentario
  const [respondiendoA, setRespondiendoA] = useState<number | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/super-admin/student-comments?studentId=${encodeURIComponent(userId)}`
      );
      const j = (await res.json()) as {
        comentarios?: Comentario[];
        error?: string;
      };
      if (!res.ok) {
        setError(j.error ?? 'No se pudieron cargar los comentarios');
        setComentarios([]);
        return;
      }
      setComentarios(j.comentarios ?? []);
    } catch {
      setError('Error de red al cargar los comentarios');
      setComentarios([]);
    }
  }, [userId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async (content: string, parentId: number | null) => {
    const texto = content.trim();
    if (!texto) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/super-admin/student-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId, content: texto, parentId }),
      });
      if (!res.ok) throw new Error();
      setNuevoTexto('');
      setMostrarNuevo(false);
      setRespuestaTexto('');
      setRespondiendoA(null);
      await cargar();
    } catch {
      setError('No se pudo guardar el comentario');
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (id: number) => {
    setEliminando(id);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/student-comments?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      await cargar();
    } catch {
      setError('No se pudo eliminar el comentario');
    } finally {
      setEliminando(null);
    }
  };

  const raiz = (comentarios ?? []).filter((c) => c.parentId === null);
  const respuestasDe = (id: number) =>
    (comentarios ?? []).filter((c) => c.parentId === id);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#22C4D3]/30 bg-[#061c37] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <MessageSquare className="size-4 text-[#22C4D3]" />
            Comentarios · {nombre}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {/* Botón / formulario de nuevo comentario */}
          {!mostrarNuevo ? (
            <button
              type="button"
              onClick={() => setMostrarNuevo(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#22C4D3] py-2.5 text-sm font-semibold text-[#04101f] transition-colors hover:bg-[#3ad4e2]"
            >
              <Plus className="size-4" /> Nuevo
            </button>
          ) : (
            <div className="rounded-xl border border-[#22C4D3]/30 bg-white/[0.02] p-3">
              <textarea
                autoFocus
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                rows={3}
                placeholder="Escribe un comentario…"
                className="w-full resize-y rounded-lg border border-white/10 bg-[#04101f] px-2.5 py-2 text-sm text-white/90 placeholder:text-white/25 focus:border-[#22C4D3] focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarNuevo(false);
                    setNuevoTexto('');
                  }}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void crear(nuevoTexto, null)}
                  disabled={enviando || !nuevoTexto.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#22C4D3] px-4 py-1 text-xs font-semibold text-[#04101f] hover:bg-[#3ad4e2] disabled:opacity-40"
                >
                  {enviando && <Loader2 className="size-3 animate-spin" />}
                  Publicar
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          {comentarios === null && (
            <div className="flex items-center justify-center py-8 text-white/50">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {comentarios !== null && raiz.length === 0 && !error && (
            <p className="py-6 text-center text-sm text-white/40">
              Sin comentarios todavía.
            </p>
          )}

          {raiz.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] text-white/40">
                  {formatFecha(c.createdAt)}
                  {c.authorName ? ` · ${c.authorName}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => void eliminar(c.id)}
                  disabled={eliminando === c.id}
                  className="shrink-0 text-white/35 hover:text-red-400 disabled:opacity-40"
                  aria-label="Eliminar comentario"
                >
                  {eliminando === c.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap text-white/90">
                {c.content}
              </p>

              {/* Respuestas */}
              {respuestasDe(c.id).map((r) => (
                <div
                  key={r.id}
                  className="mt-2 ml-3 border-l border-white/10 pl-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-white/40">
                      {formatFecha(r.createdAt)}
                      {r.authorName ? ` · ${r.authorName}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => void eliminar(r.id)}
                      disabled={eliminando === r.id}
                      className="shrink-0 text-white/35 hover:text-red-400 disabled:opacity-40"
                      aria-label="Eliminar respuesta"
                    >
                      {eliminando === r.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs whitespace-pre-wrap text-white/80">
                    {r.content}
                  </p>
                </div>
              ))}

              {/* Responder */}
              {respondiendoA === c.id ? (
                <div className="mt-2 ml-3 border-l border-[#22C4D3]/30 pl-3">
                  <textarea
                    autoFocus
                    value={respuestaTexto}
                    onChange={(e) => setRespuestaTexto(e.target.value)}
                    rows={2}
                    placeholder="Escribe una respuesta…"
                    className="w-full resize-y rounded-lg border border-white/10 bg-[#04101f] px-2.5 py-1.5 text-xs text-white/90 placeholder:text-white/25 focus:border-[#22C4D3] focus:outline-none"
                  />
                  <div className="mt-1.5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRespondiendoA(null);
                        setRespuestaTexto('');
                      }}
                      className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/70 hover:bg-white/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void crear(respuestaTexto, c.id)}
                      disabled={enviando || !respuestaTexto.trim()}
                      className="inline-flex items-center gap-1 rounded-full bg-[#22C4D3] px-3 py-0.5 text-[11px] font-semibold text-[#04101f] hover:bg-[#3ad4e2] disabled:opacity-40"
                    >
                      {enviando && <Loader2 className="size-3 animate-spin" />}
                      Responder
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRespondiendoA(c.id);
                    setRespuestaTexto('');
                  }}
                  className="mt-2 text-[11px] font-medium text-[#22C4D3]/80 hover:text-[#22C4D3]"
                >
                  Comentar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
