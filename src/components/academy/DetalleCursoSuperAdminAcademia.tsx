'use client';

import { useState, useSyncExternalStore } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ChevronRight,
  Loader2,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { normalizeSearch } from '~/lib/utils';
import { type CursoDetalle } from '~/server/academy/cursos';

import {
  type CursoAcademiaApi,
  ModalCursoAcademia,
  useEducadoresAcademia,
} from './ModalCursoAcademia';
import { PestanasCursoAcademia } from './PestanasCursoAcademia';

// Detalle de un curso para el super-admin de la academia, con la misma
// estructura que el detalle de super-admin de Artiefy: migas, tarjeta con
// título/descripción/chips y tema visual, portada con acciones a la derecha y
// los instructores debajo. Las lecciones aún no existen en las academias.

const TEMAS = ['#1f2937', '#000000', '#FFFFFF'];
const chip =
  'inline-flex items-center gap-1.5 rounded-full border border-[var(--ac-primario)]/40 px-3 py-1.5 text-xs font-medium text-white';

// Tema visual por curso, guardado en este navegador (como en Artiefy).
const claveTema = (id: number) => `selectedColor_academia_${id}`;
const oyentesTema = new Set<() => void>();
const suscribirTema = (cb: () => void) => {
  oyentesTema.add(cb);
  return () => oyentesTema.delete(cb);
};
const leerTema = (id: number) => {
  try {
    return localStorage.getItem(claveTema(id)) ?? '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
};
const guardarTema = (id: number, color: string) => {
  try {
    localStorage.setItem(claveTema(id), color);
  } catch {
    // Sin almacenamiento: el tema no se recuerda.
  }
  oyentesTema.forEach((cb) => cb());
};

export function DetalleCursoSuperAdminAcademia({
  slug,
  curso,
}: {
  slug: string;
  curso: CursoDetalle;
}) {
  const router = useRouter();
  const [descripcionAbierta, setDescripcionAbierta] = useState(false);
  const tema = useSyncExternalStore(
    suscribirTema,
    () => leerTema(curso.id),
    () => '#FFFFFF'
  );
  const [editando, setEditando] = useState<CursoAcademiaApi | null>(null);
  const [cargandoEditar, setCargandoEditar] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  // Instructores (chips con ✕ y modal "Agregar instructor", como Artiefy).
  const { data: educadores } = useEducadoresAcademia(slug);
  // Vienen del servidor: tras guardar, router.refresh() las actualiza.
  const instructores = curso.instructores;
  const [agregandoInstructor, setAgregandoInstructor] = useState(false);
  const [busquedaInstructor, setBusquedaInstructor] = useState('');
  const [actualizando, setActualizando] = useState(false);

  const api = `/api/academia/${slug}/cursos`;
  const portada = curso.coverImageKey
    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${curso.coverImageKey}`
    : null;

  const cambiarTema = (color: string) => guardarTema(curso.id, color);

  // El modal necesita los ids de los catálogos: se toman de la lista.
  const abrirEditar = async () => {
    setCargandoEditar(true);
    try {
      const res = await fetch(api);
      const j = (await res.json()) as { cursos?: CursoAcademiaApi[] };
      const c = j.cursos?.find((x) => x.id === curso.id);
      if (!c) throw new Error('No se encontró el curso');
      setEditando(c);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCargandoEditar(false);
    }
  };

  const guardarInstructores = async (lista: string[], mensaje: string) => {
    if (lista.length === 0) {
      toast.error('Debe haber al menos un instructor');
      return;
    }
    setActualizando(true);
    try {
      const res = await fetch(`${api}/${curso.id}/instructores`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructors: lista }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(j.error ?? 'Error al actualizar instructores');
      }
      toast.success(mensaje);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setActualizando(false);
    }
  };
  const nombreDe = (id: string) =>
    educadores?.find((e) => e.id === id)?.name ??
    (id === curso.instructor ? curso.instructorName : null) ??
    id;
  const quitar = (id: string) =>
    void guardarInstructores(
      instructores.filter((x) => x !== id),
      'Instructor removido'
    );
  const cerrarAgregar = () => {
    setAgregandoInstructor(false);
    setBusquedaInstructor('');
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      const res = await fetch(`${api}/${curso.id}`, { method: 'DELETE' });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo eliminar el curso');
      toast.success('Curso eliminado');
      router.push('/dashboard/super-admin/cursos');
    } catch (error) {
      toast.error((error as Error).message);
      setEliminando(false);
    }
  };

  const ficha: [string, string | null][] = [
    ['Horario', curso.horario],
    ['Espacio', curso.espacio],
    [
      'Precio',
      curso.individualPrice != null
        ? `$${curso.individualPrice.toLocaleString('es-CO')}`
        : null,
    ],
    ['Visibilidad', curso.visibility ? 'Visible' : 'Oculto'],
    ['Estado', curso.isActive ? 'Activo' : 'Inactivo'],
  ];

  const portadaYAcciones = (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)]">
      <div className="group relative aspect-[2/1] w-full overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-20" />
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portada}
            alt={curso.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--ac-primario)]/20 to-[var(--ac-superficie)] text-4xl">
            📚
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        <button
          type="button"
          onClick={() => void abrirEditar()}
          disabled={cargandoEditar}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--ac-primario)]/40 bg-[var(--ac-primario)]/10 px-3 py-2 text-xs font-semibold text-[var(--ac-primario)] transition-all hover:bg-[var(--ac-primario)]/20 disabled:opacity-50"
        >
          {cargandoEditar ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            '✏️'
          )}{' '}
          Editar
        </button>
        <button
          type="button"
          disabled
          title="Próximamente"
          className="w-full rounded-lg border border-[var(--ac-borde)] bg-[var(--ac-fondo)] px-3 py-2 text-xs font-semibold text-white/50"
        >
          Stats
        </button>
        <button
          type="button"
          onClick={() => setConfirmarEliminar(true)}
          className="col-span-2 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
        >
          🗑️ Eliminar curso
        </button>
      </div>

      <dl className="divide-y divide-[var(--ac-borde)] border-t border-[var(--ac-borde)]">
        {ficha
          .filter(([, valor]) => valor)
          .map(([etiqueta, valor]) => (
            <div
              key={etiqueta}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <dt className="text-[#94A3B8]">{etiqueta}</dt>
              <dd className="text-right font-medium text-white">{valor}</dd>
            </div>
          ))}
      </dl>
    </div>
  );

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/dashboard/super-admin"
          className="text-[var(--ac-primario)] hover:opacity-80"
        >
          Inicio
        </Link>
        <ChevronRight className="size-4 text-white/40" />
        <Link
          href="/dashboard/super-admin/cursos"
          className="text-[var(--ac-primario)] hover:opacity-80"
        >
          Cursos
        </Link>
        <ChevronRight className="size-4 text-white/40" />
        <span className="text-white/60">Detalles</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--ac-borde)] bg-[var(--ac-superficie)] p-4 shadow-2xl sm:p-8">
            <div className="space-y-4">
              <h1 className="text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl">
                {curso.title}
              </h1>
              {curso.subtitle && (
                <p className="text-lg text-white/80">{curso.subtitle}</p>
              )}
              {curso.description && (
                <p
                  onClick={() => setDescripcionAbierta((v) => !v)}
                  className={`max-w-2xl cursor-pointer text-base whitespace-pre-line text-[#94A3B8] transition-all hover:text-white ${
                    descripcionAbierta ? '' : 'line-clamp-1'
                  }`}
                  title={
                    descripcionAbierta
                      ? 'Clic para contraer'
                      : 'Clic para ver la descripción completa'
                  }
                >
                  {curso.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {curso.categoria && (
                  <span className={chip}>{curso.categoria}</span>
                )}
                {curso.nivel && <span className={chip}>{curso.nivel}</span>}
                {curso.modalidad && (
                  <span className={chip}>{curso.modalidad}</span>
                )}
                <span className={chip}>
                  {curso.certificacion ?? 'Sin certificación'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                <span className="text-xs font-bold tracking-wider text-[var(--ac-primario)] uppercase">
                  Tema Visual
                </span>
                <div className="flex flex-wrap gap-2">
                  {TEMAS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => cambiarTema(color)}
                      style={{ backgroundColor: color }}
                      className={`size-8 rounded-lg border-2 transition-all duration-300 hover:scale-125 ${
                        tema === color
                          ? 'scale-110 border-white shadow-lg ring-2 ring-[var(--ac-primario)] ring-offset-2'
                          : 'border-white/20 hover:border-[var(--ac-primario)]'
                      }`}
                      title={`Cambiar tema a ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 lg:hidden">{portadaYAcciones}</div>
          </div>

          <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto pb-2">
            {instructores.length > 0 ? (
              instructores.map((id) => (
                <span
                  key={id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--ac-primario)]/40 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white"
                >
                  {nombreDe(id)}
                  <button
                    type="button"
                    disabled={actualizando}
                    onClick={() => quitar(id)}
                    className="text-white/40 transition-colors hover:text-red-400 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </span>
              ))
            ) : (
              <span className="shrink-0 text-xs whitespace-nowrap text-white/50">
                Sin instructores asignados
              </span>
            )}
            <button
              type="button"
              onClick={() => setAgregandoInstructor(true)}
              disabled={actualizando}
              className="shrink-0 rounded-full border border-[var(--ac-primario)]/40 bg-[var(--ac-primario)]/10 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[var(--ac-primario)] transition-colors hover:bg-[var(--ac-primario)]/20 disabled:opacity-50"
            >
              + Agregar instructor
            </button>
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-20 lg:block">
          {portadaYAcciones}
        </aside>
      </div>

      <PestanasCursoAcademia slug={slug} courseId={curso.id} tema={tema} />

      {agregandoInstructor && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={cerrarAgregar}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--ac-superficie)] shadow-2xl ring-1 shadow-black/50 ring-[var(--ac-primario)]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[var(--ac-primario)]/15 to-transparent px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-[var(--ac-primario)]/20 text-[var(--ac-primario)]">
                  <UserPlus className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Agregar instructor
                  </h3>
                  <p className="text-xs text-white/50">
                    Busca y selecciona un educador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarAgregar}
                className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  autoFocus
                  value={busquedaInstructor}
                  onChange={(e) => setBusquedaInstructor(e.target.value)}
                  placeholder="Buscar por nombre o correo..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder:text-white/40 focus:border-[var(--ac-primario)]/60 focus:ring-2 focus:ring-[var(--ac-primario)]/20 focus:outline-none"
                />
              </div>
            </div>
            {instructores.length > 0 && (
              <div className="px-5 pb-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-white/40 uppercase">
                  Instructores actuales
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {instructores.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ac-primario)]/30 bg-[var(--ac-primario)]/10 py-1 pr-1.5 pl-3 text-xs font-medium text-white"
                    >
                      {nombreDe(id)}
                      <button
                        type="button"
                        disabled={actualizando}
                        onClick={() => quitar(id)}
                        className="rounded-full p-0.5 text-white/50 transition-colors hover:bg-white/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <ListaEducadores
              educadores={(educadores ?? []).filter(
                (e) => !instructores.includes(e.id)
              )}
              busqueda={busquedaInstructor}
              deshabilitado={actualizando}
              onElegir={(id) =>
                void guardarInstructores(
                  [...instructores, id],
                  'Instructor agregado'
                )
              }
            />
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !eliminando && setConfirmarEliminar(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[var(--ac-superficie)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <Trash2 className="size-4" />
              </span>
              <h2 className="text-lg font-bold text-white">¿Estás seguro?</h2>
            </div>
            <p className="text-sm text-white/70">
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              curso <span className="font-bold text-white">{curso.title}</span>{' '}
              y todos los datos asociados a este.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmarEliminar(false)}
                disabled={eliminando}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void eliminar()}
                disabled={eliminando}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {eliminando ? (
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

      {editando && (
        <ModalCursoAcademia
          slug={slug}
          curso={editando}
          onClose={() => setEditando(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function ListaEducadores({
  educadores,
  busqueda,
  deshabilitado,
  onElegir,
}: {
  educadores: { id: string; name: string; email: string }[];
  busqueda: string;
  deshabilitado: boolean;
  onElegir: (id: string) => void;
}) {
  const filtrados = educadores.filter((e) =>
    normalizeSearch(`${e.name} ${e.email}`).includes(normalizeSearch(busqueda))
  );
  return (
    <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
      {educadores.length === 0 ? (
        <p className="p-6 text-center text-sm text-white/40">
          No hay más educadores disponibles
        </p>
      ) : filtrados.length === 0 ? (
        <p className="p-6 text-center text-sm text-white/40">
          No se encontraron educadores
        </p>
      ) : (
        filtrados.map((e) => (
          <button
            key={e.id}
            type="button"
            disabled={deshabilitado}
            onClick={() => onElegir(e.id)}
            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ac-primario)]/20 text-sm font-semibold text-[var(--ac-primario)]">
              {e.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {e.name}
              </p>
              <p className="truncate text-xs text-white/50">{e.email}</p>
            </span>
          </button>
        ))
      )}
    </div>
  );
}
