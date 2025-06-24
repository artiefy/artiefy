'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { ArrowUpFromLine } from 'lucide-react';

import { LoadingCourses } from '~/app/dashboard/super-admin/(inicio)/cursos/page';
import { Badge } from '~/components/educators/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from '~/components/educators/ui/card';

import ModalFormLessons from '../modals/ModalFormLessons';
import { Button } from '../ui/button';

interface LessonsModels {
  id: number;
  title: string;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  resourceKey: string | null;
  description: string;
  createdAt: string;
  duration: number;
  order: number;
  course: {
    id: number;
    title: string;
    description: string;
    instructor: string;
  };
}

interface LessonsListProps {
  courseId: number;
  selectedColor: string;
}

const LessonsListEducator: React.FC<LessonsListProps> = ({
  courseId,
  selectedColor,
}) => {
  const [lessons, setLessons] = useState<LessonsModels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpenLessons, setIsModalOpenLessons] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Añadir este estado
  console.log(courseId);

  const courseIdString = courseId.toString();

  const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace('#', '');
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  };

  // Fetch de las lecciones cuando el courseId cambia
  useEffect(() => {
    if (courseId) {
      const fetchLessons = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `/api/educadores/lessons?courseId=${courseIdString}`
          );

          if (!response.ok) {
            const errorData = (await response.json()) as { error?: string };
            throw new Error(
              errorData.error ?? 'Error al obtener las lecciones'
            );
          }

          const data = (await response.json()) as LessonsModels[];
          setLessons(data); // Setea las lecciones obtenidas
        } catch (error) {
          setError('Error al obtener las lecciones'); // Error general
          console.error('Error al obtener las lecciones:', error);
        } finally {
          setLoading(false);
        }
      };

      void fetchLessons();
    }
  }, [courseId, courseIdString, refreshKey]); // Añadir refreshKey aquí

  // Crear función para actualizar la lista
  const handleUpdateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Condicionales de renderizado: carga, error, lecciones vacías
  if (loading) {
    return <LoadingCourses />; // Componente de carga mientras obtenemos los datos
  }
  if (lessons.length === 0 || lessons === null) {
    return (
      <div className="grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-2 lg:px-5">
        <h2 className="mb-4 text-2xl font-bold">Lista de clases creadas</h2>
        <p className="text-xl text-gray-600">
          No hay clases creadas hasta el momento
        </p>
        <p className="my-2 text-gray-500">
          Comienza creando tu primer clase haciendo clic en el botón de abajo
          <br /> &quot;Crear Clase&quot;
        </p>
        <span>&#128071;&#128071;&#128071;</span>
        <div className="mt-3">
          <Button
            style={{ backgroundColor: selectedColor }}
            className={`cursor-pointer border-transparent bg-black font-semibold ${
              selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
            }`}
            onClick={() => {
              console.log('Botón Crear nueva clase clickeado');
              setIsModalOpenLessons(true);
              console.log('isModalOpenLessons:', isModalOpenLessons);
            }}
          >
            <ArrowUpFromLine />
            Crear nueva clase
          </Button>
        </div>
        <ModalFormLessons
          isOpen={isModalOpenLessons}
          onCloseAction={() => setIsModalOpenLessons(false)}
          courseId={courseId}
          uploading={false}
          onUpdateSuccess={handleUpdateSuccess} // Añadir esta prop
        />
      </div>
    );
  }
  if (error) {
    return <div>Se presentó un error: {error}</div>;
  }

  // Renderizamos las lecciones si todo es correcto
  return (
    <>
      <h2 className="mt-10 mb-6 text-center text-3xl font-extrabold sm:text-left">
        📚 Lista de clases
      </h2>

      {/* Grid responsivo: 1 / 2 / 3 / 4 columnas */}
      <div className="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 md:grid-cols-3 md:px-8 lg:grid-cols-4">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="group relative flex">
            {/* Overlay de degradado solo en hover */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3AF4EF]/20 via-[#00BDD8]/20 to-[#01142B]/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <Card
              className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-gray-800 shadow-lg transition-transform duration-300 hover:scale-[1.03]"
              style={{
                backgroundColor: selectedColor,
                color: getContrastYIQ(selectedColor),
              }}
            >
              {/* Imagen con aspect-ratio 16:9 */}
              <div className="relative w-full overflow-hidden bg-gray-700">
                <div className="aspect-w-16 aspect-h-9">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverImageKey}`}
                    alt={lesson.title}
                    className="rounded-t-2xl object-cover transition-transform duration-500 group-hover:scale-105"
                    fill
                    quality={75}
                  />
                </div>
              </div>

              <CardContent className="flex grow flex-col justify-between p-4">
                <div>
                  <CardTitle className="mb-2 text-xl leading-snug font-bold">
                    {lesson.title}
                  </CardTitle>

                  <p className="mb-4 line-clamp-2 text-sm text-gray-200">
                    {lesson.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                      Curso: {lesson.course.title}
                    </Badge>
                    <Badge className="bg-success/10 text-success px-2 py-1 text-xs font-medium">
                      Orden: {lesson.order}
                    </Badge>
                    <Badge className="bg-info/10 text-info px-2 py-1 text-xs font-medium">
                      Duración: {lesson.duration} min
                    </Badge>
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-300 italic">
                  Educador: {lesson.course.instructor}
                </p>
              </CardContent>

              <CardFooter className="px-4 pt-2 pb-4">
                <Button asChild className="w-full">
                  <Link
                    href={`/dashboard/educadores/cursos/${courseId}/${lesson.id}`}
                    className="relative flex items-center justify-center overflow-hidden rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-yellow-600 active:scale-95"
                  >
                    Ver clase
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                    <span className="absolute inset-0 block translate-x-[-100%] -skew-x-12 transform bg-white/20 transition-transform duration-700 group-hover:translate-x-[100%]" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>

      {/* Botón flotante centrado */}
      <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2">
        <Button
          className={`bg-primary hover:bg-primary-dark flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition active:scale-95`}
          style={{ backgroundColor: selectedColor }}
          onClick={() => setIsModalOpenLessons(true)}
        >
          <ArrowUpFromLine className="h-5 w-5" />
          Crear nueva clase
        </Button>
      </div>

      <ModalFormLessons
        isOpen={isModalOpenLessons}
        onCloseAction={() => setIsModalOpenLessons(false)}
        courseId={courseId}
        uploading={false}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </>
  );
};

export default LessonsListEducator;
