'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { Building2, Copy, Loader2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

import { AspectRatio } from '~/components/educators/ui/aspect-ratio';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/educators/ui/card';
import { Button } from '~/components/estudiantes/ui/button';
import { useMarca } from '~/components/marca/MarcaProvider';
import {
  type EnvioAcademia,
  ModalEnviarAcademia,
} from '~/components/super-admin/modals/ModalEnviarAcademia';
import { type CourseData } from '~/server/queries/queries';

import type { Route } from 'next';

interface Course {
  id?: number;
  title: string;
  description?: string | null;
  coverImageKey: string | null;
  categoryid: number;
  instructor?: string; // Made optional for compatibility with instructors array
  instructors?: string[]; // New field for multiple instructors
  createdAt?: string | Date;
  updatedAt?: string | Date;
  creatorId: string;
  rating?: number | null;
  modalidadesid: number;
  nivelid: number; // Replaced  with nivelid
  categoryName?: string; // <-- agrégalo aquí
  instructorName?: string;
  courseTypeId?: number | null;
  programas?: { id: number; title: string }[];
  certificationTypeId?: number | null;
  scheduleOptionId?: number | null;
  spaceOptionId?: number | null;
}

interface CourseListAdminProps {
  courses: Course[];
  onEditCourse: (course: CourseData | null) => void; // ✅ Agregar esta línea
  onDeleteCourse: (courseId: number) => void; // ✅ También asegurar que esta está definida
  // Academias: nombres de modalidades desde SU catálogo, y adónde lleva "Ver"
  // (null: sin botón, mientras no exista el detalle del curso).
  urlModalidades?: string;
  hrefCurso?: (id: number) => string | null;
  // Artiefy: tras "Duplicar" (menú ⋯) se recarga la lista.
  onDuplicated?: () => void | Promise<void>;
}

