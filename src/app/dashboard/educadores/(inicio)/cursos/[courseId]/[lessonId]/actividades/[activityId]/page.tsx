'use client';
import { useState, useCallback, useEffect } from 'react';

import Image from 'next/image';
import { useParams } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { toast } from '~/hooks/use-toast';

interface ActivityDetails {
  id: number;
  name: string;
  description: string;
  typeid: number;
  type: {
    id: number;
    name: string;
    description: string;
  };
  lesson: {
    id: number;
    title: string;
    coverImageKey: string;
    courseId: number;
    courseTitle: string;
    courseDescription: string;
    courseInstructor: string;
  };
}

const Page = () => {
  const params = useParams();
  const actividadIdUrl = params?.activityId ?? null; // Asegurarse de que el nombre del parámetro coincida con el de la URL
  const lessonsId = params?.lessonId ?? null; // Obtener lessonId de los parámetros de la URL
  const courseId = params?.courseId ?? null; // Obtener courseId de los parámetros de la URL
  const [actividad, setActividad] = useState<ActivityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actividadIdString = Array.isArray(actividadIdUrl)
    ? actividadIdUrl[0]
    : actividadIdUrl;
  const actividadIdNumber = actividadIdString
    ? parseInt(actividadIdString)
    : null;
  const lessonIdString = Array.isArray(lessonsId) ? lessonsId[0] : lessonsId;
  const lessonIdNumber = lessonIdString ? parseInt(lessonIdString) : null;
  const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;
  const courseIdNumber = courseIdString ? parseInt(courseIdString) : null;
  const fetchActividad = useCallback(async () => {
    if (actividadIdNumber !== null) {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/educadores/actividades/${actividadIdNumber}`
        );

        if (response.ok) {
          const data = (await response.json()) as ActivityDetails;
          setActividad(data);
        } else {
          const errorData = (await response.json()) as { error?: string };
          const errorMessage = errorData.error ?? response.statusText;
          setError(`Error al cargar la actividad: ${errorMessage}`);
          toast({
            title: 'Error',
            description: `No se pudo cargar la actividad: ${errorMessage}`,
            variant: 'destructive',
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar la actividad: ${errorMessage}`);
        toast({
          title: 'Error',
          description: `No se pudo cargar la actividad: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  }, [actividadIdNumber]);

  useEffect(() => {
    fetchActividad().catch((error) =>
      console.error('Error fetching activity:', error)
    );
  }, [fetchActividad]);

  if (loading)
    return <div className="text-center text-xl">Cargando actividad...</div>;
  if (error)
    return <div className="text-center text-xl text-red-500">{error}</div>;
  if (!actividad)
    return (
      <div className="text-center text-xl">No se encontró la actividad.</div>
    );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList className="flex space-x-2">
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
              href={`/dashboard/educadores/cursos/${courseIdNumber}`}
            >
              Detalles curso
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}`}
              className="hover:text-gray-300"
            >
              Lección
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={() => window.history.back()}
              className="hover:text-gray-300"
            >
              Creación de actividad
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mx-auto mt-4 flex w-11/12 flex-col rounded-lg bg-white p-6 text-black shadow-lg">
        <div className="flex items-center justify-between text-3xl font-bold text-gray-800">
          <h2>Actividad: {actividad.name}</h2>
          <h3>Lección: {actividad.lesson?.title}</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <div className="mt-4 space-y-12">
            <p className="text-lg font-medium">
              Del docente: {actividad.lesson.courseInstructor}.
            </p>
            <p className="text-lg font-medium">
              Tipo de actividad: {actividad.type.name}.
            </p>
            <p className="text-lg font-medium">
              Descripción de la actividad: {actividad.description}.
            </p>
          </div>
          <div className="flex justify-center">
            <Image
              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${actividad.lesson.coverImageKey}`}
              alt="Imagen de la lección"
              width={200}
              height={200}
              className="rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
