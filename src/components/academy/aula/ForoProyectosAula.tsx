'use client';

import { useState } from 'react';

import {
  ExternalLink,
  FolderKanban,
  Loader2,
  MessagesSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { cn } from '~/lib/utils';

// Pestañas Foro y Proyectos del curso en el aula del estudiante de una
// academia (como las del curso en Artiefy).

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  const j = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar');
  return j;
};

const enviarJson = async (url: string, metodo: string, body?: unknown) => {
  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar');
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const campo =
  'w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none';
const botonPrimario =
  'inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40';

// ---------------------------------------------------------------- Foro ---

interface Mensaje {
  id: number;
  parentId: number | null;
  titulo: string | null;
  contenido: string;
  createdAt: string;
  userId: string;
  nombre: string;
  rol: string;
}

export function ForoCurso({
  slug,
  courseId,
  userId,
  esPersonal,
}: {
  slug: string;
  courseId: number;
  userId: string;
  esPersonal: boolean;
}) {
  const api = `/api/academia/${slug}/aula/foro`;
  const { data, mutate } = useSWR(
    `${api}?courseId=${courseId}`,
    fetcher<{ mensajes: Mensaje[] }>
  );
  const [nuevo, setNuevo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [abierto, setAbierto] = useState<number | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mensajes = data?.mensajes ?? [];
  const temas = mensajes.filter((m) => m.parentId == null).reverse();

  const publicar = async (cuerpo: Record<string, unknown>) => {
    setEnviando(true);
    try {
      await enviarJson(api, 'POST', { courseId, ...cuerpo });
      await mutate();
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    } finally {
      setEnviando(false);
    }
  };
  const borrar = async (id: number) => {
    try {
      await enviarJson(`${api}?id=${id}`, 'DELETE');
      await mutate();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const etiqueta = (m: Mensaje) =>
    m.rol !== 'estudiante' && (
      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
        {m.rol === 'educador' ? 'Educador' : 'Academia'}
      </span>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <MessagesSquare className="size-5 text-primary" /> Foro del curso
          </h3>
          <p className="text-sm text-muted-foreground">
            Haz preguntas y comparte con tus compañeros y el educador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNuevo((v) => !v)}
          className={botonPrimario}
        >
          <Plus className="size-4" /> Nuevo tema
        </button>
      </div>

      {nuevo && (
        <div className="space-y-2 rounded-2xl border border-border bg-background/40 p-4">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título del tema"
            className={campo}
          />
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={3}
            placeholder="¿Qué quieres preguntar o compartir?"
            className={campo}
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!titulo.trim() || !contenido.trim() || enviando}
              onClick={() =>
                void publicar({ titulo, contenido }).then((ok) => {
                  if (ok) {
                    setTitulo('');
                    setContenido('');
                    setNuevo(false);
                  }
                })
              }
              className={botonPrimario}
            >
              {enviando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Publicar
            </button>
          </div>
        </div>
      )}

      {!data ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : temas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay temas en el foro. ¡Abre el primero!
        </p>
      ) : (
        temas.map((t) => {
          const respuestas = mensajes.filter((m) => m.parentId === t.id);
          const expandido = abierto === t.id;
          return (
            <article
              key={t.id}
              className="rounded-2xl border border-border bg-background/40 p-4"
            >
              <button
                type="button"
                onClick={() => setAbierto(expandido ? null : t.id)}
                className="w-full text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-foreground">{t.titulo}</h4>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {respuestas.length}{' '}
                    {respuestas.length === 1 ? 'respuesta' : 'respuestas'}
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {t.nombre} {etiqueta(t)} · {fecha(t.createdAt)}
                </p>
                <p
                  className={cn(
                    'mt-2 text-sm whitespace-pre-line text-foreground/90',
                    !expandido && 'line-clamp-2'
                  )}
                >
                  {t.contenido}
                </p>
              </button>
              {(t.userId === userId || esPersonal) && (
                <button
                  type="button"
                  onClick={() => void borrar(t.id)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="size-3.5" /> Borrar tema
                </button>
              )}
              {expandido && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  {respuestas.map((r) => (
                    <div key={r.id} className="rounded-xl bg-card/60 p-3">
                      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {r.nombre}
                        </span>
                        {etiqueta(r)} · {fecha(r.createdAt)}
                        {(r.userId === userId || esPersonal) && (
                          <button
                            type="button"
                            onClick={() => void borrar(r.id)}
                            className="ml-auto hover:text-red-500"
                            aria-label="Borrar respuesta"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </p>
                      <p className="mt-1 text-sm whitespace-pre-line text-foreground/90">
                        {r.contenido}
                      </p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      placeholder="Escribe una respuesta…"
                      className={campo}
                    />
                    <button
                      type="button"
                      disabled={!respuesta.trim() || enviando}
                      onClick={() =>
                        void publicar({
                          parentId: t.id,
                          contenido: respuesta,
                        }).then((ok) => ok && setRespuesta(''))
                      }
                      className="rounded-xl bg-primary px-3 text-[var(--ac-primario-texto)] disabled:opacity-40"
                      aria-label="Responder"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}

// ----------------------------------------------------------- Proyectos ---

interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string | null;
  enlace: string | null;
  estado: 'en progreso' | 'entregado' | 'aprobado';
  updatedAt: string;
}

const ESTADO: Record<Proyecto['estado'], string> = {
  'en progreso': 'bg-blue-500/15 text-blue-500',
  entregado: 'bg-amber-500/15 text-amber-600',
  aprobado: 'bg-green-500/15 text-green-600',
};

export function ProyectosCurso({
  slug,
  courseId,
  previa,
}: {
  slug: string;
  courseId: number;
  previa: boolean;
}) {
  const api = `/api/academia/${slug}/aula/proyectos`;
  const { data, mutate } = useSWR(
    `${api}?courseId=${courseId}`,
    fetcher<{ proyectos: Proyecto[] }>
  );
  const [editando, setEditando] = useState<Partial<Proyecto> | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async (entregar: boolean) => {
    if (!editando) return;
    setEnviando(true);
    try {
      await enviarJson(api, 'POST', {
        id: editando.id,
        courseId,
        titulo: editando.titulo,
        descripcion: editando.descripcion,
        enlace: editando.enlace,
        entregar,
      });
      await mutate();
      setEditando(null);
      toast.success(entregar ? 'Proyecto entregado' : 'Proyecto guardado');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <FolderKanban className="size-5 text-primary" /> Mis proyectos
          </h3>
          <p className="text-sm text-muted-foreground">
            Registra tu proyecto del curso y entrégalo cuando esté listo.
          </p>
        </div>
        {!previa && !editando && (
          <button
            type="button"
            onClick={() =>
              setEditando({ titulo: '', descripcion: '', enlace: '' })
            }
            className={botonPrimario}
          >
            <Plus className="size-4" /> Nuevo proyecto
          </button>
        )}
      </div>

      {editando && (
        <div className="space-y-2 rounded-2xl border border-border bg-background/40 p-4">
          <input
            value={editando.titulo ?? ''}
            onChange={(e) =>
              setEditando({ ...editando, titulo: e.target.value })
            }
            placeholder="Título del proyecto"
            className={campo}
          />
          <textarea
            value={editando.descripcion ?? ''}
            onChange={(e) =>
              setEditando({ ...editando, descripcion: e.target.value })
            }
            rows={3}
            placeholder="Describe tu proyecto"
            className={campo}
          />
          <input
            value={editando.enlace ?? ''}
            onChange={(e) =>
              setEditando({ ...editando, enlace: e.target.value })
            }
            placeholder="Enlace (repositorio, documento, video…): https://…"
            className={campo}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!editando.titulo?.trim() || enviando}
              onClick={() => void guardar(false)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              type="button"
              disabled={!editando.titulo?.trim() || enviando}
              onClick={() => void guardar(true)}
              className={botonPrimario}
            >
              {enviando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Entregar
            </button>
          </div>
        </div>
      )}

      {!data ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : data.proyectos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {previa
            ? 'Vista previa: aquí el estudiante registra y entrega sus proyectos.'
            : 'Aún no has registrado proyectos en este curso.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.proyectos.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-border bg-background/40 p-4"
            >
              <div className="flex items-start gap-2">
                <h4 className="min-w-0 flex-1 font-semibold text-foreground">
                  {p.titulo}
                </h4>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
                    ESTADO[p.estado]
                  )}
                >
                  {p.estado}
                </span>
              </div>
              {p.descripcion && (
                <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">
                  {p.descripcion}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {p.enlace && (
                  <a
                    href={p.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" /> Ver proyecto
                  </a>
                )}
                {p.estado !== 'aprobado' && !previa && (
                  <button
                    type="button"
                    onClick={() => setEditando(p)}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" /> Editar
                  </button>
                )}
                <span className="ml-auto text-muted-foreground">
                  {fecha(p.updatedAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
