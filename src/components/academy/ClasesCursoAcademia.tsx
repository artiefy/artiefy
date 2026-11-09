'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpFromLine,
  ChevronDown,
  Pencil,
  SortAsc,
  Trash2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import ModalFormLessons from '~/components/educators/modals/ModalFormLessons';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  useDatosAcademia,
} from './seccion/comun';

import type { Route } from 'next';

// "Clases del Curso" del detalle de un curso de la academia: el mismo bloque
// del detalle de super-admin de Artiefy (LessonsListEducator): modo
// reordenar, "Crear nueva clase" con el tema visual y la lista desplegable de
// clases, cada una con su página de actividades.

interface Leccion {
  id: number;
  title: string;
  description: string | null;
  orden: number;
  videoUrl: string | null;
  duracionMin: number | null;
  coverImageKey?: string | null;
  coverVideoKey?: string | null;
  resourceKey?: string | null;
  resourceNames?: string | null;
  actividades: number;
}

export function ClasesCursoAcademia({
  slug,
  courseId,
  tema,
}: {
  slug: string;
  courseId: number;
  // Color del "Tema Visual" del curso.
  tema: string;
}) {
  const api = `/api/academia/${slug}/cursos/${courseId}/lecciones`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    lecciones: Leccion[];
  }>(api);
  const [reordenar, setReordenar] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [editando, setEditando] = useState<Leccion | null>();
  const [borrando, setBorrando] = useState<Leccion | null>(null);
  const textoTema = tema === '#FFFFFF' ? 'text-black' : 'text-white';

  const mover = async (index: number, delta: -1 | 1) => {
    if (!data) return;
    const lista = [...data.lecciones];
    const destino = index + delta;
    if (destino < 0 || destino >= lista.length) return;
    [lista[index], lista[destino]] = [lista[destino]!, lista[index]!];
    try {
      await enviar(api, 'PUT', { orden: lista.map((l) => l.id) });
      await mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4">
        <h2 className="mb-4 flex items-center justify-between text-xl font-bold text-white">
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-500/20 p-2 text-blue-300">
              <Video className="size-4" />
            </span>
            Clases del Curso
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--ac-primario)]/30 px-2.5 py-0.5 text-xs font-semibold text-[var(--ac-primario)]">
            {data?.lecciones.length ?? 0} clases
          </span>
        </h2>

        {!data ? (
          <EstadoCarga
            cargando={isLoading}
            error={error}
            sqlPendiente={sqlPendiente}
            script="academy_cursos_detalle.sql"
          />
        ) : (
          <>
            {/* Modo reordenar */}
            <div className="mb-8 flex flex-col gap-3 rounded-lg border border-[var(--ac-borde)] bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <SortAsc className="size-5 text-blue-300" />
                  <span className="text-lg font-semibold text-white">
                    Modo Reordenar Clases
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={reordenar}
                  onClick={() => setReordenar((v) => !v)}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`text-sm ${reordenar ? 'font-bold text-blue-300' : 'text-white/50'}`}
                  >
                    {reordenar ? 'Activado' : 'Desactivado'}
                  </span>
                  <span
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      reordenar ? 'bg-blue-600' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block size-4 rounded-full bg-[#ffffff] shadow transition-transform ${
                        reordenar ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>
              </div>
              <p className="text-sm text-white/50 italic">
                {reordenar
                  ? 'Usa las flechas para cambiar el orden. Se guarda al instante.'
                  : 'Activa el modo reordenar para cambiar el orden de las clases.'}
              </p>
            </div>

            {/* Crear nueva clase */}
            <div className="my-8 flex justify-center">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className={`inline-flex items-center gap-2 rounded-md border border-[var(--ac-primario)]/35 px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:shadow-xl active:scale-95 ${textoTema}`}
                style={{ backgroundColor: tema }}
              >
                <ArrowUpFromLine className="size-5" />
                Crear nueva clase
              </button>
            </div>

            {/* Lista de clases (acordeón) */}
            {data.lecciones.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/50">
                El curso aún no tiene clases.
              </p>
            ) : (
              <div className="space-y-3">
                {data.lecciones.map((l, i) => (
                  <div
                    key={l.id}
                    className="overflow-hidden rounded-lg border border-[var(--ac-borde)] bg-white/[0.03] text-white"
                  >
                    <div className="flex w-full items-center gap-3 p-4 sm:px-6">
                      {reordenar ? (
                        <span className="flex shrink-0 flex-col">
                          <button
                            type="button"
                            onClick={() => void mover(i, -1)}
                            disabled={i === 0}
                            aria-label="Subir"
                            className="text-white/50 hover:text-white disabled:opacity-20"
                          >
                            <ArrowUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void mover(i, 1)}
                            disabled={i === data.lecciones.length - 1}
                            aria-label="Bajar"
                            className="text-white/50 hover:text-white disabled:opacity-20"
                          >
                            <ArrowDown className="size-4" />
                          </button>
                        </span>
                      ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-300">
                          {i + 1}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setAbierta((a) => (a === l.id ? null : l.id))
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <Video className="size-5 shrink-0 text-blue-300" />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {l.title}
                        </span>
                        {l.duracionMin ? (
                          <span className="shrink-0 text-sm text-white/60">
                            ({l.duracionMin} mins)
                          </span>
                        ) : null}
                        <ChevronDown
                          className={`size-4 shrink-0 text-white/50 transition-transform ${
                            abierta === l.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                    {abierta === l.id && (
                      <div className="space-y-3 border-t border-[var(--ac-borde)] p-4 sm:px-6">
                        {l.description && (
                          <p className="text-sm whitespace-pre-line text-white/70">
                            {l.description}
                          </p>
                        )}
                        <p className="text-xs text-white/50">
                          {l.actividades}{' '}
                          {l.actividades === 1 ? 'actividad' : 'actividades'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={
                              `/dashboard/super-admin/cursos/${courseId}/${l.id}` as Route
                            }
                            className={estilos.boton}
                          >
                            Ver clase y actividades
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditando(l)}
                            className={estilos.botonSec}
                          >
                            <Pencil className="size-4" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setBorrando(l)}
                            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="size-4" /> Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {editando !== undefined && (
        <ModalLeccionAcademia
          slug={slug}
          courseId={courseId}
          leccion={editando}
          onClose={() => setEditando(undefined)}
          onSaved={async () => {
            setEditando(undefined);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar clase"
          texto={
            <>
              ¿Eliminar la clase{' '}
              <span className="font-semibold text-white">
                “{borrando.title}”
              </span>
              ? También se borran sus actividades.
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(
                `/api/academia/${slug}/lecciones/${borrando.id}`,
                'DELETE'
              );
              toast.success('Clase eliminada');
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

/** Datos de una clase que usa el modal de crear/editar. */
export interface LeccionEditable {
  id: number;
  title: string;
  description: string | null;
  duracionMin: number | null;
  coverImageKey?: string | null;
  coverVideoKey?: string | null;
  resourceKey?: string | null;
  resourceNames?: string | null;
}

/**
 * Modal de crear/editar una clase: el mismo ModalFormLessons de Artiefy
 * (título, descripción, duración, video, portada, archivos, imágenes y
 * enlaces), guardando en las rutas de la academia.
 */
export function ModalLeccionAcademia({
  slug,
  courseId,
  leccion,
  onClose,
  onSaved,
}: {
  slug: string;
  courseId: number;
  // null: crear una clase nueva.
  leccion: LeccionEditable | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  return (
    <ModalFormLessons
      uploading={false}
      isOpen
      onCloseAction={onClose}
      courseId={courseId}
      academiaSlug={slug}
      isEditing={leccion !== null}
      editingLesson={
        leccion
          ? {
              id: leccion.id,
              title: leccion.title,
              description: leccion.description ?? '',
              duration: leccion.duracionMin ?? 0,
              coverImageKey: leccion.coverImageKey ?? undefined,
              coverVideoKey: leccion.coverVideoKey ?? undefined,
              resourceKey: leccion.resourceKey ?? undefined,
              resourceName: leccion.resourceNames ?? undefined,
            }
          : undefined
      }
      onUpdateSuccess={() => void onSaved()}
    />
  );
}
