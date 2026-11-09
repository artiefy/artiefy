'use client';

import { useState } from 'react';

import { ClipboardList, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { enviar, useDatosAcademia } from './seccion/comun';

// Modal "Crear actividad" / "Editar actividad" de un curso de la academia,
// igual al de Artiefy (ModalFormActivityQuick): clase y tipo, título,
// descripción, parámetro de evaluación, el peso automático (se reparte igual
// entre las actividades del parámetro, con la vista previa del reparto) y la
// fecha máxima de entrega.

export const TIPOS_ACTIVIDAD = {
  tarea: 'Tarea',
  quiz: 'Quiz',
  proyecto: 'Proyecto',
} as const;

export type TipoActividad = keyof typeof TIPOS_ACTIVIDAD;

/** Actividad tal como la devuelven las APIs de la academia. */
export interface ActividadAcademia {
  id: number;
  title: string;
  description: string | null;
  tipo: TipoActividad;
  fechaLimite: string | null;
  puntaje: number;
  lessonId?: number;
  calificable?: boolean;
  parametroId?: number | null;
  porcentaje?: number | null;
}

interface Parametro {
  id: number;
  name: string;
  porcentaje: number;
}

const campo =
  'w-full rounded-md border border-[var(--ac-primario)]/30 bg-[var(--ac-fondo)] p-2.5 text-sm text-white placeholder:text-white/40 focus:border-[var(--ac-primario)] focus:outline-none';

/** Fecha ISO → valor de <input type="datetime-local"> (hora local). */
const aLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

const redondear = (n: number) => Math.round(n * 100) / 100;

export function ModalActividadAcademia({
  slug,
  courseId,
  actividad,
  leccionInicial,
  onClose,
  onSaved,
}: {
  slug: string;
  courseId: number;
  // null: crear una actividad nueva.
  actividad: ActividadAcademia | null;
  // Clase ya elegida (al crear desde la página de una clase).
  leccionInicial?: number;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const base = `/api/academia/${slug}`;
  const { data: lecciones, isLoading: cargandoLecciones } = useDatosAcademia<{
    lecciones: { id: number; title: string }[];
  }>(`${base}/cursos/${courseId}/lecciones`);
  const { data: parametros, isLoading: cargandoParametros } = useDatosAcademia<
    Parametro[]
  >(`${base}/cursos/${courseId}/parametros`);
  const { data: delCurso } = useDatosAcademia<{
    actividades: ActividadAcademia[];
  }>(`${base}/cursos/${courseId}/estudiantes`);

  const [lessonId, setLessonId] = useState<number | null>(
    actividad?.lessonId ?? leccionInicial ?? null
  );
  const [tipo, setTipo] = useState<TipoActividad | ''>(actividad?.tipo ?? '');
  const [title, setTitle] = useState(actividad?.title ?? '');
  const [description, setDescription] = useState(actividad?.description ?? '');
  const [parametroId, setParametroId] = useState<number | null>(
    actividad?.parametroId ?? null
  );
  const [conFecha, setConFecha] = useState(Boolean(actividad?.fechaLimite));
  const [fechaLimite, setFechaLimite] = useState(
    aLocal(actividad?.fechaLimite ?? null)
  );
  const [guardando, setGuardando] = useState(false);

  const listaParametros = Array.isArray(parametros) ? parametros : [];
  const parametro = listaParametros.find((p) => p.id === parametroId);

  // Reparto si se guarda: las demás actividades del parámetro más esta.
  const otras = (delCurso?.actividades ?? []).filter(
    (a) => a.parametroId === parametroId && a.id !== actividad?.id
  );
  const peso = parametroId ? redondear(100 / (otras.length + 1)) : 0;
  // Lo que queda del 100% tras repartir a las demás: lo que toma esta.
  const disponible = parametroId ? redondear(100 - peso * otras.length) : 0;
  const reparto = parametroId
    ? [
        ...otras.map((a) => ({ id: a.id, name: a.title, porcentaje: peso })),
        {
          id: 'nueva',
          name: title.trim() || 'Esta actividad',
          porcentaje: peso,
        },
      ]
    : [];

  const guardar = async () => {
    if (!lessonId) return toast.error('Selecciona una clase');
    if (!tipo) return toast.error('Selecciona un tipo de actividad');
    if (!title.trim()) return toast.error('El título es obligatorio');
    if (!description.trim()) {
      return toast.error('La descripción es obligatoria');
    }
    if (listaParametros.length > 0 && !parametroId) {
      return toast.error('Selecciona un parámetro de evaluación');
    }
    if (conFecha && !fechaLimite) {
      return toast.error('Indica la fecha máxima de entrega');
    }
    setGuardando(true);
    try {
      const cuerpo = {
        lessonId,
        tipo,
        title,
        description,
        parametroId,
        puntaje: actividad?.puntaje ?? 100,
        fechaLimite:
          conFecha && fechaLimite ? new Date(fechaLimite).toISOString() : null,
      };
      if (actividad) {
        await enviar(`${base}/actividades/${actividad.id}`, 'PATCH', cuerpo);
        toast.success('Actividad actualizada');
      } else {
        await enviar(
          `${base}/lecciones/${lessonId}/actividades`,
          'POST',
          cuerpo
        );
        toast.success('Actividad creada');
      }
      await onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--ac-primario)]/30 bg-[var(--ac-superficie)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--ac-primario)]/30 bg-[var(--ac-primario)]/10 text-[var(--ac-primario)]">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {actividad ? 'Editar actividad' : 'Crear actividad'}
              </h2>
              {parametro && (
                <p className="text-sm text-white/50">
                  Para el parámetro{' '}
                  <span className="font-semibold text-[var(--ac-primario)]">
                    {parametro.name} ({parametro.porcentaje}%)
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-white/50 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Clase *</label>
              {cargandoLecciones ? (
                <p className="text-sm text-white/50">Cargando clases...</p>
              ) : (lecciones?.lecciones ?? []).length === 0 ? (
                <p className="text-sm text-red-400">
                  Este curso aún no tiene clases creadas.
                </p>
              ) : (
                <select
                  value={lessonId ?? ''}
                  onChange={(e) => setLessonId(Number(e.target.value) || null)}
                  className={`${campo} [&>option]:bg-[var(--ac-fondo)]`}
                >
                  <option value="">Selecciona una clase</option>
                  {(lecciones?.lecciones ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Tipo de actividad *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoActividad)}
                className={`${campo} [&>option]:bg-[var(--ac-fondo)]`}
              >
                <option value="">Selecciona un tipo</option>
                {Object.entries(TIPOS_ACTIVIDAD).map(([valor, nombre]) => (
                  <option key={valor} value={valor}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Taller práctico"
              className={campo}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Descripción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la actividad"
              rows={3}
              className={campo}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Parámetro de evaluación *
            </label>
            {cargandoParametros ? (
              <p className="text-sm text-white/50">Cargando parámetros...</p>
            ) : listaParametros.length === 0 ? (
              <p className="text-sm text-red-400">
                Este curso aún no tiene parámetros de evaluación. Agrégalos en
                “Editar curso” (¿Es calificable?).
              </p>
            ) : (
              <select
                value={parametroId ?? ''}
                onChange={(e) => setParametroId(Number(e.target.value) || null)}
                className={`${campo} [&>option]:bg-[var(--ac-fondo)]`}
              >
                <option value="">Selecciona un parámetro</option>
                {listaParametros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.porcentaje}%)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-lg border border-[var(--ac-primario)]/20 bg-[var(--ac-fondo)]/50 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Peso automático del parámetro (%)
                </label>
                <input
                  type="number"
                  readOnly
                  value={peso}
                  className={`${campo} opacity-90`}
                />
                {!parametroId ? (
                  <p className="text-xs text-white/40">
                    Selecciona un parámetro para ver el reparto.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--ac-primario)]">
                      Disponible en el parámetro:{' '}
                      <span className="font-semibold">{disponible}%</span>
                    </p>
                    <p className="text-xs text-white/50">
                      Este nuevo peso quedará en{' '}
                      <span className="font-semibold text-white/80">
                        {peso}%
                      </span>
                    </p>
                    <div className="rounded-md border border-[var(--ac-primario)]/20 bg-[var(--ac-superficie)]/60 p-2">
                      <p className="mb-1 text-[10px] font-semibold tracking-wide text-[var(--ac-primario)] uppercase">
                        Reparto si {actividad ? 'guardas' : 'creas'} esta
                        actividad
                      </p>
                      <div className="space-y-1 text-xs text-white/70">
                        {reparto.map((a) => (
                          <div
                            key={String(a.id)}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{a.name}</span>
                            <span className="font-semibold text-[var(--ac-primario)]">
                              {a.porcentaje}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-white/50">
                      Si el parámetro tiene 1 actividad, vale 100%. Si agregas
                      otra, se reparte 50% y 50%. Con 3 actividades, cada una
                      queda en 33.33% y así sucesivamente.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 pt-2 text-sm font-medium text-white sm:pt-7">
                  <input
                    type="checkbox"
                    checked={conFecha}
                    onChange={(e) => setConFecha(e.target.checked)}
                    className="size-4 accent-[var(--ac-primario)]"
                  />
                  Fecha máxima de entrega
                </label>
                {conFecha && (
                  <input
                    type="datetime-local"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className={campo}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--ac-primario)] px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] hover:opacity-90 disabled:opacity-50"
            >
              {guardando && <Loader2 className="size-4 animate-spin" />}
              {guardando
                ? actividad
                  ? 'Guardando...'
                  : 'Creando...'
                : actividad
                  ? 'Guardar cambios'
                  : 'Crear actividad'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
