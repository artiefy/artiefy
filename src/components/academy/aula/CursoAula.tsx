'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Clock,
  GraduationCap,
  Home,
  Layers,
  Lock,
  MapPin,
  Navigation,
  Signal,
  Star,
  Video,
} from 'lucide-react';

import { cn } from '~/lib/utils';
import { type CursoEstudiante } from '~/server/academy/aula';

import type { Route } from 'next';

// Detalle del curso para el estudiante de una academia, con el diseño del
// detalle de curso de Artiefy: migas, tarjeta principal con chips, pestañas
// (Curso, Clases en vivo, Calificaciones), clases desbloqueadas en orden y la
// tarjeta lateral con portada, progreso y "Continuar".

type Pestana = 'curso' | 'vivo' | 'notas';

const chip =
  'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80';

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export function CursoAula({ datos }: { datos: CursoEstudiante }) {
  const { curso, matriculado, clases, porcentaje, continuar, enVivo, notas } =
    datos;
  const [pestana, setPestana] = useState<Pestana>('curso');
  const [abierta, setAbierta] = useState<number | null>(continuar?.id ?? null);
  const portada = curso.coverImageKey
    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${curso.coverImageKey}`
    : null;
  const minutos = clases.reduce((s, c) => s + (c.duracionMin ?? 0), 0);
  const urlClase = (id: number) =>
    `/dashboard/student/cursos/${curso.id}/clases/${id}` as Route;

  const pestanas: { id: Pestana; label: string; icon: typeof BookOpen }[] = [
    { id: 'curso', label: 'Curso', icon: BookOpen },
    ...(matriculado
      ? ([
          { id: 'vivo', label: 'Clases en vivo', icon: Video },
          { id: 'notas', label: 'Calificaciones', icon: ClipboardList },
        ] as const)
      : []),
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-white/60">
        <Link
          href={'/dashboard/student' as Route}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Home className="size-4" /> Inicio
        </Link>
        <ChevronRight className="size-4 text-white/30" />
        <Link
          href={'/dashboard/student#mis-cursos' as Route}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <BookOpen className="size-4" /> Cursos
        </Link>
        <ChevronRight className="size-4 text-white/30" />
        <span className="truncate font-semibold text-white">{curso.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Tarjeta principal */}
        <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-8 lg:col-span-2">
          <span className="rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
            Curso
          </span>
          <h1 className="mt-4 text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
            {curso.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className={chip}>
              <BookOpen className="size-3.5" /> {clases.length} clases
            </span>
            {minutos > 0 && (
              <span className={chip}>
                <Clock className="size-3.5" />{' '}
                {minutos >= 60
                  ? `${Math.round(minutos / 60)}h contenido`
                  : `${minutos} min contenido`}
              </span>
            )}
            {curso.categoria && (
              <span className={chip}>
                <Layers className="size-3.5" /> {curso.categoria}
              </span>
            )}
            {curso.rating > 0 && (
              <span className={chip}>
                <Star className="size-3.5 text-yellow-400" />{' '}
                {curso.rating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {curso.nivel && (
              <span className={chip}>
                <Signal className="size-3.5" /> {curso.nivel}
              </span>
            )}
            {curso.modalidad && (
              <span className={chip}>
                <GraduationCap className="size-3.5" /> {curso.modalidad}
              </span>
            )}
            <span className={chip}>
              <GraduationCap className="size-3.5" /> Educador:{' '}
              {curso.instructorName ?? 'Sin asignar'}
            </span>
            {curso.horario && (
              <span className={chip}>
                <CalendarDays className="size-3.5" /> {curso.horario}
              </span>
            )}
            {curso.espacio && (
              <span className={chip}>
                <MapPin className="size-3.5" /> {curso.espacio}
              </span>
            )}
          </div>
          {(curso.subtitle ?? curso.description) && (
            <p className="mt-6 max-w-3xl text-base whitespace-pre-line text-white/60 sm:text-lg">
              {curso.description ?? curso.subtitle}
            </p>
          )}

          {/* Pestañas */}
          <div className="mt-8 flex gap-1 overflow-x-auto border-b border-white/10">
            {pestanas.map(({ id, label, icon: Icono }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPestana(id)}
                className={cn(
                  'relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  pestana === id
                    ? 'text-white'
                    : 'text-white/50 hover:text-white'
                )}
              >
                <Icono className="size-4" /> {label}
                {pestana === id && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {pestana === 'curso' && (
              <div className="rounded-2xl border border-border bg-background/40 p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <BookOpen className="size-5 text-primary" /> Clases del
                    Curso
                  </h2>
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {clases.length} clases
                  </span>
                </div>
                {clases.length === 0 ? (
                  <p className="py-6 text-center text-sm text-white/50">
                    Este curso aún no tiene clases.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clases.map((c) => {
                      const abiertaAhora =
                        matriculado && c.desbloqueada && abierta === c.id;
                      return (
                        <div
                          key={c.id}
                          className={cn(
                            'overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] text-white transition-colors',
                            matriculado && c.desbloqueada
                              ? 'hover:border-primary/40'
                              : 'opacity-75'
                          )}
                        >
                          <button
                            type="button"
                            disabled={!matriculado || !c.desbloqueada}
                            onClick={() =>
                              setAbierta(abierta === c.id ? null : c.id)
                            }
                            className="flex w-full items-center gap-3 p-4 text-left sm:px-6"
                          >
                            {!matriculado || !c.desbloqueada ? (
                              <Lock className="size-5 shrink-0 text-white/40" />
                            ) : c.completada ? (
                              <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                            ) : (
                              <Clock className="size-5 shrink-0 text-white/40" />
                            )}
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {c.title}
                            </span>
                            {c.duracionMin ? (
                              <span className="shrink-0 text-sm text-white/50">
                                ({c.duracionMin} mins)
                              </span>
                            ) : null}
                            {matriculado &&
                              c.desbloqueada &&
                              (abiertaAhora ? (
                                <ChevronUp className="size-4 text-white/40" />
                              ) : (
                                <ChevronDown className="size-4 text-white/40" />
                              ))}
                          </button>
                          {abiertaAhora && (
                            <div className="border-t border-white/10 px-6 py-4">
                              <p className="mb-4 line-clamp-3 text-sm whitespace-pre-wrap text-white/60">
                                {c.description ??
                                  'No hay descripción disponible para esta clase.'}
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${c.progreso}%` }}
                                  />
                                </div>
                                <span className="text-xs text-white/50">
                                  {c.progreso}%
                                </span>
                                <Link
                                  href={urlClase(c.id)}
                                  className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-[var(--ac-primario-texto)]"
                                >
                                  <Navigation className="size-4 -rotate-[25deg] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                  Ver Clase
                                </Link>
                              </div>
                              {c.actividades > 0 && (
                                <p className="mt-3 text-xs text-white/40">
                                  {c.actividades}{' '}
                                  {c.actividades === 1
                                    ? 'actividad'
                                    : 'actividades'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {pestana === 'vivo' && (
              <div className="space-y-3">
                {enVivo.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-white/50">
                    No hay clases en vivo programadas.
                  </p>
                ) : (
                  enVivo.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4',
                        s.pasada && 'opacity-60'
                      )}
                    >
                      <Video className="size-5 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{s.titulo}</p>
                        <p className="text-sm text-white/50">
                          {fecha(s.inicio)}
                        </p>
                      </div>
                      {s.enlace && !s.pasada && (
                        <a
                          href={s.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)]"
                        >
                          Unirse
                        </a>
                      )}
                      {s.pasada && (
                        <span className="text-xs text-white/40">
                          Finalizada
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {pestana === 'notas' && (
              <div className="overflow-x-auto rounded-2xl border border-border">
                {notas.length === 0 ? (
                  <p className="p-8 text-center text-sm text-white/50">
                    Este curso aún no tiene actividades.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-left text-xs text-white/50 uppercase">
                      <tr>
                        <th className="px-4 py-3">Clase</th>
                        <th className="px-4 py-3">Actividad</th>
                        <th className="px-4 py-3 text-right">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notas.map((n) => (
                        <tr
                          key={n.actividadId}
                          className="border-t border-white/5"
                        >
                          <td className="px-4 py-3 text-white/60">{n.clase}</td>
                          <td className="px-4 py-3 text-white">
                            {n.actividad}
                            {n.comentario && (
                              <p className="mt-1 text-xs text-white/40">
                                {n.comentario}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {n.nota != null ? (
                              <span className="text-primary">
                                {n.nota}/{n.puntaje}
                              </span>
                            ) : (
                              <span className="text-white/30">Sin nota</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Tarjeta lateral */}
        <aside className="overflow-hidden rounded-2xl border border-border bg-card/40 lg:sticky lg:top-24">
          <div className="aspect-video">
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portada}
                alt={curso.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-background">
                <BookOpen className="size-12 text-primary/60" />
              </div>
            )}
          </div>
          <div className="space-y-4 p-5">
            {matriculado ? (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-white/60">Tu progreso</span>
                    <span className="font-semibold text-primary">
                      {porcentaje}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    {datos.clasesCompletadas} de {clases.length} clases
                    completadas
                  </p>
                </div>
                {continuar ? (
                  <Link
                    href={urlClase(continuar.id)}
                    className="block w-full rounded-full bg-primary py-3 text-center font-semibold text-[var(--ac-primario-texto)] transition hover:opacity-90"
                  >
                    {datos.clasesCompletadas === 0
                      ? 'Empezar ahora'
                      : 'Continuar'}
                  </Link>
                ) : clases.length > 0 ? (
                  <p className="rounded-full bg-green-500/15 py-3 text-center font-semibold text-green-400">
                    ¡Curso completado! 🎉
                  </p>
                ) : null}
              </>
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
                No estás matriculado en este curso. Pide a la academia que te
                matricule para ver sus clases.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
