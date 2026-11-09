'use client';

import { useState } from 'react';

import { Building2, ExternalLink, Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { urlAcademia } from '~/lib/academy/host';

// "Enviar a academia" desde el panel de Artiefy: elige la academia y envía
// (copia) un curso, un programa o varios usuarios. Lo usan la tarjeta de
// cursos (menú ⋯), la de programas y "Administrador de usuarios".

interface AcademiaLista {
  id: number;
  slug: string;
  nombre: string;
  esArtiefy: boolean;
  activa: boolean;
}

export type EnvioAcademia =
  | { tipo: 'curso'; courseId: number; titulo: string }
  | { tipo: 'programa'; programaId: number; titulo: string }
  | {
      tipo: 'usuarios';
      usuarios: { email: string; nombre: string }[];
    };

interface ResultadoUsuario {
  email: string;
  estado: 'vinculado' | 'creado' | 'actualizado' | 'error';
  error?: string;
}

const ROLES = [
  { valor: 'estudiante', texto: 'Estudiante' },
  { valor: 'educador', texto: 'Educador' },
  { valor: 'super-admin', texto: 'Super-admin' },
] as const;

const ESTADOS: Record<ResultadoUsuario['estado'], string> = {
  vinculado: 'Vinculado (misma contraseña, se le avisó por correo)',
  creado: 'Cuenta creada (se le enviaron credenciales)',
  actualizado: 'Ya estaba: se actualizó su rol',
  error: 'Error',
};

export function ModalEnviarAcademia({
  envio,
  onClose,
}: {
  envio: EnvioAcademia;
  onClose: () => void;
}) {
  const { data: academias, isLoading } = useSWR(
    '/api/super-admin/academias',
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return ((await res.json()) as { academias: AcademiaLista[] }).academias;
    }
  );
  // Primero las academias de Artiefy.
  const lista = [...(academias ?? [])]
    .filter((a) => a.activa)
    .sort((a, b) => Number(b.esArtiefy) - Number(a.esArtiefy));

  const [academiaId, setAcademiaId] = useState<number | null>(null);
  const [rol, setRol] = useState<(typeof ROLES)[number]['valor']>('estudiante');
  const [conEducadores, setConEducadores] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoUsuario[] | null>(null);
  const [enviado, setEnviado] = useState<{ slug: string } | null>(null);

  const academia = lista.find((a) => a.id === academiaId);
  const descripcion =
    envio.tipo === 'usuarios'
      ? `${envio.usuarios.length} usuario${envio.usuarios.length === 1 ? '' : 's'}`
      : `${envio.tipo === 'curso' ? 'El curso' : 'El programa'} “${envio.titulo}”`;

  const enviar = async () => {
    if (!academia) return toast.error('Selecciona una academia');
    setEnviando(true);
    try {
      const cuerpo =
        envio.tipo === 'usuarios'
          ? { tipo: 'usuarios', usuarios: envio.usuarios, rol }
          : envio.tipo === 'curso'
            ? { tipo: 'curso', courseId: envio.courseId, conEducadores }
            : {
                tipo: 'programa',
                programaId: envio.programaId,
                conEducadores,
              };
      const res = await fetch(
        `/api/super-admin/academias/${academia.id}/enviar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cuerpo),
        }
      );
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        resultados?: ResultadoUsuario[];
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo enviar');
      if (j.resultados) {
        setResultados(j.resultados);
        const ok = j.resultados.filter((r) => r.estado !== 'error').length;
        toast.success(
          `${ok} de ${j.resultados.length} enviados a ${academia.nombre}`
        );
      } else {
        toast.success(`Enviado a ${academia.nombre}`);
      }
      setEnviado({ slug: academia.slug });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={() => !enviando && onClose()}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f3d]/95 shadow-2xl ring-1 shadow-black/50 ring-[#22C4D3]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#22C4D3]/15 to-transparent px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#22C4D3]/20 text-[#22C4D3]">
              <Building2 className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Enviar a academia
              </h3>
              <p className="line-clamp-1 text-xs text-white/50">
                {descripcion}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {resultados ? (
            <ul className="space-y-2 text-sm">
              {resultados.map((r) => (
                <li
                  key={r.email}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <p className="truncate font-medium text-white">{r.email}</p>
                  <p
                    className={`text-xs ${r.estado === 'error' ? 'text-red-400' : 'text-emerald-300'}`}
                  >
                    {r.estado === 'error'
                      ? (r.error ?? ESTADOS.error)
                      : ESTADOS[r.estado]}
                  </p>
                </li>
              ))}
            </ul>
          ) : enviado ? (
            <p className="text-sm text-white/70">
              Listo. La copia ya está en la academia y se puede editar allí sin
              tocar Artiefy.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">
                  Academia
                </p>
                {isLoading ? (
                  <p className="text-sm text-white/50">Cargando academias...</p>
                ) : lista.length === 0 ? (
                  <p className="text-sm text-white/50">
                    No hay academias activas. Créala primero en Academias.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {lista.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAcademiaId(a.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                          academiaId === a.id
                            ? 'border-[#22C4D3] bg-[#22C4D3]/10'
                            : 'border-transparent hover:bg-white/10'
                        }`}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#22C4D3]/20 text-sm font-semibold text-[#22C4D3]">
                          {a.nombre.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {a.nombre}
                          </p>
                          <p className="truncate text-xs text-white/50">
                            {a.slug}.artiefy.com
                          </p>
                        </span>
                        {a.esArtiefy && (
                          <span className="shrink-0 rounded-full border border-[#22C4D3]/40 px-2 py-0.5 text-[10px] font-semibold text-[#22C4D3]">
                            Artiefy
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {envio.tipo === 'usuarios' ? (
                <label className="block space-y-2">
                  <span className="text-xs font-semibold tracking-wide text-white/40 uppercase">
                    Rol en la academia
                  </span>
                  <select
                    value={rol}
                    onChange={(e) =>
                      setRol(e.target.value as (typeof ROLES)[number]['valor'])
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#22C4D3]/60 focus:outline-none [&>option]:bg-[#0b1f3d]"
                  >
                    {ROLES.map((r) => (
                      <option key={r.valor} value={r.valor}>
                        {r.texto}
                      </option>
                    ))}
                  </select>
                  <span className="block text-xs text-white/50">
                    Quien ya tiene cuenta en Artiefy entra a la academia con su
                    misma contraseña y recibe un aviso por correo.
                  </span>
                </label>
              ) : (
                <label className="flex items-start gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={conEducadores}
                    onChange={(e) => setConEducadores(e.target.checked)}
                    className="mt-0.5 size-4 accent-[#22C4D3]"
                  />
                  <span>
                    Agregar también a sus educadores a la academia
                    <span className="block text-xs text-white/50">
                      Se les vincula su cuenta de Artiefy y se les avisa por
                      correo. Sin esto, la copia queda sin instructor.
                    </span>
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
          {enviado ? (
            <>
              <a
                href={urlAcademia(
                  enviado.slug,
                  '/dashboard/super-admin',
                  window.location.origin
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                <ExternalLink className="size-4" /> Abrir academia
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] hover:bg-[#22C4D3]/90"
              >
                Listo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void enviar()}
                disabled={enviando || !academia}
                className="inline-flex items-center gap-2 rounded-xl bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] hover:bg-[#22C4D3]/90 disabled:opacity-50"
              >
                {enviando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Enviar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
