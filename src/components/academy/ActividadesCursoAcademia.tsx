'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  type ActividadAcademia,
  ModalActividadAcademia,
} from './ModalActividadAcademia';

import type { Route } from 'next';

// Pestaña "Actividades" del detalle de un curso de la academia, igual a la de
// Artiefy: "Actividades del curso" con "Crear actividad", agrupadas por clase
// (número, título y cuántas tiene) y, en cada una, sus etiquetas
// (Calificable / No calificable, peso en el parámetro, fecha de entrega) con
// "Ver" y "Editar".

export interface ActividadCurso extends ActividadAcademia {
  lessonId: number;
  leccion: string;
  orden: number;
}

export function ActividadesCursoAcademia({
  slug,
  courseId,
  actividades,
  cargando,
  onCambio,
}: {
  slug: string;
  courseId: number;
  actividades: ActividadCurso[];
  cargando: boolean;
  onCambio: () => Promise<unknown>;
}) {
  // undefined: cerrado; null: crear; actividad: editar.
  const [editando, setEditando] = useState<ActividadCurso | null>();

  const grupos = Object.values(
    actividades.reduce<Record<number, ActividadCurso[]>>((acc, a) => {
      (acc[a.lessonId] ??= []).push(a);
      return acc;
    }, {})
  ).sort((a, b) => a[0]!.orden - b[0]!.orden);

  const cerrar = () => setEditando(undefined);

  return (
    <div className="duration-500 animate-in fade-in">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white">Actividades del curso</h2>
        <button
          type="button"
          onClick={() => setEditando(null)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--ac-primario)] bg-[var(--ac-primario)]/15 px-4 py-2 text-sm font-semibold text-[var(--ac-primario)] transition hover:bg-[var(--ac-primario)]/25"
        >
          <span>＋</span>
          Crear actividad
        </button>
      </div>

      {cargando ? (
        <div className="flex items-center gap-3 text-white/60">
          <div className="size-5 animate-spin rounded-full border-2 border-[var(--ac-primario)] border-t-transparent" />
          Cargando actividades...
        </div>
      ) : grupos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-[var(--ac-superficie)]/30 p-8 text-center">
          <p className="text-white/60">
            No hay actividades registradas en este curso.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((acts) => {
            const primera = acts[0]!;
            return (
              <div
                key={primera.lessonId}
                className="rounded-2xl border border-[var(--ac-primario)]/30 bg-[var(--ac-superficie)]/60 p-5 shadow-md"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[var(--ac-primario)]/30 text-sm font-bold text-[var(--ac-primario)]">
                    {primera.orden}
                  </span>
                  <h3 className="text-lg font-semibold text-white">
                    {primera.leccion}
                  </h3>
                  <span className="ml-auto text-xs text-[#94A3B8]">
                    {acts.length} actividad{acts.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <ul className="space-y-3">
                  {acts.map((act) => (
                    <li
                      key={act.id}
                      className="flex flex-col gap-3 rounded-xl border border-[var(--ac-primario)]/20 bg-[var(--ac-superficie)]/50 p-4 transition-colors hover:border-[var(--ac-primario)]/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">
                            {act.title}
                          </span>
                          {act.calificable && act.parametroId ? (
                            <span className="rounded-full bg-green-500/30 px-2 py-0.5 text-xs font-semibold text-green-300">
                              Calificable
                            </span>
                          ) : (
                            <span className="rounded-full bg-[var(--ac-superficie)]/40 px-2 py-0.5 text-xs text-[#94A3B8]">
                              No calificable
                            </span>
                          )}
                          {act.calificable &&
                            act.porcentaje != null &&
                            act.porcentaje > 0 && (
                              <span className="rounded-full bg-[var(--ac-primario)]/30 px-2 py-0.5 text-xs text-[var(--ac-primario)]">
                                {act.porcentaje}%
                              </span>
                            )}
                          {act.fechaLimite && (
                            <span className="rounded-full bg-yellow-500/30 px-2 py-0.5 text-xs text-yellow-300">
                              📅{' '}
                              {new Date(act.fechaLimite).toLocaleDateString(
                                'es-CO',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          )}
                        </div>
                        {act.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-[#94A3B8]">
                            {act.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={
                            `/dashboard/super-admin/cursos/${courseId}/${act.lessonId}` as Route
                          }
                          className="rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-superficie)] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-80"
                        >
                          👁 Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditando(act)}
                          className="rounded-lg border border-[var(--ac-primario)] bg-[var(--ac-primario)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--ac-primario)] transition hover:bg-[var(--ac-primario)] hover:text-[var(--ac-primario-texto)]"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {editando !== undefined && (
        <ModalActividadAcademia
          slug={slug}
          courseId={courseId}
          actividad={editando}
          onClose={cerrar}
          onSaved={async () => {
            cerrar();
            await onCambio();
          }}
        />
      )}
    </div>
  );
}
