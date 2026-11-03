'use client';

import { useState } from 'react';

import { FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';
import useSWR from 'swr';

import CourseListAdmin from '~/app/dashboard/super-admin/components/CourseListAdmin';
import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';
import { normalizeSearch } from '~/lib/utils';

import type { CourseData } from '~/server/queries/queries';

// "Gestión de Cursos" de una academia: la misma pantalla de Artiefy (lista
// CourseListAdmin + modal ModalFormCourse), con los datos de academy_courses y
// los catálogos de la academia. Los colores salen del tema de la academia.

interface Curso {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImageKey: string | null;
  coverVideoCourseKey: string | null;
  categoryid: number;
  categoryName: string | null;
  modalidadesid: number;
  nivelid: number;
  scheduleOptionId: number | null;
  spaceOptionId: number | null;
  certificationTypeId: number | null;
  instructor: string | null;
  instructorName: string | null;
  creatorId: string;
  individualPrice: number | null;
  isActive: boolean;
  visibility: boolean;
}

interface Formulario {
  id: number | null;
  title: string;
  subtitle: string;
  description: string;
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
  coverImageKey: string;
  coverVideoCourseKey: string | null;
  individualPrice: number | null;
  instructors: string[];
  horario: number | null;
  espacios: number | null;
  certificationTypeId: number | null;
  isActive: boolean;
  visibility: boolean;
}

const VACIO: Formulario = {
  id: null,
  title: '',
  subtitle: '',
  description: '',
  categoryid: 0,
  modalidadesid: 0,
  nivelid: 0,
  coverImageKey: '',
  coverVideoCourseKey: null,
  individualPrice: null,
  instructors: [],
  horario: null,
  espacios: null,
  certificationTypeId: null,
  isActive: true,
  visibility: true,
};

const desdeCurso = (c: Curso): Formulario => ({
  id: c.id,
  title: c.title,
  subtitle: c.subtitle ?? '',
  description: c.description ?? '',
  categoryid: c.categoryid,
  modalidadesid: c.modalidadesid,
  nivelid: c.nivelid,
  coverImageKey: c.coverImageKey ?? '',
  coverVideoCourseKey: c.coverVideoCourseKey,
  individualPrice: c.individualPrice,
  instructors: c.instructor ? [c.instructor] : [],
  horario: c.scheduleOptionId,
  espacios: c.spaceOptionId,
  certificationTypeId: c.certificationTypeId,
  isActive: c.isActive,
  visibility: c.visibility,
});

const tarjeta = 'rounded-lg border border-border bg-card p-4 shadow-lg sm:p-6';
const campo =
  'w-full rounded-md border border-primary/30 bg-background px-4 py-2 text-white outline-none placeholder:text-[#94A3B8] focus:border-primary';

export function CursosAcademia({ slug }: { slug: string }) {
  const api = `/api/academia/${slug}/cursos`;
  const { data: cursos, mutate } = useSWR(api, async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudieron cargar los cursos');
    return ((await res.json()) as { cursos: Curso[] }).cursos;
  });
  const { data: categorias } = useSWR(
    `/api/academia/${slug}/catalogos/categorias`,
    async (url: string) =>
      (await (await fetch(url)).json()) as { id: number; name: string }[]
  );
  // Educadores de la academia (los instructores posibles de un curso).
  const { data: educadores } = useSWR(
    `/api/academia/${slug}/usuarios`,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      const j = (await res.json()) as {
        usuarios: {
          userId: string;
          name: string | null;
          email: string;
          role: string;
        }[];
      };
      return j.usuarios
        .filter((u) => u.role === 'educador')
        .map((u) => ({ id: u.userId, name: u.name ?? u.email }));
    }
  );

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<Formulario>(VACIO);
  const [guardando, setGuardando] = useState(false);

  const set =
    <K extends keyof Formulario>(k: K) =>
    (v: Formulario[K]) =>
      setForm((f) => ({ ...f, [k]: v }));

  const visibles = (cursos ?? []).filter(
    (c) =>
      (!categoria || String(c.categoryid) === categoria) &&
      normalizeSearch(`${c.title} ${c.description ?? ''}`).includes(
        normalizeSearch(busqueda)
      )
  );

  // Mismo contrato que el modal de Artiefy: los campos llegan por argumentos
  // (la imagen ya viene subida a S3 como coverImageKey).
  const guardar = async (
    ...args: Parameters<
      React.ComponentProps<typeof ModalFormCourse>['onSubmitAction']
    >
  ) => {
    const [
      ,
      title,
      description,
      ,
      categoryid,
      modalidadesid,
      nivelid,
      ,
      ,
      coverImageKey,
      ,
      ,
      isActive,
      ,
      coverVideoCourseKey,
      individualPrice,
      ,
      horario,
      espacios,
      certificationTypeId,
      ,
      visibility,
      subtitle,
    ] = args;
    setGuardando(true);
    try {
      const res = await fetch(form.id ? `${api}/${form.id}` : api, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          description,
          categoryid,
          modalidadesid,
          nivelid,
          coverImageKey,
          coverVideoCourseKey,
          individualPrice,
          horario,
          espacios,
          certificationTypeId,
          isActive,
          visibility,
          instructor: form.instructors[0] ?? null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar el curso');
      toast.success(form.id ? 'Curso actualizado' : 'Curso creado');
      setAbierto(false);
      await mutate();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

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
            Educadores
          </h2>
          <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {educadores?.length ?? '…'}
          </p>
        </div>
        <div className={tarjeta}>
          <h2 className="text-base font-semibold text-[#94A3B8] sm:text-lg">
            Filtrar por Categoría
          </h2>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
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
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cursos..."
            className={campo}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(VACIO);
            setAbierto(true);
          }}
          className="group/button relative inline-flex size-full min-h-11 items-center justify-center gap-2 overflow-hidden rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary transition-all hover:bg-primary/20"
        >
          <span className="relative z-10 font-medium">Crear Curso</span>
          <FiPlus className="relative z-10 size-4" />
        </button>
      </div>

      {cursos && visibles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-[#94A3B8]">
          {cursos.length === 0
            ? 'Todavía no hay cursos. Crea las categorías, modalidades y niveles en Configuraciones y luego tu primer curso.'
            : 'Ningún curso coincide con la búsqueda.'}
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
            const c = cursos?.find((x) => x.id === curso?.id);
            if (!c) return;
            setForm(desdeCurso(c));
            setAbierto(true);
          }}
          onDeleteCourse={() => undefined}
        />
      )}

      {abierto && (
        <ModalFormCourse
          academiaSlug={slug}
          isOpen={abierto}
          onCloseAction={() => setAbierto(false)}
          onSubmitAction={guardar}
          uploading={guardando}
          editingCourseId={form.id}
          title={form.title}
          setTitle={set('title')}
          subtitle={form.subtitle}
          setSubtitle={set('subtitle')}
          description={form.description}
          setDescription={set('description')}
          categoryid={form.categoryid}
          setCategoryid={set('categoryid')}
          modalidadesid={form.modalidadesid}
          setModalidadesid={set('modalidadesid')}
          nivelid={form.nivelid}
          setNivelid={set('nivelid')}
          coverImageKey={form.coverImageKey}
          setCoverImageKey={set('coverImageKey')}
          coverVideoCourseKey={form.coverVideoCourseKey}
          setCoverVideoCourseKey={set('coverVideoCourseKey')}
          individualPrice={form.individualPrice}
          setIndividualPrice={set('individualPrice')}
          instructors={form.instructors}
          setInstructors={set('instructors')}
          educators={educadores ?? []}
          horario={form.horario}
          setHorario={set('horario')}
          espacios={form.espacios}
          setEspacios={set('espacios')}
          certificationTypeId={form.certificationTypeId}
          setCertificationTypeId={set('certificationTypeId')}
          isActive={form.isActive}
          setIsActive={set('isActive')}
          visibility={form.visibility}
          setVisibility={set('visibility')}
          // Solo de Artiefy (ocultos con academiaSlug).
          rating={0}
          setRating={() => undefined}
          parametros={[]}
          setParametrosAction={() => undefined}
          courseTypeId={[]}
          setCourseTypeId={() => undefined}
          subjects={[]}
          setSubjects={() => undefined}
          idTypesCourses={null}
          setIdTypesCourses={() => undefined}
        />
      )}
    </div>
  );
}
