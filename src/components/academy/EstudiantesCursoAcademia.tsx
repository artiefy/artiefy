'use client';

import { useState } from 'react';

import { Loader2, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  fmtFecha,
  Modal,
  useDatosAcademia,
  useEstudiantesAcademia,
} from './seccion/comun';
import { SelectorCuentas } from './seccion/GruposAcademia';

// Pestaña "Estudiantes" del detalle de un curso de la academia: la misma de
// Artiefy (DashboardEstudiantes): "Estadísticas de Estudiantes", pestañas
// Estudiantes Actuales / calificación al 100%, buscador, "Marcar como
// completos" / "Desmatricular seleccionados" y la tabla con las notas por
// actividad (cabecera combinada por clase), con los colores de la marca.

interface Actividad {
  id: number;
  title: string;
  puntaje: number;
  leccion: string;
  orden: number;
}

interface Estudiante {
  userId: string;
  name: string | null;
  email: string | null;
  completed: boolean;
  enrolledAt: string;
  notas: Record<number, number>;
}

const th =
  'px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-[var(--ac-primario)]/80 uppercase';

const diasDesde = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

export function EstudiantesCursoAcademia({
  slug,
  courseId,
}: {
  slug: string;
  courseId: number;
}) {
  const api = `/api/academia/${slug}/cursos/${courseId}/estudiantes`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    actividades: Actividad[];
    estudiantes: Estudiante[];
  }>(api);
  const todos = useEstudiantesAcademia(slug);
  const [pestana, setPestana] = useState<'actuales' | 'completos'>('actuales');
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [matriculando, setMatriculando] = useState(false);
  const [quitando, setQuitando] = useState<Estudiante[] | null>(null);

  const actividades = data?.actividades ?? [];
  const total = actividades.reduce((t, a) => t + a.puntaje, 0);
  const notaFinal = (e: Estudiante) =>
    total > 0
      ? (actividades.reduce((t, a) => t + (e.notas[a.id] ?? 0), 0) / total) *
        100
      : 0;
  const progreso = (e: Estudiante) =>
    actividades.length > 0
      ? (actividades.filter((a) => e.notas[a.id] != null).length /
          actividades.length) *
        100
      : 0;

  // Cabecera combinada: cada clase abarca sus actividades.
  const grupos: { leccion: string; orden: number; items: Actividad[] }[] = [];
  for (const a of actividades) {
    const g = grupos.find((x) => x.orden === a.orden);
    if (g) g.items.push(a);
    else grupos.push({ leccion: a.leccion, orden: a.orden, items: [a] });
  }

  const q = busqueda.trim().toLowerCase();
  const filas = (data?.estudiantes ?? []).filter(
    (e) =>
      (pestana === 'actuales' ? !e.completed : e.completed) &&
      (!q ||
        (e.name ?? '').toLowerCase().includes(q) ||
        (e.email ?? '').toLowerCase().includes(q))
  );

  const guardar = async (e: Estudiante, a: Actividad, valor: string) => {
    const actual = e.notas[a.id];
    const nueva = valor.trim() === '' ? null : Number(valor);
    if ((actual ?? null) === nueva) return;
    try {
      await enviar(api, 'PUT', {
        activityId: a.id,
        userId: e.userId,
        nota: nueva,
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
    await mutate();
  };

  const marcar = async (completed: boolean) => {
    try {
      await enviar(api, 'PATCH', { userIds: seleccion, completed });
      toast.success(
        completed ? 'Marcados como completos' : 'Desmarcados como completos'
      );
      setSeleccion([]);
      await mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="relative z-20 flex flex-col gap-3 rounded-2xl border border-[var(--ac-primario)]/20 bg-gradient-to-r from-[var(--ac-superficie)] via-[var(--ac-superficie)]/95 to-[var(--ac-primario)]/10 p-6 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)] sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <h1 className="bg-gradient-to-r from-[var(--ac-primario)] to-white bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
          Estadísticas de Estudiantes
        </h1>
        <button
          type="button"
          onClick={() => setMatriculando(true)}
          disabled={!data}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-blue-500/50 bg-blue-500/15 px-3 text-sm font-medium text-blue-400 hover:bg-blue-500/25 disabled:opacity-50"
        >
          <UserPlus className="size-4" /> Matricular estudiantes
        </button>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-4 overflow-x-auto whitespace-nowrap">
        {(
          [
            ['actuales', 'Estudiantes Actuales'],
            ['completos', 'Estudiantes calificación al 100%'],
          ] as const
        ).map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            onClick={() => {
              setPestana(valor);
              setSeleccion([]);
            }}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
              pestana === valor
                ? 'bg-[var(--ac-primario)]/15 text-[var(--ac-primario)] shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-[var(--ac-primario)]/40'
                : 'text-white/80 hover:bg-white/5'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--ac-primario)]/10 bg-[var(--ac-superficie)] p-6">
        {!data ? (
          <EstadoCarga
            cargando={isLoading}
            error={error}
            sqlPendiente={sqlPendiente}
            script="academy_cursos_detalle.sql"
          />
        ) : (
          <>
            {/* Search */}
            <div className="mb-6 rounded-xl border border-[var(--ac-primario)]/10 bg-white/[0.04] p-4 shadow-md">
              <label className="mb-2 block text-sm font-semibold text-white">
                Buscar estudiante
              </label>
              <input
                type="text"
                placeholder="Nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-md border border-[var(--ac-primario)]/20 bg-[var(--ac-fondo)] px-4 py-2 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-[var(--ac-primario)]/40 focus:outline-none"
              />
            </div>

            {/* Bulk actions */}
            <div className="mb-4 flex flex-wrap gap-2">
              {pestana === 'actuales' ? (
                <button
                  type="button"
                  disabled={!seleccion.length}
                  onClick={() => void marcar(true)}
                  className="rounded bg-green-600 px-4 py-2 text-sm text-[#ffffff] hover:bg-green-700 disabled:opacity-50"
                >
                  Marcar como completos
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!seleccion.length}
                  onClick={() => void marcar(false)}
                  className="rounded bg-red-700 px-4 py-2 text-sm text-[#ffffff] hover:bg-red-950 disabled:opacity-50"
                >
                  Desmarcar como completo
                </button>
              )}
              <button
                type="button"
                disabled={!seleccion.length}
                onClick={() =>
                  setQuitando(
                    data.estudiantes.filter((e) => seleccion.includes(e.userId))
                  )
                }
                className="inline-flex items-center gap-1 rounded bg-red-700 px-4 py-2 text-sm text-[#ffffff] hover:bg-red-800 disabled:opacity-50"
              >
                <UserMinus size={14} />
                Desmatricular seleccionados
                {seleccion.length > 0 ? ` (${seleccion.length})` : ''}
              </button>
            </div>

            {filas.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/50">
                {data.estudiantes.length === 0
                  ? 'Aún no hay estudiantes matriculados en el curso.'
                  : 'No hay estudiantes en esta pestaña.'}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--ac-primario)]/20 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
                <table className="w-full divide-y divide-[var(--ac-primario)]/10 text-white">
                  <thead className="sticky top-0 z-20 bg-[var(--ac-fondo)]">
                    <tr>
                      <th
                        rowSpan={2}
                        className="sticky left-0 z-10 min-w-[48px] bg-[var(--ac-fondo)] px-4"
                      >
                        <input
                          type="checkbox"
                          aria-label="Seleccionar todos"
                          checked={
                            filas.length > 0 &&
                            filas.every((f) => seleccion.includes(f.userId))
                          }
                          onChange={(e) =>
                            setSeleccion(
                              e.target.checked ? filas.map((f) => f.userId) : []
                            )
                          }
                        />
                      </th>
                      <th
                        rowSpan={2}
                        className={`${th} sticky left-[48px] z-10 bg-[var(--ac-fondo)]`}
                      >
                        Nombre
                      </th>
                      <th rowSpan={2} className={th}>
                        Correo
                      </th>
                      <th rowSpan={2} className={th}>
                        Progreso
                      </th>
                      <th rowSpan={2} className={th}>
                        Última conexión
                      </th>
                      <th rowSpan={2} className={th}>
                        Tiempo
                      </th>
                      {grupos.map((g, gi) => (
                        <th
                          key={g.orden}
                          colSpan={g.items.length}
                          className={`bg-[var(--ac-primario)]/[0.07] px-3 py-2.5 ${
                            gi > 0
                              ? 'border-l border-[var(--ac-primario)]/25'
                              : ''
                          }`}
                        >
                          <span className="text-[11px] leading-tight font-semibold tracking-wide text-[var(--ac-primario)] normal-case">
                            {g.leccion}
                          </span>
                        </th>
                      ))}
                      <th rowSpan={2} className={`${th} text-center`}>
                        Nota Final
                      </th>
                      <th rowSpan={2} className={`${th} text-center`}>
                        Acciones
                      </th>
                    </tr>
                    <tr>
                      {grupos.flatMap((g, gi) =>
                        g.items.map((a, ai) => (
                          <th
                            key={a.id}
                            className={`px-3 py-2 text-center align-middle ${
                              ai === 0 && gi > 0
                                ? 'border-l border-[var(--ac-primario)]/25'
                                : ''
                            }`}
                            title={a.title}
                          >
                            <span className="block max-w-[130px] truncate text-[11px] leading-tight font-medium text-white/85 normal-case">
                              {a.title}
                            </span>
                            <span className="text-[10px] leading-none text-white/35">
                              /{a.puntaje}
                            </span>
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ac-primario)]/10">
                    {filas.map((e) => {
                      const final = notaFinal(e);
                      const prog = progreso(e);
                      return (
                        <tr
                          key={e.userId}
                          className="group transition-colors hover:bg-[var(--ac-primario)]/5"
                        >
                          <td className="sticky left-0 z-10 bg-[var(--ac-superficie)] px-4 text-center">
                            <input
                              type="checkbox"
                              aria-label={`Seleccionar ${e.name ?? e.email}`}
                              checked={seleccion.includes(e.userId)}
                              onChange={(ev) =>
                                setSeleccion((s) =>
                                  ev.target.checked
                                    ? [...s, e.userId]
                                    : s.filter((id) => id !== e.userId)
                                )
                              }
                            />
                          </td>
                          <td className="sticky left-[48px] z-10 bg-[var(--ac-superficie)] px-4 py-2 whitespace-nowrap">
                            {e.name ?? '—'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-white/70">
                            {e.email}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-24 rounded-full bg-white/10">
                                <div
                                  className="h-2.5 rounded-full bg-[var(--ac-primario)]"
                                  style={{ width: `${prog}%` }}
                                />
                              </div>
                              <span className="text-xs">
                                {prog.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs whitespace-nowrap text-white/50">
                            Matrícula {fmtFecha(e.enrolledAt)}
                          </td>
                          <td className="px-4 py-2 text-xs whitespace-nowrap text-white/50">
                            {diasDesde(e.enrolledAt)} días
                          </td>
                          {grupos.flatMap((g, gi) =>
                            g.items.map((a, ai) => (
                              <td
                                key={a.id}
                                className={`px-3 py-2 text-center ${
                                  ai === 0 && gi > 0
                                    ? 'border-l border-[var(--ac-primario)]/25'
                                    : ''
                                }`}
                              >
                                <input
                                  key={`${e.userId}:${a.id}:${e.notas[a.id] ?? ''}`}
                                  type="number"
                                  min={0}
                                  max={a.puntaje}
                                  step="0.1"
                                  defaultValue={e.notas[a.id] ?? ''}
                                  placeholder="0"
                                  onBlur={(ev) =>
                                    void guardar(e, a, ev.target.value)
                                  }
                                  onKeyDown={(ev) => {
                                    if (ev.key === 'Enter')
                                      ev.currentTarget.blur();
                                  }}
                                  aria-label={`Nota de ${e.name ?? e.email} en ${a.title}`}
                                  className="w-16 rounded-lg bg-white/10 p-1 text-center text-white placeholder:text-white/40 focus:ring-2 focus:ring-[var(--ac-primario)]/40 focus:outline-none"
                                />
                              </td>
                            ))
                          )}
                          <td className="px-4 py-2 text-center font-semibold">
                            <span
                              className={
                                final >= 60
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }
                            >
                              {final.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => setQuitando([e])}
                              aria-label={`Desmatricular a ${e.name ?? e.email}`}
                              className="text-white/40 hover:text-red-400"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {matriculando && data && (
        <Matricular
          slug={slug}
          courseId={courseId}
          cuentas={todos.filter(
            (t) => !data.estudiantes.some((e) => e.userId === t.id)
          )}
          onClose={() => setMatriculando(false)}
          onListo={async () => {
            setMatriculando(false);
            await mutate();
          }}
        />
      )}
      {quitando && (
        <ConfirmarEliminar
          titulo="Desmatricular"
          texto={
            quitando.length === 1 ? (
              <>
                ¿Quitar a{' '}
                <span className="font-semibold text-white">
                  {quitando[0]!.name ?? quitando[0]!.email}
                </span>{' '}
                del curso? Se borran sus notas en este curso.
              </>
            ) : (
              <>
                ¿Quitar a {quitando.length} estudiantes del curso? Se borran sus
                notas en este curso.
              </>
            )
          }
          onClose={() => setQuitando(null)}
          onConfirmar={async () => {
            try {
              for (const e of quitando) {
                await enviar(
                  `${api}?userId=${encodeURIComponent(e.userId)}`,
                  'DELETE'
                );
              }
              toast.success('Estudiantes desmatriculados');
              setQuitando(null);
              setSeleccion([]);
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

function Matricular({
  slug,
  courseId,
  cuentas,
  onClose,
  onListo,
}: {
  slug: string;
  courseId: number;
  cuentas: { id: string; name: string; email: string }[];
  onClose: () => void;
  onListo: () => Promise<void>;
}) {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const matricular = async () => {
    setGuardando(true);
    try {
      const r = (await enviar(`/api/academia/${slug}/matriculas`, 'POST', {
        courseId,
        userIds: seleccion,
      })) as { matriculados?: number };
      toast.success(`${r.matriculados ?? 0} matriculados`);
      await onListo();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Matricular estudiantes" onClose={onClose} ancho="max-w-lg">
      <div className="space-y-4">
        <SelectorCuentas
          cuentas={cuentas}
          seleccion={seleccion}
          onChange={setSeleccion}
          vacio="Todos los estudiantes de la academia ya están en este curso."
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void matricular()}
            disabled={guardando || seleccion.length === 0}
            className={estilos.boton}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Matricular
          </button>
        </div>
      </div>
    </Modal>
  );
}
