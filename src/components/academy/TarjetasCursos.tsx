import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import type { Route } from 'next';

// Grilla de cursos (estilo de las tarjetas de cursos de Artiefy, con los
// colores del tema) para los paneles de educador y estudiante.

export interface TarjetaCurso {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  categoryName: string | null;
  instructorName: string | null;
}

export function TarjetasCursos({
  cursos,
  hrefBase,
  vacio,
}: {
  cursos: TarjetaCurso[];
  hrefBase: string;
  vacio: string;
}) {
  if (cursos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-[#94A3B8]">
        {vacio}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cursos.map((c) => (
        <Link
          key={c.id}
          href={`${hrefBase}/${c.id}` as Route}
          className="group relative block"
        >
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary via-primary/60 to-background opacity-0 blur transition duration-500 group-hover:opacity-100" />
          <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-white transition-transform duration-300 group-hover:scale-[1.02]">
            <div className="relative aspect-video bg-background">
              {c.coverImageKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${c.coverImageKey}`}
                  alt={c.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-card text-4xl">
                  📚
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="flex grow flex-col gap-3 p-4">
              {c.categoryName && (
                <span className="w-fit rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {c.categoryName}
                </span>
              )}
              <h3 className="line-clamp-2 text-base font-bold sm:text-lg">
                {c.title}
              </h3>
              <p className="line-clamp-2 text-sm text-[#94A3B8]">
                {c.description ?? 'Sin descripción'}
              </p>
              <div className="mt-auto flex items-center justify-between pt-2 text-xs">
                <span className="text-[#94A3B8] italic">
                  {c.instructorName ?? 'Sin instructor asignado'}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  Ver <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
