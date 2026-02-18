'use client';

import Image from 'next/image';
import Link from 'next/link';

import * as Tabs from '@radix-ui/react-tabs';
import { ArrowRight, Award, BookOpen, Clock, Play } from 'lucide-react';

import { Badge } from '~/components/estudiantes/ui/badge';

interface Program {
  id: number;
  title: string;
  coverImageKey: string | null;
  category: {
    name: string;
  } | null;
  rating: number;
}

interface Course {
  id: number;
  title: string;
  coverImageKey: string | null;
  instructorName: string;
  progress: number;
  rating: number;
  category: {
    name: string;
  } | null;
  continueLessonId?: number | null;
  continueLessonNumber?: number | null;
  continueLessonTitle?: string | null;
}

interface MyCoursesStudentClientProps {
  courses: Course[];
  programs: Program[];
}

const getImageUrl = (coverImageKey: string | null): string => {
  if (!coverImageKey || coverImageKey === 'NULL') {
    return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
  }
  return `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`.trimEnd();
};

export default function MyCoursesStudentClient({
  courses,
  programs,
}: MyCoursesStudentClientProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Mi Aprendizaje
        </h1>
        <p className="text-muted-foreground">Continúa donde lo dejaste</p>
      </div>

      <Tabs.Root defaultValue="cursos" className="mb-8">
        <Tabs.List className="inline-flex h-10 items-center justify-center rounded-[13px] border border-border/40 bg-secondary/40 p-1 text-muted-foreground">
          <Tabs.Trigger
            value="cursos"
            className="inline-flex items-center justify-center gap-2 rounded-[13px] px-4 py-1.5 text-sm font-medium whitespace-nowrap ring-offset-background transition-all hover:bg-[#22C4D3] hover:text-black focus-visible:bg-[#22C4D3] focus-visible:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-sm hover:[&_svg]:text-black focus-visible:[&_svg]:text-black data-[state=active]:[&_svg]:text-black"
          >
            <BookOpen className="h-4 w-4" />
            Cursos inscritos
          </Tabs.Trigger>
          <Tabs.Trigger
            value="programas"
            className="inline-flex items-center justify-center gap-2 rounded-[13px] px-4 py-1.5 text-sm font-medium whitespace-nowrap ring-offset-background transition-all hover:bg-[#22C4D3] hover:text-black focus-visible:bg-[#22C4D3] focus-visible:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-sm hover:[&_svg]:text-black focus-visible:[&_svg]:text-black data-[state=active]:[&_svg]:text-black"
          >
            <Award className="h-4 w-4" />
            Programas inscritos
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="cursos" className="mt-6">
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no tienes cursos inscritos.
              </p>
              <Link
                href="/estudiantes"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Ver cursos disponibles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const progress = Math.max(
                  0,
                  Math.min(100, course.progress ?? 0)
                );
                const courseHref = course.continueLessonId
                  ? `/estudiantes/clases/${course.continueLessonId}`
                  : `/estudiantes/cursos/${course.id}`;
                const lessonLabel =
                  course.continueLessonNumber && course.continueLessonTitle
                    ? `Clase ${course.continueLessonNumber}: ${course.continueLessonTitle}`
                    : course.continueLessonNumber
                      ? `Clase ${course.continueLessonNumber}`
                      : 'Continuar en el curso';
                return (
                  <Link
                    key={course.id}
                    href={courseHref}
                    prefetch={false}
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_30px_hsl(185_72%_48%/0.1)]"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={getImageUrl(course.coverImageKey)}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 shadow-[0_0_20px_hsl(185_72%_48%/0.5)]">
                          <Play className="ml-0.5 h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="absolute right-0 bottom-0 left-0 h-1 bg-muted/30">
                        <div
                          className="h-full rounded-r-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      {course.category && (
                        <Badge
                          className="border-primary/30 text-primary"
                          variant="outline"
                        >
                          {course.category.name}
                        </Badge>
                      )}
                      <h3 className="line-clamp-2 text-sm leading-tight font-semibold text-foreground transition-colors group-hover:text-primary">
                        {course.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lessonLabel}
                        </span>
                        <span className="font-medium text-primary">
                          {progress}%
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                      >
                        <div
                          className="h-full w-full flex-1 bg-primary transition-all"
                          style={{
                            transform: `translateX(-${100 - progress}%)`,
                          }}
                        />
                      </div>
                      <div className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-primary/20 bg-primary/10 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground">
                        <Play className="h-3.5 w-3.5" />
                        Continuar
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="programas" className="mt-6">
          {programs.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no tienes programas inscritos.
              </p>
              <Link
                href="/estudiantes"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Ver programas disponibles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/estudiantes/programas/${program.id}`}
                  prefetch={false}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_30px_hsl(185_72%_48%/0.1)]"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={getImageUrl(program.coverImageKey)}
                      alt={program.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 shadow-[0_0_20px_hsl(185_72%_48%/0.5)]">
                        <Play className="ml-0.5 h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    {program.category && (
                      <Badge
                        className="border-primary/30 text-primary"
                        variant="outline"
                      >
                        {program.category.name}
                      </Badge>
                    )}
                    <h3 className="line-clamp-2 text-sm leading-tight font-semibold text-foreground transition-colors group-hover:text-primary">
                      {program.title}
                    </h3>
                    <div className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-primary/20 bg-primary/10 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground">
                      Ver programa
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
