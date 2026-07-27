import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/solid';

import { AspectRatio } from '~/components/educators/ui/aspect-ratio';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/educators/ui/card';
import { Button } from '~/components/estudiantes/ui/button';
import { type CourseData } from '~/server/queries/queries';

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
}

export default function CourseListAdmin({
  courses,
  onEditCourse,
}: CourseListAdminProps) {
  console.log('Courses received in CourseListAdmin:', courses);

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
            <div className="absolute -inset-0.5 animate-gradient rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
            <Card className="zoom-in relative flex h-full flex-col justify-between gap-0 overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37] p-0 py-0 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02]">
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
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#22C4D3]/20 to-[#061c37]">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#061c37] to-transparent" />
                  </div>
                </AspectRatio>
              </CardHeader>

              <CardContent className="flex grow flex-col justify-between gap-3 px-4 pt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#22C4D3]/30 bg-[#22C4D3]/10 px-2.5 py-1 text-xs font-medium text-[#22C4D3]">
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
                          className="rounded-full border border-[#22C4D3]/30 bg-[#22C4D3]/10 px-2 py-0.5 text-xs font-medium text-[#22C4D3]"
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
                    className="flex w-full flex-1 items-center justify-center gap-1.5 border border-[#22C4D3]/40 bg-[#22C4D3]/10 p-2 text-[#22C4D3] hover:bg-[#22C4D3]/20"
                  >
                    <p className="text-sm font-bold">Editar</p>
                  </Button>
                  <Link
                    data-tour-id={
                      course.id === courses[0]?.id
                        ? 'tutorial-course-list'
                        : undefined
                    }
                    href={`/dashboard/super-admin/cursos/${course.id}`}
                    className="flex-1"
                  >
                    <Button className="flex w-full items-center justify-center gap-1.5 border border-[#1d283a] bg-[#0d2a4d] p-2 text-white hover:bg-[#0d2a4d]/70">
                      <p className="text-sm font-bold">Ver</p>
                      <ArrowRightIcon className="size-4 animate-bounce-right" />
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
