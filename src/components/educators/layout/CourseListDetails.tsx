import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/solid';

import { AspectRatio } from '~/components/educators/ui/aspect-ratio';
import { Badge } from '~/components/educators/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/educators/ui/card';
import { Button } from '~/components/estudiantes/ui/button';

// Interfaz para los cursos
interface Course {
  id: number;
  title: string;
  coverImageKey: string | null;
  categoryid: string;
  description: string;
  instructor: string;
  rating?: number;
  modalidadesid: string;
  nivelid: string;
  createdAt: string;
}

// Propiedades del componente para la lista de cursos
interface CourseListTeacherProps {
  courses: Course[];
}

export default function CourseListDetails({ courses }: CourseListTeacherProps) {
  console.log('CourseListDetails received courses:', courses); // Add this line
  // Retorno la vista del componente que muestra la lista de cursos para los educadores en el dashboard
  return (
    <div
      className="
        grid grid-cols-1 gap-8 px-8
        sm:grid-cols-2
        lg:grid-cols-3 lg:px-2
      "
    >
      {courses.map((course) => (
        <div key={course.id} className="group relative">
          {/* Fondo animado sutil */}
          <div
            className="
              absolute -inset-1 z-0 animate-gradient rounded-2xl
              bg-gradient-to-r from-[#22C4D3]/30 via-[#00BDD8]/20
              to-[#01142B]/40 opacity-0 blur-md transition duration-500
              group-hover:opacity-100
            "
          />
          <Card
            className="
              relative z-10 flex h-full flex-col justify-between overflow-hidden
              rounded-2xl border-2 border-[#1d283a] bg-[#223047] px-4 pt-4 pb-6
              text-white shadow-2xl transition-transform duration-300
              ease-in-out
              hover:scale-[1.03] hover:border-[#00BDD8] hover:shadow-cyan-500/30
            "
          >
            <CardHeader className="mb-2 p-0">
              <AspectRatio ratio={16 / 9}>
                <div
                  className="
                    relative size-full overflow-hidden rounded-xl shadow-lg
                  "
                >
                  <Image
                    src={
                      course.coverImageKey
                        ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
                        : '/placeholder.svg'
                    }
                    alt={course.title || 'Imagen del curso'}
                    className="
                      size-full object-cover transition-transform duration-300
                      hover:scale-105
                    "
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={80}
                  />
                </div>
              </AspectRatio>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-0 py-2">
              <div className="mb-1 flex items-center gap-3">
                <CardTitle className="mb-0 truncate text-xl font-extrabold text-primary">
                  {course.title}
                </CardTitle>
                <div
                  className="
                    flex items-center gap-1 rounded-lg bg-[#1e2939]/60 px-2 py-1
                    shadow-inner
                  "
                >
                  <StarIcon className="size-5 text-yellow-400" />
                  <span className="text-base font-bold text-yellow-400">
                    {(course.rating ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="mb-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="
                    rounded-full border-primary bg-background px-3 py-1 text-xs
                    font-semibold text-primary shadow-sm
                  "
                >
                  {course.categoryid}
                </Badge>
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
            <CardFooter
              className="
                mt-2 flex flex-col gap-4 border-t border-white/10 px-0 pt-2
              "
            >
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400">
                    Educador
                  </span>
                  <span className="text-sm font-bold text-white">
                    {course.instructor}
                  </span>
                </div>
                <span
                  className="
                    rounded-full border border-[#22C4D3]/30 bg-[#01142B]/60 px-3
                    py-1 text-xs font-bold text-[#22C4D3] shadow-sm
                  "
                >
                  {course.modalidadesid}
                </span>
              </div>
              <div className="mt-2 flex w-full flex-row justify-end gap-3">
                <Button
                  asChild
                  className="
                    rounded-lg border border-primary bg-background px-4 py-2
                    font-bold text-primary transition-all
                    hover:bg-[#22C4D3]/10
                  "
                >
                  <Link
                    href={`/dashboard/educadores/detailsDashboard/${course.id}`}
                    className="flex items-center gap-2"
                  >
                    <span>Estadísticas</span>
                    <ArrowRightIcon className="size-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="
                    mr-0 rounded-lg border border-primary bg-primary px-4 py-2
                    font-bold text-white transition-all
                    hover:bg-[#00BDD8]
                    sm:mr-2
                    lg:mr-4
                  "
                >
                  <Link
                    href={`/dashboard/educadores/cursos/${course.id}`}
                    className="flex items-center gap-2"
                  >
                    <span>Ver Curso</span>
                    <ArrowRightIcon className="size-5" />
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
}
