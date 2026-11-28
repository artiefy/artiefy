'use client';

import { useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Home,
  Loader2,
  Lock,
  Paperclip,
  PlayCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  embebido,
  RecursosClase,
} from '~/components/academy/DetalleClaseAcademia';
import { subirArchivo } from '~/lib/academy/subir-logo';
import { cn } from '~/lib/utils';
import { type ClaseEstudiante } from '~/server/academy/aula';

import { ComentariosClase } from './ComentariosAula';

import type { Route } from 'next';

// Vista de una clase para el estudiante de una academia, como la de Artiefy:
// lista de clases a la izquierda, video (su avance se guarda solo) o botón
// para completarla, y pestañas de Actividades (con entrega) y Recursos.

type Actividad = ClaseEstudiante['leccion']['actividades'][number];

const TIPO: Record<Actividad['tipo'], { label: string; clase: string }> = {
  tarea: { label: 'Tarea', clase: 'bg-blue-500/15 text-blue-300' },
  quiz: { label: 'Quiz', clase: 'bg-yellow-500/15 text-yellow-300' },
  proyecto: { label: 'Proyecto', clase: 'bg-purple-500/15 text-purple-300' },
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export function ClaseAula({
  slug,
  datos,
  userId,
  previa = false,
}: {
  slug: string;
  datos: ClaseEstudiante;
  userId: string;
  // Personal viendo el área del estudiante: no guarda avance ni entregas.
  previa?: boolean;
}) {
  const router = useRouter();
  const { leccion, clases, anterior, siguiente } = datos;
  const [progreso, setProgreso] = useState(datos.progreso);
  const [completada, setCompletada] = useState(datos.completada);
  const [guardando, setGuardando] = useState(false);
  const [pestana, setPestana] = useState<'actividades' | 'recursos'>(
    leccion.actividades.length > 0 ? 'actividades' : 'recursos'
  );
  const enviado = useRef(datos.progreso);

  const urlCurso = `/dashboard/student/cursos/${leccion.courseId}` as Route;
  const urlClase = (id: number) => `${urlCurso}/clases/${id}` as Route;
  const s3 = process.env.NEXT_PUBLIC_AWS_S3_URL;
  const videoS3 =
    leccion.coverVideoKey && leccion.coverVideoKey !== 'none'
      ? `${s3}/${leccion.coverVideoKey}`
      : null;
  const videoExterno =
    !videoS3 && leccion.videoUrl ? embebido(leccion.videoUrl) : null;

  const guardar = async (valor: number, completar = false) => {
    if (previa) return;
    try {
      const res = await fetch(`/api/academia/${slug}/aula/progreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: leccion.id,
          progreso: valor,
          completar,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        progreso?: number;
        completada?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar el avance');
      setProgreso(j.progreso ?? valor);
      if (j.completada && !completada) {
        setCompletada(true);
        toast.success('¡Clase completada!', {
          description: siguiente
            ? 'Ya puedes pasar a la siguiente clase.'
            : 'Terminaste la última clase del curso. 🎉',
        });
        router.refresh();
      }
    } catch (error) {
      if (completar) toast.error((error as Error).message);
    }
  };

  // Avance del video: se guarda cada 10 % (nunca baja) y al terminar se
  // completa la clase (con el 95 % visto cuenta como terminada).
  const alAvanzar = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.duration || completada) return;
    const pct = Math.floor((v.currentTime / v.duration) * 100);
    if (pct >= 95) {
      enviado.current = 100;
      void guardar(100, true);
    } else if (pct >= enviado.current + 10) {
      enviado.current = pct;
      void guardar(pct);
    }
  };

  const completarManual = async () => {
    setGuardando(true);
    await guardar(100, true);
    setGuardando(false);
  };

  return (
    <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
      {/* Clases del curso */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card/40 p-3">
          <Link
            href={urlCurso}
            className="mb-3 flex items-center gap-2 px-2 py-1 text-sm font-semibold text-primary hover:opacity-80"
          >
            <ChevronLeft className="size-4" />
            <span className="truncate">{leccion.curso}</span>
          </Link>
          <ul className="space-y-1.5">
            {clases.map((c, i) => {
              const actual = c.id === leccion.id;
              const hecha = actual ? completada : c.completada;
              const contenido = (
                <>
                  {hecha ? (
                    <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                  ) : c.desbloqueada ? (
                    <PlayCircle className="size-4 shrink-0 text-white/50" />
                  ) : (
                    <Lock className="size-4 shrink-0 text-white/30" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-white/40">
                      Clase {i + 1}
                    </span>
                    <span className="line-clamp-2">{c.title}</span>
                  </span>
                </>
              );
              const clase = cn(
                'flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors',
                actual
                  ? 'border border-primary/40 bg-primary/10 text-white'
                  : 'text-white/70'
              );
              return (
                <li key={c.id}>
                  {c.desbloqueada && !actual ? (
                    <Link
                      href={urlClase(c.id)}
                      className={cn(clase, 'hover:bg-white/5')}
                    >
                      {contenido}
                    </Link>
                  ) : (
                    <div className={cn(clase, !c.desbloqueada && 'opacity-50')}>
                      {contenido}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Clase */}
      <main className="min-w-0 flex-1">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/60">
          <Link
            href={'/dashboard/student' as Route}
            className="inline-flex items-center gap-1 hover:text-primary"
          >
            <Home className="size-4" /> Inicio
          </Link>
          <ChevronRight className="size-4 text-white/30" />
          <Link href={urlCurso} className="truncate hover:text-primary">
            {leccion.curso}
          </Link>
          <ChevronRight className="size-4 text-white/30" />
          <span className="truncate font-semibold text-white">
            {leccion.title}
          </span>
        </nav>

        {(videoS3 ?? videoExterno) && (
          <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-2xl">
            {videoS3 ? (
              <video
                src={videoS3}
                controls
                playsInline
                controlsList="nodownload"
                onTimeUpdate={alAvanzar}
                className="aspect-video w-full"
              />
            ) : (
              <iframe
                src={videoExterno ?? undefined}
                title={leccion.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
              />
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {leccion.title}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {leccion.educador ? `${leccion.educador} · ` : ''}
              {leccion.duracionMin ? `${leccion.duracionMin} min` : ''}
            </p>
          </div>
          {completada ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-4 py-2 text-sm font-semibold text-green-400">
              <CheckCircle2 className="size-4" /> Clase completada
            </span>
          ) : (
            // Sin video propio (o con video externo, que no se puede
            // medir) se completa con el botón, como en Artiefy.
            !videoS3 &&
            !previa && (
              <button
                type="button"
                onClick={() => void completarManual()}
                disabled={guardando}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-50"
              >
                {guardando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Marcar como completada
              </button>
            )
          )}
        </div>

        {videoS3 && !completada && (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <span className="text-xs text-white/50">
              {progreso}% visto · se completa al terminar el video
            </span>
          </div>
        )}

        {leccion.description && (
          <p className="mt-4 max-w-4xl text-base whitespace-pre-line text-white/60">
            {leccion.description}
          </p>
        )}

        {/* Pestañas */}
        <div className="mt-8 flex gap-1 border-b border-white/10">
          {(
            [
              [
                'actividades',
                `Actividades (${leccion.actividades.length})`,
                ClipboardList,
              ],
              ['recursos', 'Recursos', FileText],
            ] as const
          ).map(([id, label, Icono]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={cn(
                'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium',
                pestana === id ? 'text-white' : 'text-white/50 hover:text-white'
              )}
            >
              <Icono className="size-4" /> {label}
              {pestana === id && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-card/40 p-4 sm:p-6">
          {pestana === 'recursos' ? (
            <RecursosClase
              claves={leccion.resourceKey}
              nombres={leccion.resourceNames}
              videoUrl={videoS3 ? null : leccion.videoUrl}
            />
          ) : leccion.actividades.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/50">
              Esta clase no tiene actividades.
            </p>
          ) : (
            <div className="space-y-4">
              {leccion.actividades.map((a) => (
                <TarjetaActividad
                  key={a.id}
                  slug={slug}
                  actividad={a}
                  previa={previa}
                />
              ))}
            </div>
          )}
        </div>

        {/* Anterior / siguiente */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {anterior ? (
            <Link
              href={urlClase(anterior.id)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
            >
              <ChevronLeft className="size-4" /> Anterior
            </Link>
          ) : (
            <span />
          )}
          {siguiente &&
            (completada ? (
              <Link
                href={urlClase(siguiente.id)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-[var(--ac-primario-texto)]"
              >
                Siguiente clase <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span
                title="Completa esta clase para continuar"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/40"
              >
                <Lock className="size-4" /> Siguiente clase
              </span>
            ))}
        </div>

        <div className="mt-8">
          <ComentariosClase
            slug={slug}
            lessonId={leccion.id}
            userId={userId}
            esPersonal={previa}
          />
        </div>

        {/* En móvil, la lista de clases va abajo */}
        <div className="mt-8 lg:hidden">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-white">
            <BookOpen className="size-5 text-primary" /> Clases del curso
          </h2>
          <div className="space-y-2">
            {clases.map((c, i) =>
              c.desbloqueada ? (
                <Link
                  key={c.id}
                  href={urlClase(c.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm',
                    c.id === leccion.id
                      ? 'border-primary/40 bg-primary/10 text-white'
                      : 'text-white/70'
                  )}
                >
                  {c.completada ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <PlayCircle className="size-4 text-white/50" />
                  )}
                  {i + 1}. {c.title}
                </Link>
              ) : (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/40"
                >
                  <Lock className="size-4" /> {i + 1}. {c.title}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TarjetaActividad({
  slug,
  actividad,
  previa,
}: {
  slug: string;
  actividad: Actividad;
  previa: boolean;
}) {
  const [entrega, setEntrega] = useState(actividad.entrega);
  const [editando, setEditando] = useState(!actividad.entrega);
  const [texto, setTexto] = useState(actividad.entrega?.texto ?? '');
  const [enlace, setEnlace] = useState(actividad.entrega?.enlace ?? '');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const tipo = TIPO[actividad.tipo];
  const vencida = actividad.vencida;
  const s3 = process.env.NEXT_PUBLIC_AWS_S3_URL;

  const entregar = async () => {
    setEnviando(true);
    try {
      const archivoKey = archivo
        ? await subirArchivo(archivo)
        : (entrega?.archivoKey ?? null);
      const res = await fetch(`/api/academia/${slug}/aula/entregas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: actividad.id,
          texto,
          enlace,
          archivoKey,
          archivoNombre: archivo?.name ?? entrega?.archivoNombre ?? null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        entrega?: Actividad['entrega'];
        error?: string;
      };
      if (!res.ok || !j.entrega) {
        throw new Error(j.error ?? 'No se pudo entregar');
      }
      setEntrega(j.entrega);
      setArchivo(null);
      setEditando(false);
      toast.success('Actividad entregada');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <article className="rounded-xl border border-white/10 bg-background/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            tipo.clase
          )}
        >
          {tipo.label}
        </span>
        <h3 className="min-w-0 flex-1 font-semibold text-white">
          {actividad.title}
        </h3>
        {actividad.nota ? (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
            {actividad.nota.nota}/{actividad.puntaje}
          </span>
        ) : entrega ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
            <CheckCircle2 className="size-3.5" /> Entregada
          </span>
        ) : (
          <span className="text-xs text-white/40">
            {actividad.puntaje} puntos
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
        {actividad.fechaInicio && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" /> Desde{' '}
            {fecha(actividad.fechaInicio)}
          </span>
        )}
        {actividad.fechaLimite && (
          <span
            className={cn(
              'inline-flex items-center gap-1',
              vencida && 'text-red-400'
            )}
          >
            <Clock className="size-3.5" /> Hasta {fecha(actividad.fechaLimite)}
          </span>
        )}
      </div>
      {actividad.description && (
        <p className="mt-3 text-sm whitespace-pre-line text-white/70">
          {actividad.description}
        </p>
      )}
      {actividad.nota?.comentario && (
        <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-white/80">
          <span className="font-semibold text-primary">Comentario: </span>
          {actividad.nota.comentario}
        </p>
      )}

      {entrega && !editando && (
        <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
          <p className="text-xs text-white/40">
            Tu entrega · {fecha(entrega.entregadaAt)}
          </p>
          {entrega.texto && (
            <p className="whitespace-pre-line text-white/80">{entrega.texto}</p>
          )}
          {entrega.enlace && (
            <a
              href={entrega.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" /> {entrega.enlace}
            </a>
          )}
          {entrega.archivoKey && (
            <a
              href={`${s3}/${entrega.archivoKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Paperclip className="size-3.5" />{' '}
              {entrega.archivoNombre ?? 'Archivo'}
            </a>
          )}
          {!vencida && !actividad.nota && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Cambiar entrega
            </button>
          )}
        </div>
      )}

      {editando &&
        (previa ? (
          <p className="mt-4 text-sm text-amber-300/80">
            Vista previa: aquí el estudiante escribe su respuesta, pega un
            enlace o adjunta un archivo.
          </p>
        ) : vencida ? (
          <p className="mt-4 text-sm text-red-400">
            La fecha límite ya pasó; no se puede entregar.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              placeholder="Escribe tu respuesta…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
            />
            <input
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="Enlace (opcional): https://…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5">
                <Paperclip className="size-4" />
                {archivo
                  ? archivo.name
                  : (entrega?.archivoNombre ?? 'Adjuntar archivo')}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={() => void entregar()}
                disabled={enviando}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-50"
              >
                {enviando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {entrega ? 'Actualizar entrega' : 'Entregar'}
              </button>
              {entrega && (
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="text-sm text-white/50 hover:text-white"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
    </article>
  );
}
