'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  fmtFechaHora,
  useDatosAcademia,
} from './seccion/comun';
import { ModalLeccionAcademia } from './ClasesCursoAcademia';
import {
  type ActividadAcademia,
  ModalActividadAcademia,
} from './ModalActividadAcademia';

import type { Route } from 'next';

// Página de una clase de un curso de la academia (como la página de clase del
// super-admin de Artiefy): datos y video de la clase y sus actividades
// (crear, editar y eliminar).

type Actividad = ActividadAcademia;

interface Leccion {
  id: number;
  courseId: number;
  curso: string;
  title: string;
  description: string | null;
  orden: number;
  videoUrl: string | null;
  duracionMin: number | null;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  resourceKey: string | null;
  resourceNames: string | null;
  categoria: string | null;
  modalidad: string | null;
  educador: string | null;
  actividades: Actividad[];
}

const TIPOS: Record<Actividad['tipo'], { label: string; className: string }> = {
  tarea: { label: 'Tarea', className: 'bg-blue-500/10 text-blue-400' },
  quiz: { label: 'Quiz', className: 'bg-yellow-500/10 text-yellow-400' },
  proyecto: {
    label: 'Proyecto',
    className: 'bg-purple-500/10 text-purple-400',
  },
};

/** URL embebible de YouTube/Vimeo, o null si el enlace no lo es. */
function embebido(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function DetalleClaseAcademia({
  slug,
  lessonId,
}: {
  slug: string;
  lessonId: number;
}) {
  const router = useRouter();
  const api = `/api/academia/${slug}/lecciones/${lessonId}`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    leccion: Leccion;
  }>(api);
  const [editandoClase, setEditandoClase] = useState(false);
  const [borrandoClase, setBorrandoClase] = useState(false);
  const [actividad, setActividad] = useState<Actividad | null>();
  const [borrando, setBorrando] = useState<Actividad | null>(null);

  if (!data) {
    return (
      <EstadoCarga
        cargando={isLoading}
        error={error}
        sqlPendiente={sqlPendiente}
        script="academy_cursos_detalle.sql"
      />
    );
  }

  const l = data.leccion;
  const video = l.videoUrl ? embebido(l.videoUrl) : null;
  const volverCurso = `/dashboard/super-admin/cursos/${l.courseId}` as Route;
  // Como Artiefy: si hay video subido ('none' = sin video) se muestra; si no,
  // el enlace de video (YouTube/Vimeo) y, si tampoco, la portada.
  const s3 = process.env.NEXT_PUBLIC_AWS_S3_URL;
  const videoSubido =
    l.coverVideoKey && l.coverVideoKey !== 'none'
      ? `${s3}/${l.coverVideoKey}`
      : null;
  const media = (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4 sm:p-6">
      {videoSubido ? (
        <video
          className="aspect-video h-auto w-full rounded-lg object-cover"
          controls
          aria-label={`Video de ${l.title}`}
        >
          <source src={videoSubido} type="video/mp4" />
          Tu navegador no soporta la reproducción de videos.
        </video>
      ) : video ? (
        <iframe
          src={video}
          title={l.title}
          className="aspect-video w-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : l.coverImageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${s3}/${l.coverImageKey}`}
          alt={l.title}
          className="mx-auto h-auto w-full rounded-lg object-contain"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-[var(--ac-fondo)] text-4xl">
          📚
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEditandoClase(true)}
          className="w-full rounded-md border border-yellow-500 bg-yellow-500 px-2 py-1.5 text-xs text-white hover:bg-yellow-600"
        >
          Editar clase
        </button>
        <button
          type="button"
          onClick={() => setBorrandoClase(true)}
          className="w-full rounded-md border border-red-600 bg-red-600 px-2 py-1.5 text-xs text-white hover:bg-red-700"
        >
          Eliminar clase
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/dashboard/super-admin"
          className="text-[var(--ac-primario)] hover:opacity-80"
        >
          Inicio
        </Link>
        <ChevronRight className="size-4 text-white/40" />
        <Link
          href="/dashboard/super-admin/cursos"
          className="text-[var(--ac-primario)] hover:opacity-80"
        >
          Cursos
        </Link>
        <ChevronRight className="size-4 text-white/40" />
        <Link
          href={volverCurso}
          className="max-w-[16rem] truncate text-[var(--ac-primario)] hover:opacity-80"
        >
          {l.curso}
        </Link>
        <ChevronRight className="size-4 text-white/40" />
        <span className="text-white/60">Clase {l.orden}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4 shadow-2xl sm:p-8">
            <h1 className="text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl">
              Clase: {l.title}
            </h1>
            {l.description && (
              <p className="mt-4 max-w-2xl text-base whitespace-pre-line text-[#94A3B8]">
                {l.description}
              </p>
            )}
            {l.duracionMin ? (
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/60">
                <Clock className="size-4" /> {l.duracionMin} minutos
              </p>
            ) : null}
            <div className="mt-6 lg:hidden">{media}</div>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-6">{media}</div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4 shadow-2xl sm:p-8">
        <RecursosClase
          claves={l.resourceKey}
          nombres={l.resourceNames}
          videoUrl={l.videoUrl}
        />
        <div className="mt-6 pb-4 text-white sm:mt-8 sm:pb-6">
          <h2 className="mb-6 text-xl font-bold sm:text-2xl">
            📋 Información de la clase
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(
              [
                ['📂 Categoría', l.categoria],
                ['👨‍🏫 Educador', l.educador],
                ['🎓 Modalidad', l.modalidad],
              ] as const
            ).map(([titulo, valor]) => (
              <div key={titulo} className="space-y-2">
                <h3 className="text-xs font-bold tracking-wider text-[var(--ac-primario)] uppercase md:text-sm">
                  {titulo}
                </h3>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--ac-primario)]/40 px-3 py-1.5 text-xs font-medium text-white sm:text-sm">
                  {valor ?? 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex w-full justify-center px-2 sm:mt-8">
          <button
            type="button"
            onClick={() => setActividad(null)}
            className="w-full cursor-pointer justify-center rounded-lg border-transparent bg-green-400 px-4 py-2 text-center text-sm text-white transition duration-300 hover:bg-green-500 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
          >
            ➕Crear actividad
          </button>
        </div>
      </div>

      {/* Actividades */}
      <section className="rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-xl font-bold text-white">
            <span className="inline-flex items-center justify-center rounded-full bg-[var(--ac-primario)]/20 p-2 text-[var(--ac-primario)]">
              <ClipboardList className="size-4" />
            </span>
            Actividades
          </h2>
          <button
            type="button"
            onClick={() => setActividad(null)}
            className={estilos.boton}
          >
            <Plus className="size-4" /> Crear actividad
          </button>
        </div>
        {l.actividades.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/50">
            Esta clase aún no tiene actividades.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {l.actividades.map((a) => (
              <article
                key={a.id}
                className="flex flex-col gap-2 rounded-lg border border-[var(--ac-borde)] bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TIPOS[a.tipo].className}`}
                  >
                    {TIPOS[a.tipo].label}
                  </span>
                  <span className="text-xs text-white/50">{a.puntaje} pts</span>
                </div>
                <h3 className="font-semibold text-white">{a.title}</h3>
                {a.description && (
                  <p className="line-clamp-3 text-sm text-white/60">
                    {a.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--ac-borde)] pt-2">
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <CalendarDays className="size-3.5" />
                    {a.fechaLimite
                      ? `Entrega ${fmtFechaHora(a.fechaLimite)}`
                      : 'Sin fecha límite'}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setActividad(a)}
                      aria-label={`Editar ${a.title}`}
                      className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBorrando(a)}
                      aria-label={`Eliminar ${a.title}`}
                      className="rounded-md p-1 text-white/60 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editandoClase && (
        <ModalLeccionAcademia
          slug={slug}
          courseId={l.courseId}
          leccion={l}
          onClose={() => setEditandoClase(false)}
          onSaved={async () => {
            setEditandoClase(false);
            await mutate();
          }}
        />
      )}
      {borrandoClase && (
        <ConfirmarEliminar
          titulo="Eliminar clase"
          texto={
            <>
              ¿Eliminar la clase{' '}
              <span className="font-semibold text-white">“{l.title}”</span>?
              También se borran sus actividades.
            </>
          }
          onClose={() => setBorrandoClase(false)}
          onConfirmar={async () => {
            try {
              await enviar(api, 'DELETE');
              toast.success('Clase eliminada');
              router.push(volverCurso);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}
      {actividad !== undefined && (
        <ModalActividadAcademia
          slug={slug}
          courseId={l.courseId}
          actividad={actividad ? { ...actividad, lessonId: l.id } : null}
          leccionInicial={l.id}
          onClose={() => setActividad(undefined)}
          onSaved={async () => {
            setActividad(undefined);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar actividad"
          texto={
            <>
              ¿Eliminar la actividad{' '}
              <span className="font-semibold text-white">
                “{borrando.title}”
              </span>
              ?
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(
                `/api/academia/${slug}/actividades/${borrando.id}`,
                'DELETE'
              );
              toast.success('Actividad eliminada');
              setBorrando(null);
              await mutate();
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Archivos, imágenes y enlaces de la clase (como ViewFiles de Artiefy). Los
 * recursos se guardan separados por comas; los que empiezan por http son
 * enlaces y el resto, archivos en S3.
 */
function RecursosClase({
  claves,
  nombres,
  videoUrl,
}: {
  claves: string | null;
  nombres: string | null;
  videoUrl: string | null;
}) {
  const lista = (claves ?? '').split(',').filter(Boolean);
  const titulos = (nombres ?? '').split(',');
  const recursos = [
    ...lista.map((clave, i) => ({
      url: clave.startsWith('http')
        ? clave
        : `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${clave}`,
      nombre: titulos[i] ?? clave.split('/').pop() ?? clave,
      enlace: clave.startsWith('http'),
    })),
    ...(videoUrl ? [{ url: videoUrl, nombre: videoUrl, enlace: true }] : []),
  ];
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl">
        📎 Recursos de la clase
      </h2>
      {recursos.length === 0 ? (
        <p className="text-sm text-white/50">
          Esta clase no tiene archivos ni enlaces.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {recursos.map((r) => (
            <li key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[var(--ac-primario)]/30 bg-[var(--ac-fondo)]/60 p-3 text-sm text-white transition hover:border-[var(--ac-primario)]"
              >
                <span className="text-xl">{r.enlace ? '🔗' : '📄'}</span>
                <span className="truncate">{r.nombre}</span>
                <ExternalLink className="ml-auto size-4 shrink-0 text-[var(--ac-primario)]" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
