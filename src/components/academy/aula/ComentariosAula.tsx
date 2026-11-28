'use client';

import { useState } from 'react';

import {
  Loader2,
  MessageCircle,
  Reply,
  Send,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { cn } from '~/lib/utils';

// Comentarios de una clase y opiniones de un curso del aula de una academia
// (como LessonComments y CourseComments de Artiefy).

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  const j = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(j.error ?? 'No se pudo cargar');
  return j;
};

const hace = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

function Avatar({ nombre }: { nombre: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
      {nombre.charAt(0).toUpperCase()}
    </span>
  );
}

const enviarJson = async (url: string, metodo: string, body?: unknown) => {
  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar');
};

// ------------------------------------------------------------ Clase ---

interface Comentario {
  id: number;
  parentId: number | null;
  contenido: string;
  createdAt: string;
  userId: string;
  nombre: string;
  rol: string;
}

export function ComentariosClase({
  slug,
  lessonId,
  userId,
  esPersonal,
}: {
  slug: string;
  lessonId: number;
  userId: string;
  // Educador / super-admin: puede borrar cualquier comentario.
  esPersonal: boolean;
}) {
  const api = `/api/academia/${slug}/aula/comentarios`;
  const { data, mutate } = useSWR(
    `${api}?lessonId=${lessonId}`,
    fetcher<{ comentarios: Comentario[] }>
  );
  const [texto, setTexto] = useState('');
  const [respondiendo, setRespondiendo] = useState<number | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const comentarios = data?.comentarios ?? [];
  const raiz = comentarios.filter((c) => c.parentId == null).reverse();

  const publicar = async (contenido: string, parentId?: number) => {
    setEnviando(true);
    try {
      await enviarJson(api, 'POST', { lessonId, contenido, parentId });
      await mutate();
      if (parentId) {
        setRespondiendo(null);
        setRespuesta('');
      } else setTexto('');
    } catch (error) {
      toast.error((error as Error).message);
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

  const tarjeta = (c: Comentario, respuestaDe = false) => (
    <div key={c.id} className={cn('flex gap-3', respuestaDe && 'mt-3')}>
      <Avatar nombre={c.nombre} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {c.nombre}
          </span>
          {c.rol !== 'estudiante' && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {c.rol === 'educador' ? 'Educador' : 'Academia'}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {hace(c.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm whitespace-pre-line text-foreground/90">
          {c.contenido}
        </p>
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          {!respuestaDe && (
            <button
              type="button"
              onClick={() => setRespondiendo(c.id)}
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              <Reply className="size-3.5" /> Responder
            </button>
          )}
          {(c.userId === userId || esPersonal) && (
            <button
              type="button"
              onClick={() => void borrar(c.id)}
              className="inline-flex items-center gap-1 hover:text-red-500"
            >
              <Trash2 className="size-3.5" /> Borrar
            </button>
          )}
        </div>
        {!respuestaDe &&
          comentarios
            .filter((r) => r.parentId === c.id)
            .map((r) => tarjeta(r, true))}
        {respondiendo === c.id && (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              placeholder={`Responder a ${c.nombre}…`}
              className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              disabled={!respuesta.trim() || enviando}
              onClick={() => void publicar(respuesta, c.id)}
              className="rounded-xl bg-primary px-3 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <MessageCircle className="size-5 text-primary" /> Comentarios
        <span className="text-sm font-normal text-muted-foreground">
          ({comentarios.length})
        </span>
      </h2>
      <div className="mt-4 flex gap-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          placeholder="Escribe un comentario o una pregunta sobre la clase…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={!texto.trim() || enviando}
          onClick={() => void publicar(texto)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40"
        >
          {enviando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Publicar
        </button>
      </div>
      <div className="mt-6 space-y-5">
        {!data ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : raiz.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay comentarios. ¡Sé el primero!
          </p>
        ) : (
          raiz.map((c) => tarjeta(c))
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------ Curso ---

interface Opiniones {
  promedio: number;
  total: number;
  opiniones: {
    id: number;
    userId: string;
    estrellas: number;
    contenido: string | null;
    createdAt: string;
    nombre: string;
  }[];
}

function Estrellas({
  valor,
  onCambio,
  tamano = 'size-4',
}: {
  valor: number;
  onCambio?: (v: number) => void;
  tamano?: string;
}) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onCambio}
          onClick={() => onCambio?.(n)}
          aria-label={`${n} estrellas`}
          className="disabled:cursor-default"
        >
          <Star
            className={cn(
              tamano,
              n <= valor
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            )}
          />
        </button>
      ))}
    </span>
  );
}

export function OpinionesCurso({
  slug,
  courseId,
  userId,
  puedeOpinar,
  motivo,
}: {
  slug: string;
  courseId: number;
  userId: string;
  // Solo el estudiante matriculado opina.
  puedeOpinar: boolean;
  motivo: string;
}) {
  const api = `/api/academia/${slug}/aula/opiniones`;
  const { data, mutate } = useSWR(
    `${api}?courseId=${courseId}`,
    fetcher<Opiniones>
  );
  const mia = data?.opiniones.find((o) => o.userId === userId);
  const [estrellas, setEstrellas] = useState(0);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const publicar = async () => {
    const valor = estrellas || mia?.estrellas || 0;
    setEnviando(true);
    try {
      await enviarJson(api, 'POST', {
        courseId,
        estrellas: valor,
        contenido: texto,
      });
      await mutate();
      setTexto('');
      setEstrellas(0);
      toast.success('¡Gracias por tu opinión!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Opiniones del curso
          </h2>
          <p className="text-sm text-muted-foreground">
            Comparte tu experiencia y lee lo que otros estudiantes opinan
          </p>
        </div>
        {data && data.total > 0 && (
          <span className="inline-flex items-center gap-2 text-sm text-foreground">
            <Estrellas valor={Math.round(data.promedio)} />
            <strong>{data.promedio.toFixed(1)}</strong>
            <span className="text-muted-foreground">({data.total})</span>
          </span>
        )}
      </div>

      {puedeOpinar ? (
        <div className="mt-4 rounded-2xl border border-border bg-card/40 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Tu experiencia:
            <Estrellas
              valor={estrellas || mia?.estrellas || 0}
              onCambio={setEstrellas}
              tamano="size-5"
            />
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder={
              mia
                ? 'Actualiza tu opinión del curso…'
                : 'Comparte tu opinión sobre el curso…'
            }
            className="mt-3 w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!(estrellas || mia?.estrellas) || enviando}
              onClick={() => void publicar()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40"
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
      ) : (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600">
          {motivo}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {data?.opiniones.map((o) => (
          <div key={o.id} className="flex gap-3">
            <Avatar nombre={o.nombre} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {o.nombre}
                </span>
                <span className="text-xs text-muted-foreground">
                  {hace(o.createdAt)}
                </span>
                <span className="ml-auto">
                  <Estrellas valor={o.estrellas} />
                </span>
              </div>
              {o.contenido && (
                <p className="mt-1 text-sm whitespace-pre-line text-foreground/90">
                  {o.contenido}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
