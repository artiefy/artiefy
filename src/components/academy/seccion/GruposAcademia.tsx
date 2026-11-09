'use client';

import { useState } from 'react';

import {
  Folder,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  Modal,
  useCursosAcademia,
  useDatosAcademia,
  useEstudiantesAcademia,
} from './comun';

// Grupos de la academia: tarjetas con su curso y estudiantes; crear/editar en
// un modal (nombre, curso y selección de estudiantes).

interface Grupo {
  id: number;
  nombre: string;
  courseId: number | null;
  curso: string | null;
  estudiantes: { userId: string; name: string | null; email: string | null }[];
}

export function GruposAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/grupos`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    grupos: Grupo[];
  }>(api);
  const cursos = useCursosAcademia(slug);
  const estudiantes = useEstudiantesAcademia(slug);
  const [editando, setEditando] = useState<Grupo | null>();
  const [borrando, setBorrando] = useState<Grupo | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [vista, setVista] = useState<'grid' | 'lista'>('grid');
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);

  const q = busqueda.trim().toLowerCase();
  const visibles = (data?.grupos ?? []).filter(
    (g) =>
      !q ||
      g.nombre.toLowerCase().includes(q) ||
      (g.curso ?? '').toLowerCase().includes(q)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--ac-primario)] sm:text-3xl">
        Grupos
      </h1>

      {/* Barra de controles (igual a Grupos de Artiefy) */}
      <div className="mt-4 mb-6 flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--ac-borde)] bg-white/[0.04] px-3 py-1.5">
            <Search className="size-4 text-white/40" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="w-28 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none sm:w-44"
            />
          </div>
          <div className="flex rounded-lg border border-[var(--ac-borde)] bg-white/[0.04] p-0.5">
            {(
              [
                ['grid', 'Vista en cuadrícula', LayoutGrid],
                ['lista', 'Vista en lista', List],
              ] as const
            ).map(([v, texto, Icono]) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                aria-label={texto}
                className={`rounded-md p-1.5 transition-colors ${
                  vista === v
                    ? 'bg-[var(--ac-primario)]/20 text-[var(--ac-primario)]'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <Icono className="size-4" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditando(null)}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ac-primario)] px-4 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="size-4" />
            Crear
          </button>
        </div>
      </div>

      {!data ? (
        <EstadoCarga
          cargando={isLoading}
          error={error}
          sqlPendiente={sqlPendiente}
          script="academy_grupos.sql"
        />
      ) : (
        <div
          className={
            vista === 'grid'
              ? 'grid gap-3 sm:grid-cols-2'
              : 'flex flex-col gap-2'
          }
        >
          <button
            type="button"
            onClick={() => setEditando(null)}
            className={`group flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-white/50 transition-colors hover:border-[var(--ac-primario)]/50 hover:text-[var(--ac-primario)] ${
              vista === 'grid' ? 'min-h-[132px] flex-col' : 'px-4 py-3'
            }`}
          >
            <Plus className="size-6" />
            <span className="text-sm font-medium">Crear nuevo</span>
          </button>

          {visibles.map((g) => (
            <div
              key={g.id}
              className="group relative rounded-xl border border-[var(--ac-borde)] bg-white/[0.03] transition-colors hover:border-[var(--ac-primario)]/40 hover:bg-white/[0.05]"
            >
              <div className="absolute top-2 right-2 z-20">
                <button
                  type="button"
                  onClick={() =>
                    setMenuAbierto((actual) => (actual === g.id ? null : g.id))
                  }
                  aria-label={`Acciones del grupo ${g.nombre}`}
                  aria-haspopup="menu"
                  aria-expanded={menuAbierto === g.id}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuAbierto === g.id && (
                  <div
                    role="menu"
                    className="absolute top-9 right-0 w-44 rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-1.5 shadow-2xl shadow-black/40"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuAbierto(null);
                        setEditando(g);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="size-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuAbierto(null);
                        setBorrando(g);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                    >
                      <Trash2 className="size-4" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditando(g)}
                className="block w-full p-4 text-left"
              >
                <div className="mb-3 flex items-start justify-between gap-2 pr-8">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--ac-borde)] bg-white/[0.04] text-[var(--ac-primario)]">
                    <Folder className="size-5" />
                  </span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-[var(--ac-primario)]">
                  {g.nombre}
                </h3>
                <p className="mt-0.5 text-xs text-white/45">
                  {g.curso ?? 'Sin curso'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <Users className="size-3.5" />
                    {g.estudiantes.length}
                  </span>
                  {g.curso && (
                    <span className="rounded-full border border-[var(--ac-primario)]/30 bg-[var(--ac-primario)]/10 px-2 py-0.5 text-[11px] text-[var(--ac-primario)]">
                      {g.curso}
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))}

          {visibles.length === 0 && data.grupos.length > 0 && (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50 sm:col-span-2">
              Ningún grupo coincide con la búsqueda.
            </div>
          )}
        </div>
      )}

      {editando !== undefined && (
        <FormularioGrupo
          api={api}
          grupo={editando}
          cursos={cursos}
          estudiantes={estudiantes}
          onClose={() => setEditando(undefined)}
          onSaved={async () => {
            setEditando(undefined);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar grupo"
          texto={
            <>
              ¿Eliminar el grupo{' '}
              <span className="font-semibold text-white">
                “{borrando.nombre}”
              </span>
              ? Los estudiantes siguen matriculados en el curso.
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(`${api}/${borrando.id}`, 'DELETE');
              toast.success('Grupo eliminado');
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

/** Lista de casillas con buscador para elegir cuentas. */
export function SelectorCuentas({
  cuentas,
  seleccion,
  onChange,
  vacio,
}: {
  cuentas: { id: string; name: string; email: string }[];
  seleccion: string[];
  onChange: (ids: string[]) => void;
  vacio: string;
}) {
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const visibles = cuentas.filter(
    (c) =>
      !t ||
      c.name.toLowerCase().includes(t) ||
      c.email.toLowerCase().includes(t)
  );
  if (cuentas.length === 0) {
    return <p className="text-sm text-white/40">{vacio}</p>;
  }
  return (
    <div className="space-y-2">
      <label className="relative block">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className={`${estilos.campo} pl-9`}
        />
      </label>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-[var(--ac-borde)] p-2">
        {visibles.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white hover:bg-white/5"
          >
            <input
              type="checkbox"
              checked={seleccion.includes(c.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...seleccion, c.id]
                    : seleccion.filter((id) => id !== c.id)
                )
              }
              className="accent-[var(--ac-primario)]"
            />
            <span className="min-w-0 flex-1 truncate">
              {c.name}
              <span className="ml-2 text-xs text-white/40">{c.email}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs text-white/50">{seleccion.length} seleccionados</p>
    </div>
  );
}

function FormularioGrupo({
  api,
  grupo,
  cursos,
  estudiantes,
  onClose,
  onSaved,
}: {
  api: string;
  grupo: Grupo | null;
  cursos: { id: number; title: string }[];
  estudiantes: { id: string; name: string; email: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState(grupo?.nombre ?? '');
  const [courseId, setCourseId] = useState<string>(
    grupo?.courseId != null ? String(grupo.courseId) : ''
  );
  const [userIds, setUserIds] = useState<string[]>(
    grupo?.estudiantes.map((e) => e.userId) ?? []
  );
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await enviar(
        grupo ? `${api}/${grupo.id}` : api,
        grupo ? 'PATCH' : 'POST',
        { nombre, courseId: courseId || null, userIds }
      );
      toast.success(grupo ? 'Grupo actualizado' : 'Grupo creado');
      await onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={grupo ? 'Editar grupo' : 'Crear grupo'} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className={estilos.etiqueta}>Nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Curso</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={estilos.campo}
          >
            <option value="" className="bg-[var(--ac-fondo)]">
              Sin curso
            </option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id} className="bg-[var(--ac-fondo)]">
                {c.title}
              </option>
            ))}
          </select>
          {courseId && (
            <span className="mt-1 block text-xs text-white/50">
              Los estudiantes del grupo quedan matriculados en este curso.
            </span>
          )}
        </label>
        <div>
          <span className={estilos.etiqueta}>Estudiantes</span>
          <SelectorCuentas
            cuentas={estudiantes}
            seleccion={userIds}
            onChange={setUserIds}
            vacio="La academia aún no tiene estudiantes."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando || !nombre.trim()}
            className={estilos.boton}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