export default function CourseListAdmin({
  courses,
  onEditCourse,
  urlModalidades = '/api/modalidades',
  hrefCurso = (id) => `/dashboard/super-admin/cursos/${id}`,
  onDuplicated,
}: CourseListAdminProps) {
  // En una academia, los acentos turquesa toman su color primario.
  const academia = useMarca().esAcademia;
  const acento = academia
    ? 'border-primary/30 bg-primary/10 text-primary'
    : 'border-[#22C4D3]/30 bg-[#22C4D3]/10 text-[#22C4D3]';

  // Nombre de cada modalidad (el curso solo trae `modalidadesid`). Se pide una
  // vez y se reutiliza para todas las tarjetas.
  const [modalidades, setModalidades] = useState<Record<number, string>>({});
  // Menú ⋯ de la tarjeta (solo Artiefy): duplicar y enviar a academia.
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [envio, setEnvio] = useState<EnvioAcademia | null>(null);
  const [duplicando, setDuplicando] = useState<number | null>(null);

  const duplicar = async (id: number) => {
    setMenuAbierto(null);
    setDuplicando(id);
    try {
      const res = await fetch(`/api/super-admin/courses/${id}/duplicar`, {
        method: 'POST',
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        title?: string;
      };
      if (!res.ok) throw new Error(j.error ?? 'No se pudo duplicar el curso');
      toast.success('Curso duplicado', {
        description: `${j.title ?? 'La copia'} quedó oculta hasta que la revises.`,
      });
      await onDuplicated?.();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDuplicando(null);
    }
  };

  useEffect(() => {
    let activo = true;
    void fetch(urlModalidades)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (!activo || !Array.isArray(data)) return;
        const mapa: Record<number, string> = {};
        for (const m of data as { id: number; name: string }[]) {
          if (typeof m?.id === 'number' && typeof m?.name === 'string') {
            mapa[m.id] = m.name;
          }
        }
        setModalidades(mapa);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, [urlModalidades]);

  return (
    <div
      className="
      grid grid-cols-1 gap-4 px-8
      sm:grid-cols-2
      lg:grid-cols-3 lg:px-5
    "
    >
      {courses.map((course) => {
        return (
          <div key={course.id} className="group relative">
            <div
              className={`absolute -inset-0.5 animate-gradient rounded-xl bg-gradient-to-r opacity-0 blur transition duration-500 group-hover:opacity-100 ${
                academia
                  ? 'from-primary via-primary/60 to-background'
                  : 'from-[#3AF4EF] via-[#00BDD8] to-[#01142B]'
              }`}
            />
            <Card
              className={`relative flex h-full flex-col justify-between gap-0 overflow-hidden rounded-2xl border p-0 py-0 text-white transition-transform duration-300 ease-in-out zoom-in hover:scale-[1.02] ${
                academia
                  ? 'border-border bg-card'
                  : 'border-[#1d283a] bg-[#061c37]'
              }`}
            >
              <CardHeader className="p-0">
                <AspectRatio ratio={16 / 9}>
                  <div className="relative size-full bg-[#04101f]">
                    {course.coverImageKey ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                        alt={course.title || 'Imagen del curso'}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                        // En dev el optimizador local de Next se satura con
                        // muchas tarjetas a la vez (timeout → 500 → imagen rota);
                        // se sirve la imagen de S3 directo. En producción se
                        // mantiene la optimización (la hace Vercel).
                        unoptimized={process.env.NODE_ENV === 'development'}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#22C4D3]/20 to-[#061c37]">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    <div
                      className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent ${
                        academia ? 'from-card' : 'from-[#061c37]'
                      }`}
                    />
                    {!academia && course.id != null && (
                      <div className="absolute top-2 right-2 z-20">
                        <button
                          type="button"
                          aria-label="Más opciones"
                          onClick={() =>
                            setMenuAbierto(
                              menuAbierto === course.id
                                ? null
                                : (course.id ?? null)
                            )
                          }
                          className="flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
                        >
                          {duplicando === course.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreVertical className="size-4" />
                          )}
                        </button>
                        {menuAbierto === course.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuAbierto(null)}
                            />
                            <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0b1f3d] py-1 shadow-2xl">
                              <button
                                type="button"
                                onClick={() => void duplicar(course.id!)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                              >
                                <Copy className="size-4 text-[#22C4D3]" />
                                Duplicar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbierto(null);
                                  setEnvio({
                                    tipo: 'curso',
                                    courseId: course.id!,
                                    titulo: course.title,
                                  });
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                              >
                                <Building2 className="size-4 text-[#22C4D3]" />
                                Enviar a academia
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </AspectRatio>
              </CardHeader>

              <CardContent className="flex grow flex-col justify-between gap-3 px-4 pt-4">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${acento}`}
                  >
                    {course.categoryName ?? 'Sin categoría'}
                  </span>
                  {course.programas?.map((programa) => (
                    <span
                      key={programa.id}
                      title={programa.title}
                      className="inline-block max-w-[200px] rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400"
                    >
                      <span className="line-clamp-1">{programa.title}</span>
                    </span>
                  ))}
                </div>
                <CardTitle className="text-base sm:text-lg">
                  <div className="line-clamp-2 font-bold text-white">
                    {course.title}
                  </div>
                </CardTitle>
                {modalidades[course.modalidadesid] && (
                  <span
                    className="
                      w-fit rounded-full border border-violet-400/30
                      bg-violet-400/10 px-2.5 py-0.5 text-xs font-medium
                      text-violet-300
                    "
                  >
                    {modalidades[course.modalidadesid]}
                  </span>
                )}
                <p className="line-clamp-2 text-sm text-[#94A3B8]">
                  {course.description ?? 'Sin descripción'}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start justify-between gap-3 px-4 pt-3 pb-4">
                <div className="flex w-full items-center justify-between text-xs">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs font-semibold text-[#94A3B8] italic">
                      Educadores:
                    </span>
                    {course.instructorName &&
                    course.instructorName !== 'Sin instructor asignado' ? (
                      course.instructorName.split(', ').map((name, i) => (
                        <span
                          key={i}
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${acento}`}
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#94A3B8] italic">
                        Sin instructor asignado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <StarIcon className="size-4" />
                    <span className="text-xs font-bold sm:text-sm">
                      {(course.rating ?? 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex w-full gap-2">
                  <Button
                    onClick={() =>
                      onEditCourse({
                        ...course,
                        instructors:
                          course.instructors ??
                          (course.instructor ? [course.instructor] : []),
                      } as unknown as CourseData)
                    }
                    className={`flex w-full flex-1 items-center justify-center gap-1.5 border p-2 ${
                      academia
                        ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                        : 'border-[#22C4D3]/40 bg-[#22C4D3]/10 text-[#22C4D3] hover:bg-[#22C4D3]/20'
                    }`}
                  >
                    <p className="text-sm font-bold">Editar</p>
                  </Button>
                  {course.id != null && hrefCurso(course.id) && (
                    <Link
                      data-tour-id={
                        course.id === courses[0]?.id
                          ? 'tutorial-course-list'
                          : undefined
                      }
                      href={hrefCurso(course.id)! as Route}
                      className="flex-1"
                    >
                      <Button className="flex w-full items-center justify-center gap-1.5 border border-[#1d283a] bg-[#0d2a4d] p-2 text-white hover:bg-[#0d2a4d]/70">
                        <p className="text-sm font-bold">Ver</p>
                        <ArrowRightIcon className="size-4 animate-bounce-right" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        );
      })}
      {envio && (
        <ModalEnviarAcademia envio={envio} onClose={() => setEnvio(null)} />
      )}
    </div>
  );
}
