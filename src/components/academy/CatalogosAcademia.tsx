'use client';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { Edit, Loader2, Plus, Trash2, X } from 'lucide-react';
import {
  FiAward,
  FiClock,
  FiLayers,
  FiMapPin,
  FiTag,
  FiTrendingUp,
} from 'react-icons/fi';
import useSWR from 'swr';

import { cn } from '~/lib/utils';

// Configuraciones de cursos de una academia: el mismo diseño de
// "Configuraciones" de Artiefy, pero un solo componente para los seis
// catálogos (todos tienen la forma {id, name, description}) y con los colores
// del tema de la academia.

const TABS = [
  { id: 'categorias', label: 'Categorías', singular: 'Categoría', icon: FiTag },
  {
    id: 'modalidades',
    label: 'Modalidades',
    singular: 'Modalidad',
    icon: FiLayers,
  },
  { id: 'niveles', label: 'Niveles', singular: 'Nivel', icon: FiTrendingUp },
  { id: 'horarios', label: 'Horarios', singular: 'Horario', icon: FiClock },
  { id: 'espacios', label: 'Espacios', singular: 'Espacio', icon: FiMapPin },
  {
    id: 'tipos-certificacion',
    label: 'Tipos de Certificación',
    singular: 'Tipo de certificación',
    icon: FiAward,
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Item {
  id: number;
  name: string;
  description: string | null;
}

const botonClase = `
  group/button relative inline-flex items-center justify-center gap-2
  overflow-hidden rounded-md border border-white/20 bg-background px-4 py-2
  text-sm text-primary transition-all hover:bg-primary/10
  disabled:cursor-not-allowed disabled:opacity-40
`;

const campoClase = `
  w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white
  placeholder:text-gray-400 focus:border-primary focus:outline-none
`;

export function CatalogosAcademia({ slug }: { slug: string }) {
  // ?tab=horarios / ?tab=espacios abre esa pestaña (enlaces del menú
  // "Formulario"); al cambiar el enlace se sigue la URL.
  const tabUrl = useSearchParams().get('tab');
  const tabDeUrl = TABS.find((t) => t.id === tabUrl)?.id ?? 'categorias';
  const [tab, setTab] = useState<TabId>(tabDeUrl);
  const [tabUrlPrevia, setTabUrlPrevia] = useState(tabDeUrl);
  if (tabUrlPrevia !== tabDeUrl) {
    setTabUrlPrevia(tabDeUrl);
    setTab(tabDeUrl);
  }
  const actual = TABS.find((t) => t.id === tab) ?? TABS[0];
  const api = `/api/academia/${slug}/catalogos/${tab}`;

  const { data, error, isLoading, mutate } = useSWR(
    api,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo cargar');
      return (await res.json()) as Item[];
    }
  );

  // null: cerrado; {id: 0}: crear; {id > 0}: editar.
  const [editando, setEditando] = useState<Item | null>(null);
  const [porEliminar, setPorEliminar] = useState<Item | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const enviar = async (metodo: 'POST' | 'PATCH' | 'DELETE', item: Item) => {
    setGuardando(true);
    setAviso(null);
    try {
      const url = metodo === 'POST' ? api : `${api}?id=${item.id}`;
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body:
          metodo === 'DELETE'
            ? undefined
            : JSON.stringify({
                name: item.name,
                description: item.description,
              }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar');
      setEditando(null);
      setPorEliminar(null);
      await mutate();
    } catch (err) {
      setAviso((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">
        Configuraciones
      </h1>
      <p className="mt-1 text-sm text-gray-400">
        Gestiona las configuraciones de los cursos.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-gray-900/30 p-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setAviso(null);
              }}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                t.id === tab
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setEditando({ id: 0, name: '', description: '' })}
          className={botonClase}
        >
          <span className="relative z-10 font-medium">
            Crear {actual.singular}
          </span>
          <Plus className="relative z-10 size-4" />
        </button>
      </div>

      {aviso && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {aviso}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 flex items-center justify-center rounded-xl border border-border bg-card p-12 text-gray-400">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {(error as Error).message}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg bg-gray-800/50 shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse overflow-hidden rounded-xl border border-border bg-card">
              <thead>
                <tr className="border-b border-primary bg-background">
                  {['Nombre', 'Descripción', ''].map((h) => (
                    <th
                      key={h}
                      className="p-3 text-left text-[10px] font-semibold tracking-[0.12em] text-primary uppercase sm:px-4"
                    >
                      {h || <span className="sr-only">Acciones</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-6 text-center text-sm text-gray-400"
                    >
                      Aún no hay {actual.label.toLowerCase()}.
                    </td>
                  </tr>
                ) : (
                  data?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-white/5"
                    >
                      <td className="p-3 text-xs font-medium text-white sm:p-4 sm:text-sm">
                        {item.name}
                      </td>
                      <td className="p-3 text-xs text-gray-400 sm:p-4 sm:text-sm">
                        {item.description}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditando(item)}
                            aria-label={`Editar ${item.name}`}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-primary"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPorEliminar(item)}
                            aria-label={`Eliminar ${item.name}`}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando && (
        <Modal
          titulo={`${editando.id ? 'Editar' : 'Nueva'} ${actual.singular.toLowerCase()}`}
          onCerrar={() => setEditando(null)}
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">
                Nombre
              </span>
              <input
                value={editando.name}
                onChange={(e) =>
                  setEditando({ ...editando, name: e.target.value })
                }
                placeholder="Nombre"
                className={campoClase}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-300">
                Descripción
              </span>
              <input
                value={editando.description ?? ''}
                onChange={(e) =>
                  setEditando({ ...editando, description: e.target.value })
                }
                placeholder="Descripción"
                className={campoClase}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={guardando || !editando.name.trim()}
            onClick={() =>
              void enviar(editando.id ? 'PATCH' : 'POST', editando)
            }
            className={cn(botonClase, 'mt-6 w-full')}
          >
            {guardando && <Loader2 className="size-4 animate-spin" />}
            <span className="relative z-10 font-medium">Guardar</span>
          </button>
        </Modal>
      )}

      {porEliminar && (
        <Modal
          titulo={`¿Eliminar "${porEliminar.name}"?`}
          onCerrar={() => setPorEliminar(null)}
        >
          <p className="text-sm text-gray-300">
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPorEliminar(null)}
              className={botonClase}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => void enviar('DELETE', porEliminar)}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 disabled:opacity-40"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="relative m-4 w-full max-w-lg rounded-xl bg-background p-4 text-white shadow-2xl md:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold text-primary">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
