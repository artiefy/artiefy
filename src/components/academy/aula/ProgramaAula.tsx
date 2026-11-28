import Link from 'next/link';

import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Home,
  Lock,
  PanelsTopLeft,
} from 'lucide-react';

import { type ProgramaEstudiante } from '~/server/academy/aula';

import type { Route } from 'next';

// Detalle de un programa para el estudiante de una academia (como
// /estudiantes/programas/[id] de Artiefy): encabezado con chips, los cursos
// del programa con el avance en cada uno y la tarjeta lateral con portada y
// avance general.

const chip =
  'inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80';

const s3 = (key: string | null) =>
  key ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}` : null;

export function ProgramaAula({ datos }: { datos: ProgramaEstudiante }) {
  const portada = s3(datos.coverImageKey);
  const siguiente = datos.cursos.find(
    (c) => c.matriculado && c.porcentaje < 100
  );
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={'/dashboard/student' as Route}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Home className="size-4" /> Inicio
        </Link>
        <ChevronRight className="size-4 opacity-50" />
        <span className="inline-flex items-center gap-1">
          <PanelsTopLeft className="size-4" /> Programas
        </span>
        <ChevronRight className="size-4 opacity-50" />
        <span className="truncate font-semibold text-foreground">
          {datos.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-8 lg:col-span-2">
          <span className="rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
            Programa
          </span>
          <h1 className="mt-4 text-3xl leading-tight font-bold text-foreground md:text-4xl lg:text-5xl">
            {datos.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className={chip}>
              <BookOpen className="size-3.5" /> {datos.cursos.length} cursos
            </span>
            {datos.horas > 0 && (
              <span className={chip}>
                <Clock className="size-3.5" /> {datos.horas}h contenido
              </span>
            )}
          </div>
          {datos.description && (
            <p className="mt-6 max-w-3xl text-base whitespace-pre-line text-muted-foreground sm:text-lg">
              {datos.description}
            </p>
          )}

          <div className="mt-8 rounded-2xl border border-border bg-background/40 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <GraduationCap className="size-5 text-primary" /> Cursos del
                Programa
              </h2>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {datos.cursos.length} cursos
              </span>
            </div>
            {datos.cursos.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Este programa aún no tiene cursos.
              </p>
            ) : (
              <div className="space-y-3">
                {datos.cursos.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/student/cursos/${c.id}` as Route}
                    className="group flex items-center gap-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="relative hidden aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-card sm:block">
                      {s3(c.coverImageKey) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s3(c.coverImageKey) ?? ''}
                          alt={c.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-primary/10">
                          <BookOpen className="size-6 text-primary/60" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">
                        Curso {i + 1}
                        {c.minutos > 0 ? ` · ${c.minutos} min` : ''}
                      </p>
                      <p className="truncate font-semibold text-foreground group-hover:text-primary">
                        {c.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.instructorName ?? 'Educador'}
                      </p>
                      {c.matriculado && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${c.porcentaje}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {c.porcentaje}%
                          </span>
                        </div>
                      )}
                    </div>
                    {!c.matriculado ? (
                      <Lock className="size-5 shrink-0 text-muted-foreground" />
                    ) : c.porcentaje >= 100 ? (
                      <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                    ) : (
                      <ChevronRight className="size-5 shrink-0 text-primary" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="overflow-hidden rounded-2xl border border-border bg-card/40 lg:sticky lg:top-24">
          <div className="aspect-video">
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portada}
                alt={datos.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-background">
                <PanelsTopLeft className="size-12 text-primary/60" />
              </div>
            )}
          </div>
          <div className="space-y-4 p-5">
            {datos.matriculado ? (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Avance del programa
                    </span>
                    <span className="font-semibold text-primary">
                      {datos.porcentaje}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${datos.porcentaje}%` }}
                    />
                  </div>
                </div>
                {siguiente ? (
                  <Link
                    href={`/dashboard/student/cursos/${siguiente.id}` as Route}
                    className="block w-full rounded-full bg-primary py-3 text-center font-semibold text-[var(--ac-primario-texto)] transition hover:opacity-90"
                  >
                    Continuar con {siguiente.title}
                  </Link>
                ) : (
                  <p className="rounded-full bg-green-500/15 py-3 text-center font-semibold text-green-500">
                    ¡Programa completado! 🎉
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-center text-sm text-muted-foreground">
                Aún no estás matriculado en los cursos de este programa. Pide a
                la academia que te matricule.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
