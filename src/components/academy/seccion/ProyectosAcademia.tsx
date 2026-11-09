'use client';

import { useState } from 'react';

import {
  ExternalLink,
  FolderKanban,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  fmtFecha,
  Modal,
  useCursosAcademia,
  useDatosAcademia,
  useEstudiantesAcademia,
} from './comun';

// Proyectos de estudiantes: agrupados por curso (los proyectos viven dentro de
// los cursos de la academia), con su estado y registro manual.

interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string | null;
  enlace: string | null;
  estado: 'en progreso' | 'entregado' | 'aprobado';
  courseId: number;
  curso: string;
  userId: string;
  estudiante: string | null;
  email: string | null;
  updatedAt: string;
}

const ESTADOS = ['en progreso', 'entregado', 'aprobado'] as const;
const COLOR_ESTADO: Record<Proyecto['estado'], string> = {
  'en progreso': 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  entregado: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  aprobado: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
};

export function ProyectosAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/proyectos`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    proyectos: Proyecto[];
  }>(api);
  const cursos = useCursosAcademia(slug);
  const estudiantes = useEstudiantesAcademia(slug);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [creando, setCreando] = useState(false);
  const [borrando, setBorrando] = useState<Proyecto | null>(null);

  if (!data) {
    return (
      <EstadoCarga
        cargando={isLoading}
        error={error}
        sqlPendiente={sqlPendiente}
        script="academy_proyectos.sql"
      />
    );
  }

  const visibles = data.proyectos.filter(
    (p) => !filtroCurso || String(p.courseId) === filtroCurso
  );
  const porCurso = new Map<string, Proyecto[]>();
  for (const p of visibles) {
    porCurso.set(p.curso, [...(porCurso.get(p.curso) ?? []), p]);
  }

  const cambiarEstado = async (p: Proyecto, estado: string) => {
    try {
      await enviar(`${api}/${p.id}`, 'PATCH', { estado });
      await mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filtroCurso}
          onChange={(e) => setFiltroCurso(e.target.value)}
          className={`${estilos.campo} w-64`}
        >
          <option value="" className="bg-[var(--ac-fondo)]">
            Todos los cursos
          </option>
          {cursos.map((c) => (
            <option key={c.id} value={c.id} className="bg-[var(--ac-fondo)]">
              {c.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreando(true)}
          className={`${estilos.boton} ml-auto`}
        >
          <Plus className="size-4" /> Registrar proyecto
        </button>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--ac-borde)] p-10 text-center text-white/50">
          {data.proyectos.length === 0
            ? 'Todavía no hay proyectos de estudiantes.'
            : 'Ese curso no tiene proyectos.'}
        </p>
      ) : (
        [...porCurso.entries()].map(([curso, proyectos]) => (
          <section key={curso} className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <FolderKanban className="size-5 text-[var(--ac-primario)]" />
              {curso}
              <span className="text-sm font-normal text-white/50">
                {proyectos.length}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proyectos.map((p) => (
                <article
                  key={p.id}
                  className={`${estilos.tarjeta} flex flex-col gap-2`}
                >
                  <h3 className="font-bold text-white">{p.titulo}</h3>
                  <p className="text-xs text-white/60">
                    {p.estudiante ?? p.email ?? p.userId} ·{' '}
                    {fmtFecha(p.updatedAt)}
                  </p>
                  {p.descripcion && (
                    <p className="line-clamp-3 text-sm text-white/70">
                      {p.descripcion}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <select
                      value={p.estado}
                      onChange={(e) => void cambiarEstado(p, e.target.value)}
                      className={`${estilos.chip} cursor-pointer capitalize ${COLOR_ESTADO[p.estado]}`}
                    >
                      {ESTADOS.map((e) => (
                        <option
                          key={e}
                          value={e}
                          className="bg-[var(--ac-fondo)]"
                        >
                          {e}
                        </option>
                      ))}
                    </select>
                    {p.enlace && (
                      <a
                        href={p.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[var(--ac-primario)] hover:underline"
                      >
                        <ExternalLink className="size-3.5" /> Ver
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setBorrando(p)}
                      aria-label={`Eliminar ${p.titulo}`}
                      className="ml-auto text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {creando && (
        <RegistrarProyecto
          api={api}
          cursos={cursos}
          estudiantes={estudiantes}
          onClose={() => setCreando(false)}
          onSaved={async () => {
            setCreando(false);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar proyecto"
          texto={
            <>
              ¿Eliminar el proyecto{' '}
              <span className="font-semibold text-white">
                “{borrando.titulo}”
              </span>
              ?
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(`${api}/${borrando.id}`, 'DELETE');
              toast.success('Proyecto eliminado');
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

function RegistrarProyecto({
  api,
  cursos,
  estudiantes,
  onClose,
  onSaved,
}: {
  api: string;
  cursos: { id: number; title: string }[];
  estudiantes: { id: string; name: string; email: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enlace, setEnlace] = useState('');
  const [courseId, setCourseId] = useState('');
  const [userId, setUserId] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await enviar(api, 'POST', {
        titulo,
        descripcion,
        enlace,
        courseId: Number(courseId),
        userId,
      });
      toast.success('Proyecto registrado');
      await onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Registrar proyecto" onClose={onClose} ancho="max-w-lg">
      <div className="space-y-4">
        <label className="block">
          <span className={estilos.etiqueta}>Curso</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={estilos.campo}
          >
            <option value="" className="bg-[var(--ac-fondo)]">
              — Seleccionar —
            </option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id} className="bg-[var(--ac-fondo)]">
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Estudiante</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={estilos.campo}
          >
            <option value="" className="bg-[var(--ac-fondo)]">
              — Seleccionar —
            </option>
            {estudiantes.map((e) => (
              <option key={e.id} value={e.id} className="bg-[var(--ac-fondo)]">
                {e.name} ({e.email})
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-white/50">
            Debe estar matriculado en el curso.
          </span>
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Título</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Descripción</span>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={estilos.area}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Enlace (opcional)</span>
          <input
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            placeholder="https://…"
            className={estilos.campo}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando || !titulo.trim() || !courseId || !userId}
            className={estilos.boton}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Registrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
