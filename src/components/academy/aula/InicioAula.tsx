import Link from 'next/link';

import {
  BookOpen,
  Eye,
  GraduationCap,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

import { type InicioEstudiante } from '~/server/academy/aula';

import type { Route } from 'next';

// Inicio del estudiante de una academia, con el diseño de /estudiantes de
// Artiefy: bienvenida, "Seguir viendo" (sus cursos con progreso y la clase
// para continuar) y los demás cursos de la academia.

const s3 = (key: string | null) =>
  key ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}` : null;

function Portada({ src, alt }: { src: string | null; alt: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="size-full object-cover" />
  ) : (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-background">
      <BookOpen className="size-10 text-primary/60" />
    </div>
  );
}

export function InicioAula({
  nombre,
  academia,
  datos,
}: {
  nombre: string;
  academia: string;
  datos: InicioEstudiante;
}) {
  const { misCursos, catalogo } = datos;
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      {/* Bienvenida */}
      <section className="relative overflow-hidden py-14 text-center sm:py-20">
        <div className="pointer-events-none absolute top-0 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <p className="relative text-sm font-semibold tracking-widest text-primary uppercase">
          {academia}
        </p>
        <h1 className="relative mt-3 text-3xl font-bold text-white sm:text-5xl">
          Hola, {nombre} 👋
        </h1>
        <p className="relative mx-auto mt-4 max-w-xl text-white/60">
          {misCursos.length > 0
            ? 'Continúa donde lo dejaste y sigue aprendiendo.'
            : 'Aún no estás matriculado en ningún curso. Explora los cursos de la academia.'}
        </p>
      </section>

      {/* Seguir viendo */}
      <section id="mis-cursos" className="scroll-mt-24">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-primary sm:text-3xl">
            <Eye className="size-7" /> Seguir viendo
          </h2>
          <span className="text-sm text-white/50">
            {misCursos.length} {misCursos.length === 1 ? 'curso' : 'cursos'}
          </span>
        </div>
        {misCursos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-white/50">
            Cuando te matriculen en un curso aparecerá aquí.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {misCursos.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/student/cursos/${c.id}` as Route}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_30px_-8px] hover:shadow-primary/50"
              >
                <div className="relative aspect-video">
                  <Portada src={s3(c.coverImageKey)} alt={c.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  {c.continuar && (
                    <span className="absolute top-3 right-3 max-w-[75%] rounded-lg bg-primary px-3 py-1.5 text-left text-[11px] leading-tight font-semibold text-[var(--ac-primario-texto)] shadow-lg">
                      Continuar:
                      <span className="block truncate font-normal">
                        {c.continuar.title}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex grow flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 font-bold text-white group-hover:text-primary">
                    {c.title}
                  </h3>
                  <p className="text-xs text-white/50">
                    {c.categoryName ?? c.instructorName ?? ''}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${c.porcentaje}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white/70">
                      {c.porcentaje}%
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40">
                    {c.clasesCompletadas} de {c.totalClases} clases
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Catálogo */}
      {catalogo.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-primary sm:text-3xl">
            <Sparkles className="size-7" /> Cursos de la academia
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalogo.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/student/cursos/${c.id}` as Route}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 transition duration-300 hover:-translate-y-1 hover:border-primary/50"
              >
                <div className="relative aspect-video">
                  <Portada src={s3(c.coverImageKey)} alt={c.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    {c.categoryName && (
                      <span className="mb-2 inline-block rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        {c.categoryName}
                      </span>
                    )}
                    <h3 className="line-clamp-2 font-bold text-white">
                      {c.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                      <GraduationCap className="size-3.5" />
                      {c.instructorName ?? 'Sin educador asignado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="line-clamp-1 text-white/50">
                    {c.subtitle ?? c.description ?? ''}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
                    <PlayCircle className="size-4" /> Ver
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
