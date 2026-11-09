'use client';

import { useState } from 'react';

import { toast } from 'sonner';
import useSWR from 'swr';

import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';

// Modal de crear/editar un curso de la academia: el mismo ModalFormCourse de
// Artiefy, con los datos de academy_courses. Lo usan la lista de cursos y el
// detalle del curso.

/** Curso tal como lo devuelve GET /api/academia/[slug]/cursos. */
export interface CursoAcademiaApi {
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
  // Principal + adicionales (academy_course_instructors) y rating 0-5.
  instructores?: string[];
  rating?: number;
}

interface Parametro {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  numberOfActivities: number;
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
  rating: number;
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
  rating: 0,
};

const desdeCurso = (c: CursoAcademiaApi): Formulario => ({
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
  instructors: c.instructores ?? (c.instructor ? [c.instructor] : []),
  horario: c.scheduleOptionId,
  espacios: c.spaceOptionId,
  certificationTypeId: c.certificationTypeId,
  isActive: c.isActive,
  visibility: c.visibility,
  rating: c.rating ?? 0,
});

// Fijos: un `[]` nuevo por render re-dispara efectos del modal (que copian
// las props al formulario) y entra en bucle.
const SIN_EDUCADORES: { id: string; name: string; email: string }[] = [];
const SIN_TIPOS: number[] = [];
const SIN_MATERIAS: { id: number }[] = [];

/** Educadores de la academia (los instructores posibles de un curso). */
export function useEducadoresAcademia(slug: string) {
  // Clave propia: GestorUsuarios cachea la misma URL con otra forma.
  return useSWR(
    [`/api/academia/${slug}/usuarios`, 'educadores'],
    async ([url]: [string, string]) => {
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
        .map((u) => ({
          id: u.userId,
          name: u.name ?? u.email,
          email: u.email,
        }));
    }
  );
}

export function ModalCursoAcademia({
  slug,
  curso,
  onClose,
  onSaved,
}: {
  slug: string;
  // null: crear un curso nuevo.
  curso: CursoAcademiaApi | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const api = `/api/academia/${slug}/cursos`;
  const { data: educadores } = useEducadoresAcademia(slug);
  const [form, setForm] = useState<Formulario>(() =>
    curso ? desdeCurso(curso) : VACIO
  );
  const [guardando, setGuardando] = useState(false);
  // Parámetros de evaluación del curso (como en Artiefy, se guardan después
  // del curso).
  const [parametros, setParametros] = useState<Parametro[]>([]);
  useSWR(
    curso ? [`${api}/${curso.id}/parametros`, 'parametros'] : null,
    async ([url]: [string, string]) => {
      const res = await fetch(url);
      return res.ok ? ((await res.json()) as Parametro[]) : [];
    },
    { revalidateOnFocus: false, onSuccess: setParametros }
  );

  const set =
    <K extends keyof Formulario>(k: K) =>
    (v: Formulario[K]) =>
      setForm((f) => ({ ...f, [k]: v }));

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
      rating,
      addParametros,
      coverImageKey,
      ,
      ,
      isActive,
      ,
      coverVideoCourseKey,
      individualPrice,
      parametrosForm,
      horario,
      espacios,
      certificationTypeId,
      ,
      visibility,
      subtitle,
    ] = args;
    if (addParametros && parametrosForm.length === 0) {
      toast.error('Error', {
        description: 'Debe agregar al menos un parámetro de evaluación',
      });
      return;
    }
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
          rating,
          instructors: form.instructors,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: number;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo guardar el curso');
      toast.success(form.id ? 'Curso actualizado' : 'Curso creado', {
        description: form.id
          ? 'El curso se actualizó con éxito'
          : 'El curso se creó con éxito',
      });
      // Parámetros: se guardan si el curso es calificable; si dejó de serlo,
      // se borran los que tenía.
      const courseId = form.id ?? j.id;
      if (courseId && (addParametros || parametros.length > 0)) {
        const resP = await fetch(`${api}/${courseId}/parametros`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addParametros ? parametrosForm : []),
        });
        const jp = (await resP.json().catch(() => ({}))) as { error?: string };
        if (resP.ok) {
          if (addParametros) toast.success('Parámetro creado exitosamente');
        } else {
          toast.error('Error al crear el parámetro', {
            description: jp.error ?? 'Intenta de nuevo',
          });
        }
      }
      onClose();
      await onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalFormCourse
      academiaSlug={slug}
      isOpen
      onCloseAction={onClose}
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
      educators={educadores ?? SIN_EDUCADORES}
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
      // Solo de Artiefy (planes y materias; ocultos con academiaSlug).
      rating={form.rating}
      setRating={set('rating')}
      parametros={parametros}
      setParametrosAction={setParametros}
      courseTypeId={SIN_TIPOS}
      setCourseTypeId={() => undefined}
      subjects={SIN_MATERIAS}
      setSubjects={() => undefined}
      idTypesCourses={null}
      setIdTypesCourses={() => undefined}
    />
  );
}
