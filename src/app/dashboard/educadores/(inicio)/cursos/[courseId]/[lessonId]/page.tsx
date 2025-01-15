'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/educators/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
//import LessonFiles from "~/components/layout/LessonsFiles";
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

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const [lessons, setLessons] = useState<Lessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/educadores/lessons/?lessonId=${Array.isArray(lessonId) ? lessonId[0] : lessonId}`
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
  }, [user, lessonId]);

  useEffect(() => {
    fetchLessons().catch((error) =>
      console.error('Error fetching lessons:', error)
    );
  }, [fetchLessons]);

  if (loading) return <div>Cargando leccion...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!lessons) return <div>No se encontró la leccion.</div>;

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/educadores/lessons?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar la leccion');
      router.push(
        `/dashboard/educadores/cursos/${Array.isArray(courseId) ? courseId[0] : courseId}`
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <div>
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
                  href={`/dashboard/educadores/cursos/${courseId}`}
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
          <Card className="overflow-hidden bg-gray-300 px-4"></Card>
          {/* Columna izquierda - Imagen */}
          <div className="flex flex-col">
            <div className="relative aspect-video">
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverImageKey}`}
                alt={lessons.title}
                fill
                className="rounded-lg object-cover"
                priority
              />
              <div className="px-3 py-6">
                <Button className="mx-4 border-yellow-500 bg-yellow-500 text-white hover:bg-white hover:text-yellow-500">
                  Editar curso
                </Button>
                <AlertDialogTrigger asChild>
                  <Button className="mx-4 border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialog>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará
                        permanentemente el curso
                        <span className="font-bold"> {lessons.title}</span> y
                        todos los datos asociados a este.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(lessons.id.toString())}
                        className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {/* Columna derecha - Información */}
            <div className="pb-6">
              <h2 className="text-2xl font-bold">Información del curso</h2>
              <br />
              <div className="grid grid-cols-2">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">Curso:</h2>
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
            <div>
              <Button className="cursor-pointer bg-white">
                <Upload />
                Crear actividad
              </Button>
              <video className="h-48 w-full object-cover" controls>
                <source
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`}
                />
              </video>
              {/* <LessonFiles lessonId={lessons} /> */}
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Curso: {lessons.title}
            </CardTitle>
          </CardHeader>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Columna izquierda - Imagen */}
            <div className="flex flex-col">
              <div className="relative aspect-video">
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverImageKey}`}
                  alt={lessons.title}
                  fill
                  className="rounded-lg object-cover"
                  priority
                />
              </div>
              <div className="px-3 py-6">
                <Button className="mx-4 border-yellow-500 bg-yellow-500 text-white hover:bg-white hover:text-yellow-500">
                  Editar curso
                </Button>
                <AlertDialogTrigger asChild>
                  <Button className="mx-4 border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialog>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará
                        permanentemente el curso
                        <span className="font-bold"> {lessons.title}</span> y
                        todos los datos asociados a este.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(lessons.id.toString())}
                        className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {/* Columna derecha - Información */}
            <div className="pb-6">
              <h2 className="text-2xl font-bold">Información del curso</h2>
              <br />
              <div className="grid grid-cols-2">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">Curso:</h2>
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
        </div>
        <div>
          <Button className="cursor-pointer bg-white">
            <Upload />
            Crear actividad
          </Button>
          <video className="h-48 w-full object-cover" controls>
            <source
              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`}
            />
          </video>
          {/* <LessonFiles lessonId={lessons} /> */}
        </div>
      </div>
    </>
  );
}
