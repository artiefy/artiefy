import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { type CursoDetalle } from '~/server/academy/cursos';

import type { Route } from 'next';

// Detalle de un curso de la academia, con el lenguaje visual del detalle de
// curso de Artiefy (migas, tarjeta principal, portada y ficha a la derecha) y
// los colores del tema. Se usa en los paneles de super-admin, educador y
// estudiante; `volver` es la ruta de la lista de cada uno.

const chip =
  'rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary';

export function DetalleCursoAcademia({
  curso,
  volver,
  etiquetaVolver,
}: {
  curso: CursoDetalle;
  volver: string;
  etiquetaVolver: string;
}) {
  const portada = curso.coverImageKey
    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${curso.coverImageKey}`
    : null;
  const ficha: [string, string | null][] = [
    ['Educador', curso.instructorName ?? 'Sin instructor asignado'],
    ['Nivel', curso.nivel],
    ['Modalidad', curso.modalidad],
    ['Horario', curso.horario],
    ['Espacio', curso.espacio],
    ['Certificación', curso.certificacion],
    [
      'Precio',
      curso.individualPrice != null
        ? `$${curso.individualPrice.toLocaleString('es-CO')}`
        : null,
    ],
  ];

  return (
    <div className="space-y-6 p-1 sm:p-2">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={volver as Route}
          className="inline-flex items-center gap-1 text-primary hover:opacity-80"
        >
          <ArrowLeft className="size-4" /> {etiquetaVolver}
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white/60">Detalles</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-8 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {curso.categoria && (
                <span className={chip}>{curso.categoria}</span>
              )}
              {!curso.visibility && (
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                  Oculto
                </span>
              )}
              {!curso.isActive && (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                  Inactivo
                </span>
              )}
            </div>
            <h1 className="text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl">
              {curso.title}
            </h1>
            {curso.subtitle && (
              <p className="text-lg text-white/80">{curso.subtitle}</p>
            )}
            {curso.description && (
              <p className="max-w-2xl text-base whitespace-pre-line text-[#94A3B8]">
                {curso.description}
              </p>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-border p-6 text-center text-sm text-[#94A3B8]">
            Las clases y actividades del curso aparecerán aquí.
          </div>
        </section>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portada}
                alt={curso.title}
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/20 to-card text-4xl">
                📚
              </div>
            )}
            <dl className="divide-y divide-border">
              {ficha
                .filter(([, valor]) => valor)
                .map(([etiqueta, valor]) => (
                  <div
                    key={etiqueta}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <dt className="text-[#94A3B8]">{etiqueta}</dt>
                    <dd className="text-right font-medium text-white">
                      {valor}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
