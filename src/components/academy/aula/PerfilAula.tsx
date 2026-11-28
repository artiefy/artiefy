'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useClerk } from '@clerk/nextjs';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  GraduationCap,
  Mail,
} from 'lucide-react';

import MyCoursesContent, {
  type Course,
  type Program,
} from '~/components/estudiantes/layout/MyCoursesContent';
import { useMarca } from '~/components/marca/MarcaProvider';

import type { Route } from 'next';

// Perfil del estudiante de una academia, con el diseño del ProfileView de
// Artiefy: banner, avatar, nombre, correo, fecha de ingreso, estadísticas y
// pestañas (Cursos con MyCoursesContent y Constancias). "Editar perfil" abre
// la cuenta de Clerk (nombre y foto).

const RUTAS = {
  curso: (id: number) => `/dashboard/student/cursos/${id}`,
  clase: (courseId: number, lessonId: number) =>
    `/dashboard/student/cursos/${courseId}/clases/${lessonId}`,
  programa: (id: number) => `/dashboard/student/programas/${id}`,
  catalogo: '/dashboard/student',
};

export function PerfilAula({
  nombre,
  email,
  imagen,
  desde,
  courses,
  programs,
}: {
  nombre: string;
  email: string;
  imagen: string | null;
  desde: string;
  courses: Course[];
  programs: Program[];
}) {
  const router = useRouter();
  const clerk = useClerk();
  const marca = useMarca();
  const [pestana, setPestana] = useState<'cursos' | 'constancias'>('cursos');
  const completados = courses.filter((c) => c.progress >= 100);
  const fechaIngreso = new Intl.DateTimeFormat('es', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(desde));
  const stats = [
    { label: 'Cursos', value: courses.length },
    { label: 'Completados', value: completados.length },
    { label: 'Programas', value: programs.length },
  ];

  return (
    <main className="relative pt-10 pb-12 lg:pt-14 lg:pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card/60 hover:text-foreground lg:mb-6"
        >
          <ArrowLeft className="size-4" />
          <span>Volver</span>
        </button>

        <div className="relative mb-8 lg:mb-10">
          <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-border/30 sm:h-40 lg:h-56 lg:rounded-3xl">
            <div className="size-full bg-gradient-to-r from-primary/30 via-primary/15 to-primary/5" />
            {marca.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={marca.logoUrl}
                alt={marca.nombre}
                className="absolute top-1/2 right-8 h-16 -translate-y-1/2 object-contain opacity-30 lg:h-24"
              />
            )}
          </div>

          <div className="-mt-12 px-4 sm:px-6 lg:-mt-16 lg:px-8 xl:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end lg:gap-6">
              <span className="relative flex size-24 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-xl lg:size-32 lg:border-[5px]">
                {imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagen}
                    alt={nombre}
                    className="aspect-square size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-secondary text-2xl font-bold text-foreground">
                    {nombre.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                  {nombre}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Estudiante de {marca.nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => clerk.openUserProfile()}
                className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-[var(--ac-primario-texto)] transition-all duration-300 hover:opacity-90 lg:px-7 lg:py-2.5"
              >
                Editar perfil
              </button>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground lg:mt-5">
              <Mail className="size-3.5 shrink-0" />
              <span className="break-all">{email}</span>
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground lg:text-sm">
              <CalendarDays className="size-3.5" />
              Se unió en {fechaIngreso}
            </p>

            <div className="mt-6 grid max-w-md grid-cols-3 gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border/50 bg-card/50 px-4 py-3 text-center"
                >
                  <p className="text-2xl font-bold text-foreground">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-1 border-b border-border/50">
          {(
            [
              ['cursos', 'Cursos', GraduationCap],
              ['constancias', 'Constancias', Award],
            ] as const
          ).map(([id, label, Icono]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium ${
                pestana === id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icono className="size-4" /> {label}
              {pestana === id && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {pestana === 'cursos' ? (
          <MyCoursesContent
            courses={courses}
            programs={programs}
            rutas={RUTAS}
          />
        ) : completados.length === 0 ? (
          <p className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Cuando termines un curso, aquí aparecerá su constancia.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completados.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/student/certificados/${c.id}` as Route}
                className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 transition hover:-translate-y-1 hover:border-primary/40"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
                  <Award className="size-6 text-amber-500" />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                    {c.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ver constancia
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
