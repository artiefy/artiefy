'use client';

import { useState } from 'react';

import { FiPlus } from 'react-icons/fi';
import useSWR from 'swr';

import CourseListAdmin from '~/app/dashboard/super-admin/components/CourseListAdmin';
import { SkeletonCard } from '~/components/super-admin/layout/SkeletonCard';
import { normalizeSearch } from '~/lib/utils';

import {
  type CursoAcademiaApi,
  ModalCursoAcademia,
} from './ModalCursoAcademia';

import type { CourseData } from '~/server/queries/queries';

// "Gestión de Cursos" de una academia: la misma pantalla de Artiefy (lista
// CourseListAdmin + modal ModalFormCourse), con los datos de academy_courses y
// los catálogos de la academia. Los colores salen del tema de la academia.

const POR_PAGINA = 6;

const tarjeta = 'rounded-lg border border-border bg-card p-4 shadow-lg sm:p-6';
const campo =
  'w-full rounded-md border border-primary/30 bg-background px-4 py-2 text-white outline-none placeholder:text-[#94A3B8] focus:border-primary';

export function CursosAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/cursos`;
  const { data: datos, mutate } = useSWR(
    [api, 'lista'],
    async ([url]: [string, string]) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudieron cargar los cursos');
      return (await res.json()) as {
        cursos: (CursoAcademiaApi & {
          programas?: { id: number; title: string }[];
        })[];
        totalEstudiantes?: number;
      };
    }
  );
  const cursos = datos?.cursos;
  const { data: categorias } = useSWR(
    `/api/academia/${slug}/catalogos/categorias`,
    async (url: string) =>
      (await (await fetch(url)).json()) as { id: number; name: string }[]
  );

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  // Como en Artiefy: cursos independientes o en programas, 6 por página.
  const [enProgramas, setEnProgramas] = useState(false);
  const [pagina, setPagina] = useState(1);
  // undefined: modal cerrado; null: crear; curso: editar.
  const [editando, setEditando] = useState<CursoAcademiaApi | null>();

  const filtrados = (cursos ?? []).filter(
    (c) =>
      (!categoria || String(c.categoryid) === categoria) &&
      normalizeSearch(c.title).includes(normalizeSearch(busqueda)) &&
      (c.programas?.length ?? 0) > 0 === enProgramas
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  return (
    <div className="p-4 sm:p-6">
      <header className="group relative overflow-hidden rounded-lg p-[1px]">
        <div className="absolute -inset-0.5 animate-gradient bg-gradient-to-r from-primary via-primary/60 to-background opacity-75 blur transition duration-500" />
        <div className="relative flex flex-col items-start justify-between rounded-lg border border-border bg-card p-4 text-white shadow-lg sm:flex-row sm:items-center sm:p-6">
          <h1 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-primary sm:text-2xl lg:text-3xl">
            Gestión de Cursos
          </h1>
        </div>
      </header>

      <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={tarjeta}>
          <h2 className="text-base font-semibold text-[#94A3B8] sm:text-lg">
            Total de Cursos
          </h2>
          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {cursos?.length ?? '…'}
          </p>
        </div>
        <div className={tarjeta}>
          <h2 className="text-base font-semibold text-[#94A3B8] sm:text-lg">
            Estudiantes Inscritos
          </h2>
          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {datos?.totalEstudiantes ?? '…'}
          </p>
        </div>
        <div className={tarjeta}>
          <h2 className="text-base font-semibold text-[#94A3B8] sm:text-lg">
            Filtrar por Categoría
          </h2>
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              setPagina(1);
            }}
            className={`${campo} mt-2 [&>option]:bg-background`}
          >
            <option value="">Todas</option>
            {(categorias ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 rounded-lg border border-border bg-card p-4 shadow-lg lg:col-span-3">
          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar cursos..."
            className={campo}
          />
        </div>
        <button
          type="button"
          onClick={() => setEditando(null)}
          className="group/button relative inline-flex size-full min-h-11 items-center justify-center gap-2 overflow-hidden rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary transition-all hover:bg-primary/20"
        >
          <span className="relative z-10 font-medium">Crear Curso</span>
          <FiPlus className="relative z-10 size-4" />
        </button>
      </div>

      <div className="mb-6 flex justify-center gap-4">
        {[
          { valor: false, texto: 'Cursos Independientes' },
          { valor: true, texto: 'Cursos en Programas' },
        ].map((b) => (
          <button
            key={b.texto}
            type="button"
            onClick={() => {
              setEnProgramas(b.valor);
              setPagina(1);
            }}
            className={`rounded-md border px-4 py-2 transition-colors ${
              enProgramas === b.valor
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-[#94A3B8] hover:text-white'
            }`}
          >
            {b.texto}
          </button>
        ))}
      </div>

      {!cursos ? (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : cursos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-[#94A3B8]">
          Todavía no hay cursos. Crea las categorías, modalidades y niveles en
          Configuraciones y luego tu primer curso.
        </p>
      ) : (
        <CourseListAdmin
          courses={visibles.map((c) => ({
            ...c,
            categoryName: c.categoryName ?? undefined,
            instructor: c.instructor ?? undefined,
            instructorName: c.instructorName ?? undefined,
          }))}
          urlModalidades={`/api/academia/${slug}/catalogos/modalidades`}
          hrefCurso={(id) => `/dashboard/super-admin/cursos/${id}`}
          onEditCourse={(curso: CourseData | null) => {
            const c = cursos.find((x) => x.id === curso?.id);
            if (c) setEditando(c);
          }}
          onDeleteCourse={() => undefined}
        />
      )}

      {cursos && cursos.length > 0 && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="rounded-md border border-border bg-card px-4 py-2 text-white transition-colors hover:bg-background disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="flex items-center text-white">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="rounded-md border border-border bg-card px-4 py-2 text-white transition-colors hover:bg-background disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {editando !== undefined && (
        <ModalCursoAcademia
          slug={slug}
          curso={editando}
          onClose={() => setEditando(undefined)}
          onSaved={async () => {
            await mutate();
          }}
        />
      )}
    </div>
  );
}
