'use client';

import { useEffect, useState } from 'react';
import { ArrowUpFromLine } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import { Badge } from '~/components/educators/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [lessons, setLessons] = useState<LessonsModels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpenLessons, setIsModalOpenLessons] = useState(false);

  // Manejo de carga de imágenes
  const handleImageLoad = (lessonId: number) => {
    setLoadedImages((prev) => ({ ...prev, [lessonId]: true }));
  };

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
  }, [courseId]); // Este efecto se ejecuta cada vez que el courseId cambia

  // Condicionales de renderizado: carga, error, lecciones vacías
  if (loading) {
    return <LoadingCourses />; // Componente de carga mientras obtenemos los datos
  }
  if (lessons.length === 0 || lessons === null) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-background py-10 text-center">
        <h2 className="mb-4 text-2xl font-bold">Lista de clases creadas</h2>
        <p className="text-xl text-gray-600">
          No hay clases creadas hasta el momento
        </p>
        <p className="my-2 text-gray-500">
          Comienza creando tu primer clase haciendo clic en el botón de abajo
          <br /> "Crear Clase"
        </p>
        <span>&#128071;&#128071;&#128071;</span>
        <div className="mt-3">
          <Button
            style={{ backgroundColor: selectedColor }}
            className={`cursor-pointer border-transparent bg-black font-semibold ${
              selectedColor === '#FFFFFF' || '#3af4ef'
                ? 'text-black'
                : 'text-white'
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
      <h2 className="mb-4 mt-10 text-2xl font-bold">Lista de clases:</h2>
      <div className="flex w-full flex-col">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {lessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="flex flex-col border-transparent bg-black hover:scale-100"
              style={{
                backgroundColor: selectedColor,
                color: getContrastYIQ(selectedColor),
              }}
            >
              <div className="relative grid grid-cols-1 p-5 lg:grid-cols-2">
                <CardHeader>
                  <Image
                    src={
                      lesson.coverImageKey
                        ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverImageKey}`
                        : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
                    }
                    alt={lesson.title || 'Imagen del curso'}
                    className={`relative mx-auto h-auto w-40 rounded-lg object-cover transition-opacity duration-500 ${
                      loadedImages[lesson.id] ? 'opacity-100' : 'opacity-0'
                    }`}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iMjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgb2Zmc2V0PSI1MCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzc2V0PSI3MCUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjxyZWN0IGlkPSJyIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNnKSIvPjxhbmltYXRlIHhsaW5rOmhyZWY9IiNyIiBhdHRyaWJ1dGVOYW1lPSJ4IiBmcm9tPSItNjAwIiB0bz0iNjAwIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvc3ZnPg=="
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    height={10}
                    width={10}
                    onLoad={(_event) => handleImageLoad(lesson.id)}
                  />
                </CardHeader>
                <CardContent
                  className={`${
                    selectedColor === '#000000' ? 'text-white' : 'text-black'
                  }`}
                >
                  <CardTitle className="text-lg">
                    <div className="font-bold">Clase: {lesson.title}</div>
                  </CardTitle>
                  <div className="mb-2 flex items-center">
                    <p className="text-sm font-bold">
                      Perteneciente al curso:{' '}
                    </p>
                    <Badge
                      variant="outline"
                      className="ml-1 border-primary bg-background text-primary hover:bg-black/70"
                    >
                      {lesson.course.title}
                    </Badge>
                  </div>
                  <p className="mb-2 line-clamp-2 text-sm">
                    Descripción: {lesson.description}
                  </p>
                  <p className="text-sm font-bold italic">
                    Educador:{' '}
                    <span className="font-bold italic">
                      {lesson.course.instructor}
                    </span>
                  </p>
                  <p className="text-sm font-bold italic">
                    Clase #{' '}
                    <span className="font-bold italic">{lesson.order}</span>
                  </p>
                  <p className="text-sm font-bold italic">
                    Duración:{' '}
                    <span className="font-bold italic">
                      {lesson.duration} Minutos
                    </span>
                  </p>
                </CardContent>
              </div>
              <CardFooter className="-mt-6 flex flex-col items-start justify-between">
                <Link
                  href={`/dashboard/educadores/cursos/${courseId}/${lesson.id}`}
                  className="mx-auto rounded-lg border-orange-500 bg-orange-500 p-3 text-white hover:border-orange-500/90 hover:bg-orange-500/90"
                >
                  Ver Clase
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="mx-auto my-4">
          <Button
            className={`mx-auto mt-6 cursor-pointer justify-center border-transparent bg-primary font-semibold ${
              selectedColor === '#000000' ? 'text-white' : 'text-black'
            }`}
            style={{ backgroundColor: selectedColor }}
            onClick={() => {
              setIsModalOpenLessons(true);
              console.log('isModalOpenLessons:', isModalOpenLessons);
            }}
          >
            <ArrowUpFromLine />
            Crear nueva clase
          </Button>
        </div>
      </div>
      <ModalFormLessons
        isOpen={isModalOpenLessons}
        onCloseAction={() => setIsModalOpenLessons(false)}
        courseId={courseId}
        uploading={false}
      />
    </>
  );
};

export default LessonsListEducator;
