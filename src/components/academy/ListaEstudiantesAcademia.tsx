'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  ChevronDown,
  Columns3,
  Download,
  GraduationCap,
  Loader2,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { type EstudianteAcademia } from '~/server/academy/estudiantes';

import { enviar, Modal, useCursosAcademia } from './seccion/comun';

// Lista de estudiantes de una academia: la misma pantalla que "Gestión de
// Builders" de Artiefy (barra de acciones, chips de estado, buscador y tabla
// con selección), con los colores de la marca de la academia.

type Filtro = 'todos' | 'activos' | 'inactivos' | 'sin-cursos';

const COLUMNAS = [
  ['nombre', 'Nombre'],
  ['correo', 'Correo'],
  ['cursos', 'Cursos'],
  ['estado', 'Estado'],
  ['registro', 'Fecha de registro'],
] as const;
type Columna = (typeof COLUMNAS)[number][0];

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Mismas píldoras que la barra de Builders (border/bg con la marca).
const pildora =
  'inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2.5 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3';
const pildoraBase = `${pildora} border-[var(--ac-borde)] bg-[var(--ac-superficie)] text-white hover:border-[var(--ac-primario)]/50 hover:text-[var(--ac-primario)]`;

export function ListaEstudiantesAcademia({
  slug,
  estudiantes,
}: {
  slug: string;
  estudiantes: EstudianteAcademia[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [visibles, setVisibles] = useState<Columna[]>(COLUMNAS.map(([c]) => c));
  const [columnasAbierto, setColumnasAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [matriculando, setMatriculando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const pasaFiltro = (e: EstudianteAcademia, f: Filtro) =>
    f === 'todos' ||
    (f === 'activos' && e.activo) ||
    (f === 'inactivos' && !e.activo) ||
    (f === 'sin-cursos' && e.cursos.length === 0);
  const filas = estudiantes.filter(
    (e) =>
      pasaFiltro(e, filtro) &&
      (!q ||
        (e.name ?? '').toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.cursos.some((c) => c.title.toLowerCase().includes(q)))
  );

  const chips: [Filtro, string][] = [
    ['todos', 'Todos'],
    ['activos', 'Activos'],
    ['inactivos', 'Desactivados'],
    ['sin-cursos', 'Sin cursos'],
  ];

  const todosMarcados =
    filas.length > 0 && filas.every((e) => seleccion.includes(e.userId));

  const exportar = () => {
    const lista = seleccion.length
      ? estudiantes.filter((e) => seleccion.includes(e.userId))
      : filas;
    const celda = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      ['Nombre', 'Correo', 'Cursos', 'Estado', 'Registro'].join(','),
      ...lista.map((e) =>
        [
          celda(e.name ?? ''),
          celda(e.email),
          celda(e.cursos.map((c) => c.title).join(' | ')),
          celda(e.activo ? 'Activo' : 'Desactivado'),
          celda(fmtFecha(e.fecha)),
        ].join(',')
      ),
    ].join('\n');
    const url = URL.createObjectURL(
      new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estudiantes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const ver = (c: Columna) => visibles.includes(c);

  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="flex items-center gap-2 text-lg font-bold text-white">
        Gestión de Estudiantes
        <ChevronDown className="size-4 text-white/50" />
      </h1>

      {/* Botones de acción */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCreando(true)}
          className={pildoraBase}
        >
          <UserPlus /> Crear Usuario
        </button>
        <button
          type="button"
          onClick={() => setMatriculando(true)}
          disabled={seleccion.length === 0}
          className={`${pildora} border-blue-500/50 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25`}
        >
          <GraduationCap /> Matricular a Curso
        </button>
        <button
          type="button"
          onClick={() => setColumnasAbierto(true)}
          className={pildoraBase}
        >
          <Columns3 /> Columnas
          {visibles.length < COLUMNAS.length && (
            <span className="rounded-md bg-[var(--ac-primario)]/15 px-1 py-px text-[9px] font-bold text-[var(--ac-primario)]">
              {COLUMNAS.length - visibles.length} ocultas
            </span>
          )}
        </button>
        <button type="button" onClick={exportar} className={pildoraBase}>
          <Download /> Exportar
        </button>
      </div>

      {/* Chips de estado */}
      <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {chips.map(([valor, texto]) => {
          const activo = filtro === valor;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] whitespace-nowrap transition-all ${
                activo
                  ? 'border-[var(--ac-primario)]/70 bg-[var(--ac-primario)]/15 font-semibold text-[var(--ac-primario)]'
                  : 'border-[var(--ac-borde)] bg-[var(--ac-superficie)] text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              {texto}
              <span
                className={`rounded-md px-1 py-px text-[9px] font-semibold tabular-nums ${
                  activo
                    ? 'bg-[var(--ac-primario)]/20'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                {estudiantes.filter((e) => pasaFiltro(e, valor)).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buscador */}
      <div className="relative min-w-[260px]">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-white/50" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o curso…"
          className="h-9 w-full rounded-full border border-[var(--ac-borde)] bg-[var(--ac-superficie)] pr-2.5 pl-8 text-[12px] text-white placeholder:text-white/50 focus:border-[var(--ac-primario)]/60 focus:outline-none"
        />
      </div>

      {/* Tabla */}
      <div className="max-h-[70dvh] w-full overflow-auto border border-[var(--ac-borde)] bg-[var(--ac-superficie)]/40">
        <table className="w-full min-w-max table-auto border-collapse">
          <thead className="sticky top-0 z-10 bg-[var(--ac-superficie)]">
            <tr className="text-[11px] font-semibold tracking-wide text-white/60 uppercase">
              <th className="w-8 border-r border-b border-[var(--ac-borde)] px-2 py-1">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos"
                  checked={todosMarcados}
                  onChange={(e) =>
                    setSeleccion((s) =>
                      e.target.checked
                        ? [...new Set([...s, ...filas.map((f) => f.userId)])]
                        : s.filter((id) => !filas.some((f) => f.userId === id))
                    )
                  }
                  className="accent-[var(--ac-primario)]"
                />
              </th>
              {COLUMNAS.filter(([c]) => ver(c)).map(([c, texto]) => (
                <th
                  key={c}
                  className="border-r border-b border-[var(--ac-borde)] px-3 py-2 text-left"
                >
                  {texto}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs sm:text-sm">
            {filas.length === 0 ? (
              <tr>
                <td
                  colSpan={visibles.length + 1}
                  className="px-4 py-10 text-center text-white/50"
                >
                  {estudiantes.length === 0
                    ? 'Todavía no hay estudiantes en la academia.'
                    : 'Ningún estudiante coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              filas.map((e) => {
                const marcado = seleccion.includes(e.userId);
                return (
                  <tr
                    key={e.id}
                    className={`h-9 text-white [&>td]:border-r [&>td]:border-b [&>td]:border-[var(--ac-borde)] ${
                      marcado
                        ? 'bg-[var(--ac-primario)]/10'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="px-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${e.name ?? e.email}`}
                        checked={marcado}
                        onChange={(ev) =>
                          setSeleccion((s) =>
                            ev.target.checked
                              ? [...s, e.userId]
                              : s.filter((id) => id !== e.userId)
                          )
                        }
                        className="accent-[var(--ac-primario)]"
                      />
                    </td>
                    {ver('nombre') && (
                      <td className="px-3 font-medium whitespace-nowrap">
                        {e.name ?? '—'}
                      </td>
                    )}
                    {ver('correo') && (
                      <td className="px-3 whitespace-nowrap text-white/70">
                        {e.email}
                      </td>
                    )}
                    {ver('cursos') && (
                      <td className="px-3 py-1">
                        {e.cursos.length === 0 ? (
                          <span className="text-white/40">Sin cursos</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {e.cursos.map((c) => (
                              <span
                                key={c.id}
                                title={c.completed ? 'Completado' : 'En curso'}
                                className={`rounded-full px-2 py-0.5 text-[11px] ${
                                  c.completed
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-[var(--ac-primario)]/15 text-[var(--ac-primario)]'
                                }`}
                              >
                                {c.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                    {ver('estado') && (
                      <td className="px-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            e.activo
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                              : 'border-red-500/30 bg-red-500/15 text-red-400'
                          }`}
                        >
                          {e.activo ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                    )}
                    {ver('registro') && (
                      <td className="px-3 whitespace-nowrap text-white/60">
                        {fmtFecha(e.fecha)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {seleccion.length > 0 && (
        <p className="text-xs text-white/60">
          {seleccion.length} seleccionados ·{' '}
          <button
            type="button"
            onClick={() => setSeleccion([])}
            className="text-[var(--ac-primario)] hover:underline"
          >
            Quitar selección
          </button>
        </p>
      )}

      {/* Panel de columnas (igual al de Builders) */}
      {columnasAbierto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setColumnasAbierto(false)}
          />
          <div className="fixed top-0 right-0 z-50 flex h-full w-80 flex-col border-l border-[var(--ac-borde)] bg-[var(--ac-fondo)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ac-borde)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Columnas visibles
                </p>
                <p className="text-xs text-white/50">
                  {visibles.length} de {COLUMNAS.length} seleccionadas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setColumnasAbierto(false)}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto px-5 py-3">
              {COLUMNAS.map(([c, texto]) => {
                const activa = ver(c);
                return (
                  <button
                    key={c}
                    type="button"
                    role="switch"
                    aria-checked={activa}
                    onClick={() =>
                      setVisibles((v) =>
                        activa ? v.filter((x) => x !== c) : [...v, c]
                      )
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/5"
                  >
                    <span className="text-sm text-white/80">{texto}</span>
                    <span
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                        activa ? 'bg-[var(--ac-primario)]' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`inline-block size-4 rounded-full bg-[#ffffff] shadow transition-transform ${
                          activa ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-[var(--ac-borde)] px-5 py-4">
              <button
                type="button"
                onClick={() => setColumnasAbierto(false)}
                className="w-full rounded-xl bg-[var(--ac-primario)] py-2.5 text-sm font-semibold text-[var(--ac-primario-texto)]"
              >
                Listo
              </button>
            </div>
          </div>
        </>
      )}

      {creando && (
        <CrearEstudiante
          slug={slug}
          onClose={() => setCreando(false)}
          onCreado={() => {
            setCreando(false);
            router.refresh();
          }}
        />
      )}
      {matriculando && (
        <MatricularACurso
          slug={slug}
          userIds={seleccion}
          onClose={() => setMatriculando(false)}
          onListo={() => {
            setMatriculando(false);
            setSeleccion([]);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

const campo =
  'h-10 w-full rounded-xl border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--ac-primario)] focus:outline-none';
const boton =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--ac-primario)] px-4 text-sm font-semibold text-[var(--ac-primario-texto)] disabled:opacity-40';

function CrearEstudiante({
  slug,
  onClose,
  onCreado,
}: {
  slug: string;
  onClose: () => void;
  onCreado: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setGuardando(true);
    try {
      const r = (await enviar(`/api/academia/${slug}/usuarios`, 'POST', {
        nombre,
        email,
        rol: 'estudiante',
      })) as { correoEnviado?: boolean };
      toast.success(
        r.correoEnviado
          ? 'Estudiante creado y credenciales enviadas'
          : 'Estudiante agregado'
      );
      onCreado();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Crear Usuario" onClose={onClose} ancho="max-w-md">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-white/70">
            Nombre completo
          </span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={campo}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-white/70">
            Correo
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
          />
        </label>
        <p className="text-xs text-white/50">
          Si el correo ya tiene cuenta, se agrega con esa misma cuenta. Si no,
          se crea y se le envían sus credenciales.
        </p>
        <button
          type="button"
          onClick={() => void crear()}
          disabled={guardando || !nombre.trim() || !email.trim()}
          className={`${boton} w-full`}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Crear estudiante
        </button>
      </div>
    </Modal>
  );
}

function MatricularACurso({
  slug,
  userIds,
  onClose,
  onListo,
}: {
  slug: string;
  userIds: string[];
  onClose: () => void;
  onListo: () => void;
}) {
  const cursos = useCursosAcademia(slug);
  const [courseId, setCourseId] = useState('');
  const [guardando, setGuardando] = useState(false);

  const matricular = async () => {
    setGuardando(true);
    try {
      const r = (await enviar(`/api/academia/${slug}/matriculas`, 'POST', {
        courseId: Number(courseId),
        userIds,
      })) as { matriculados?: number };
      toast.success(`${r.matriculados ?? 0} matriculados en el curso`);
      onListo();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Matricular a Curso" onClose={onClose} ancho="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-white/70">
          {userIds.length} estudiantes seleccionados.
        </p>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className={campo}
        >
          <option value="" className="bg-[var(--ac-fondo)]">
            — Elige un curso —
          </option>
          {cursos.map((c) => (
            <option key={c.id} value={c.id} className="bg-[var(--ac-fondo)]">
              {c.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void matricular()}
          disabled={guardando || !courseId}
          className={`${boton} w-full`}
        >
          {guardando && <Loader2 className="size-4 animate-spin" />}
          Matricular
        </button>
      </div>
    </Modal>
  );
}
