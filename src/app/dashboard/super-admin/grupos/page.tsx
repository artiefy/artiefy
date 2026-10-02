'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import {
  Folder,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

import { ModalCrearGrupo } from './ModalCrearGrupo';

interface GrupoResumen {
  id: number;
  nombre: string;
  programa: string | null;
  filtroColumna: string | null;
  filtroValor: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  archivado: boolean;
  createdAt: string | null;
  miembros: number;
  cursos: number;
}

const fmtRango = (ini: string | null, fin: string | null) => {
  const f = (s: string | null) => {
    if (!s) return null;
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const a = f(ini);
  const b = f(fin);
  if (a && b) return `${a} — ${b}`;
  if (a) return `Desde ${a}`;
  if (b) return `Hasta ${b}`;
  return 'Sin fechas definidas';
};

export default function GruposPage() {
  const [grupos, setGrupos] = useState<GrupoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [porEliminar, setPorEliminar] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [tab, setTab] = useState<'activos' | 'archivados'>('activos');
  const [busqueda, setBusqueda] = useState('');
  const [vista, setVista] = useState<'grid' | 'lista'>('grid');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/super-admin/grupos', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se pudieron cargar los grupos');
      const json = (await res.json()) as { grupos: GrupoResumen[] };
      setGrupos(json.grupos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    const { id } = porEliminar;
    setEliminando(id);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/grupos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('No se pudo eliminar el grupo');
      setGrupos((prev) => prev.filter((g) => g.id !== id));
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setEliminando(null);
    }
  };

  const visibles = grupos
    .filter((g) => (tab === 'archivados' ? g.archivado : !g.archivado))
    .filter((g) =>
      busqueda.trim() === ''
        ? true
        : `${g.nombre} ${g.programa ?? ''}`
            .toLowerCase()
            .includes(busqueda.trim().toLowerCase())
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white sm:px-6">
      <h1 className="text-2xl font-bold text-[#22C4D3] sm:text-3xl">Grupos</h1>

      {/* Barra de controles estilo referencia */}
      <div className="mt-4 mb-6 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-white/[0.04] p-1">
          {(['activos', 'archivados'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-[#22C4D3] text-[#04101f]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <Search className="size-4 text-white/40" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="w-28 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none sm:w-44"
            />
          </div>
          <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
            <button
              type="button"
              onClick={() => setVista('grid')}
              aria-label="Vista en cuadrícula"
              className={`rounded-md p-1.5 transition-colors ${
                vista === 'grid'
                  ? 'bg-[#22C4D3]/20 text-[#22C4D3]'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setVista('lista')}
              aria-label="Vista en lista"
              className={`rounded-md p-1.5 transition-colors ${
                vista === 'lista'
                  ? 'bg-[#22C4D3]/20 text-[#22C4D3]'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCrearAbierto(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#22C4D3] px-4 py-2 text-sm font-semibold text-[#04101f] transition-colors hover:bg-[#3ad4e2]"
          >
            <Plus className="size-4" />
            Crear
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-white/50">
          <Loader2 className="size-5 animate-spin" />
          Cargando…
        </div>
      ) : (
        <div
          className={
            vista === 'grid'
              ? 'grid gap-3 sm:grid-cols-2'
              : 'flex flex-col gap-2'
          }
        >
          {/* Crear nuevo (solo en Activos) */}
          {tab === 'activos' && (
            <button
              type="button"
              onClick={() => setCrearAbierto(true)}
              className={`group flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-white/50 transition-colors hover:border-[#22C4D3]/50 hover:text-[#22C4D3] ${
                vista === 'grid' ? 'min-h-[132px] flex-col' : 'px-4 py-3'
              }`}
            >
              <Plus className="size-6" />
              <span className="text-sm font-medium">Crear nuevo</span>
            </button>
          )}

          {visibles.map((g) => (
            <div
              key={g.id}
              className="group relative rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-[#22C4D3]/40 hover:bg-white/[0.05]"
            >
              <button
                type="button"
                onClick={() => setPorEliminar({ id: g.id, nombre: g.nombre })}
                disabled={eliminando === g.id}
                title="Eliminar grupo"
                aria-label={`Eliminar grupo ${g.nombre}`}
                className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
              >
                {eliminando === g.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
              <Link
                href={`/dashboard/super-admin/grupos/${g.id}`}
                className="block p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2 pr-8">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#22C4D3]">
                    <Folder className="size-5" />
                  </span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-[#22C4D3]">
                  {g.nombre}
                </h3>
                <p className="mt-0.5 text-xs text-white/45">
                  {fmtRango(g.fechaInicio, g.fechaFin)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <Users className="size-3.5" />
                    {g.miembros}
                  </span>
                  {g.programa && (
                    <span className="rounded-full border border-[#22C4D3]/30 bg-[#22C4D3]/10 px-2 py-0.5 text-[11px] text-[#22C4D3]">
                      {g.programa}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}

          {visibles.length === 0 && tab === 'archivados' && (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50 sm:col-span-2">
              No hay grupos archivados.
            </div>
          )}
        </div>
      )}

      {crearAbierto && (
        <ModalCrearGrupo
          onCerrar={() => setCrearAbierto(false)}
          onCreado={() => {
            setCrearAbierto(false);
            void cargar();
          }}
        />
      )}

      {porEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => eliminando === null && setPorEliminar(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#061c37] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <Trash2 className="size-4" />
              </span>
              <h2 className="text-lg font-bold text-white">Eliminar grupo</h2>
            </div>
            <p className="text-sm text-white/70">
              ¿Seguro que quieres eliminar el grupo{' '}
              <span className="font-semibold text-white">
                “{porEliminar.nombre}”
              </span>
              ? Se borran sus miembros, sesiones y asistencia. Esta acción no se
              puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPorEliminar(null)}
                disabled={eliminando !== null}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarEliminar()}
                disabled={eliminando !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {eliminando !== null ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
