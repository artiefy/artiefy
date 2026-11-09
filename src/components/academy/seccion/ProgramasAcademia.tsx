'use client';

import { useState } from 'react';

import { Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  ConfirmarEliminar,
  enviar,
  EstadoCarga,
  estilos,
  Modal,
  useCursosAcademia,
  useDatosAcademia,
} from './comun';

// Programas de la academia (como "Todos los programas" de Artiefy): tarjetas
// con sus cursos, crear/editar en un modal y eliminar con confirmación.

interface Programa {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  cursos: { id: number; title: string }[];
}

export function ProgramasAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/programas`;
  const { data, error, isLoading, sqlPendiente, mutate } = useDatosAcademia<{
    programas: Programa[];
  }>(api);
  const cursos = useCursosAcademia(slug);
  // undefined: cerrado; null: nuevo.
  const [editando, setEditando] = useState<Programa | null>();
  const [borrando, setBorrando] = useState<Programa | null>(null);

  if (!data) {
    return (
      <EstadoCarga
        cargando={isLoading}
        error={error}
        sqlPendiente={sqlPendiente}
        script="academy_programas.sql"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditando(null)}
          className={estilos.boton}
        >
          <Plus className="size-4" /> Crear programa
        </button>
      </div>

      {data.programas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--ac-borde)] p-10 text-center text-white/50">
          Todavía no hay programas. Crea uno y agrúpale cursos.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.programas.map((p) => (
            <article
              key={p.id}
              className={`${estilos.tarjeta} flex flex-col gap-3 ${p.isActive ? '' : 'opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ac-primario)]/15 text-[var(--ac-primario)]">
                  <Layers className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white">{p.title}</h3>
                  {!p.isActive && (
                    <span className="text-xs text-white/50">Inactivo</span>
                  )}
                </div>
              </div>
              {p.description && (
                <p className="line-clamp-3 text-sm text-white/60">
                  {p.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {p.cursos.length === 0 ? (
                  <span className="text-xs text-white/40">Sin cursos</span>
                ) : (
                  p.cursos.map((c) => (
                    <span
                      key={c.id}
                      className={`${estilos.chip} border-[var(--ac-primario)]/30 bg-[var(--ac-primario)]/10 text-[var(--ac-primario)]`}
                    >
                      {c.title}
                    </span>
                  ))
                )}
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  className={`${estilos.botonSec} h-9 flex-1`}
                >
                  <Pencil className="size-4" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => setBorrando(p)}
                  aria-label={`Eliminar ${p.title}`}
                  className="inline-flex h-9 items-center justify-center rounded-full px-3 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editando !== undefined && (
        <FormularioPrograma
          api={api}
          programa={editando}
          cursos={cursos}
          onClose={() => setEditando(undefined)}
          onSaved={async () => {
            setEditando(undefined);
            await mutate();
          }}
        />
      )}
      {borrando && (
        <ConfirmarEliminar
          titulo="Eliminar programa"
          texto={
            <>
              ¿Eliminar el programa{' '}
              <span className="font-semibold text-white">
                “{borrando.title}”
              </span>
              ? Sus cursos no se borran.
            </>
          }
          onClose={() => setBorrando(null)}
          onConfirmar={async () => {
            try {
              await enviar(`${api}/${borrando.id}`, 'DELETE');
              toast.success('Programa eliminado');
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

function FormularioPrograma({
  api,
  programa,
  cursos,
  onClose,
  onSaved,
}: {
  api: string;
  programa: Programa | null;
  cursos: { id: number; title: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(programa?.title ?? '');
  const [description, setDescription] = useState(programa?.description ?? '');
  const [isActive, setIsActive] = useState(programa?.isActive ?? true);
  const [courseIds, setCourseIds] = useState<number[]>(
    programa?.cursos.map((c) => c.id) ?? []
  );
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await enviar(
        programa ? `${api}/${programa.id}` : api,
        programa ? 'PATCH' : 'POST',
        { title, description, isActive, courseIds }
      );
      toast.success(programa ? 'Programa actualizado' : 'Programa creado');
      await onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo={programa ? 'Editar programa' : 'Crear programa'}
      onClose={onClose}
    >
      <div className="space-y-4">
        <label className="block">
          <span className={estilos.etiqueta}>Nombre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={estilos.area}
          />
        </label>
        <div>
          <span className={estilos.etiqueta}>Cursos del programa</span>
          {cursos.length === 0 ? (
            <p className="text-sm text-white/40">
              La academia aún no tiene cursos.
            </p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-[var(--ac-borde)] p-2">
              {cursos.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={courseIds.includes(c.id)}
                    onChange={(e) =>
                      setCourseIds((ids) =>
                        e.target.checked
                          ? [...ids, c.id]
                          : ids.filter((id) => id !== c.id)
                      )
                    }
                    className="accent-[var(--ac-primario)]"
                  />
                  {c.title}
                </label>
              ))}
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-[var(--ac-primario)]"
          />
          Programa activo
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={estilos.botonSec}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando || !title.trim()}
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
