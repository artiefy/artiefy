'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ViewFiles from '~/components/educators/layout/ViewFiles';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';

interface Lessons {
  id: number;
  title: string;
  description: string;
  coverImageKey: string;
  coverVideoKey: string;
  resourceKey: string;
  duration: number;
  order: number;
  course: {
    id: number;
    title: string;
    description: string;
    instructor: string;
    modalidadId: string;
    categoryId: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Page: React.FC = () => {
  const { user } = useUser();
  const { courseId, lessonId } = useParams();
  const [lessons, setLessons] = useState<Lessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) {
      setError('lessonId is null or invalid');
      setLoading(false);
      return;
    }

    const lessonsIdNumber2 = Array.isArray(lessonId)
      ? lessonId[0]
      : (lessonId ?? '');
    const lessonsIdNumber = parseInt(lessonsIdNumber2!);
    if (isNaN(lessonsIdNumber) || lessonsIdNumber <= 0) {
      setError('lessonId is not a valid number');
      setLoading(false);
      return;
    }

    const fetchLessons = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/educadores/lessons/${lessonsIdNumber}`
        );
        if (response.ok) {
          const data = (await response.json()) as Lessons;
          setLessons(data);
        } else {
          const errorData = (await response.json()) as { error?: string };
          const errorMessage = errorData.error ?? response.statusText;
          setError(`Error al cargar la leccion: ${errorMessage}`);
          toast({
            title: 'Error',
            description: `No se pudo cargar la leccion: ${errorMessage}`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar la leccion: ${errorMessage}`);
        toast({
          title: 'Error',
          description: `No se pudo cargar la leccion: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLessons().catch((error) =>
      console.error('Error fetching lessons:', error)
    );
  }, [user, lessonId]);

  if (loading) return <div>Cargando leccion...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!lessons) return <div>No se encontró la leccion.</div>;

  return (
    <>
      <div className="container mx-auto mt-4 h-auto w-full rounded-lg bg-background p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="hover:text-gray-300"
                href="/dashboard/educadores/cursos"
              >
                Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="hover:text-gray-300"
                href={`/dashboard/educadores/cursos/${Array.isArray(courseId) ? courseId[0] : courseId}`}
              >
                Detalles curso
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="hover:text-gray-300">
                Detalles de la lession: {lessons.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card className="mt-5 p-5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Lesion: {lessons.title}
            </CardTitle>
          </CardHeader>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Columna izquierda - Imagen */}
            <div className="flex flex-col">
              <div className="relative aspect-video">
                <p>Image:</p>
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverImageKey}`}
                  alt={lessons.title}
                  fill
                  className="rounded-lg object-cover"
                  priority
                />
              </div>
            </div>
            {/* Columna derecha - Información */}
            <video className="h-80 w-full object-cover" controls>
              <p> Video clase:</p>
              <source
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`}
              />
            </video>
          </div>
          {/* Zona de los files */}
          <div>
            <ViewFiles lessonId={lessons.id} />
          </div>
          <div className="flex justify-evenly px-3 py-6">
            <Button className="mx-4 border-yellow-500 bg-yellow-500 text-white hover:bg-white hover:text-yellow-500">
              Editar Lesion
            </Button>
            <Button variant="default">Ver Lesion</Button>
            <Button variant="destructive">Eliminar</Button>
          </div>
          <div>
            <div className="pb-6">
              <h2 className="text-2xl font-bold">Información de la clase</h2>
              <br />
              <div className="grid grid-cols-2">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">Lesion:</h2>
                  <h1 className="mb-4 text-2xl font-bold">{lessons.title}</h1>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">Categoría:</h2>
                  <p className="text-gray-600">{lessons.course?.categoryId}</p>
                </div>
              </div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Descripción:</h2>
                <p className="text-justify text-gray-600">
                  {lessons.description}
                </p>
              </div>
              <div className="grid grid-cols-2">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">Educador:</h2>
                  <p className="text-gray-600">{lessons.course?.instructor}</p>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">Modalidad:</h2>
                  <p className="text-gray-600">{lessons.course?.modalidadId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center">
            <Button className="mx-auto cursor-pointer justify-center bg-white">
              <Upload />
              Crear actividad
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Page;
