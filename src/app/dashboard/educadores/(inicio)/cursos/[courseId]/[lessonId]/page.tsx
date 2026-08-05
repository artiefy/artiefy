'use client';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { toast } from 'sonner';

import ListActividadesEducator from '~/components/educators/layout/ListActividades';
import ViewFiles from '~/components/educators/layout/ViewFiles';
import { ModalFormActivityQuick } from '~/components/educators/modals/ModalFormActivityQuick';
import ModalFormLessons from '~/components/educators/modals/ModalFormLessons';
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
import { Button } from '~/components/educators/ui/button';

// Detallado de las lecciones

// Definir la interfaz de las lecciones
interface Lessons {
  id: number;
  title: string;
  description: string;
  coverImageKey: string;
  coverVideoKey: string;
  resourceKey: string;
  resourceName: string;
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

// Color fijo que iguala la tarjeta de CourseDetail, usado como prop para
// ViewFiles/ListActividadesEducator (solo comprueban si es '#FFFFFF').
const THEME_COLOR = '#061c37';

const Page: React.FC<{ selectedColor: string }> = () => {
  const router = useRouter(); // Hook para manejar la navegación
  const params = useParams(); // Hook para obtener los parámetros de la URL
  const courseId = params?.courseId ?? null; // Obtener el id del curso
  const lessonId = params?.lessonId ?? null; // Obtener el id de la lección
  const [lessons, setLessons] = useState<Lessons | null>(null); // Estado de la lección
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState<string | null>(null); // Estado de error
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Estado del modal de edición
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false); // Estado del modal de crear actividad
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0); // Fuerza el remount/refetch de la lista de actividades

  // Obtener el id del curso
  const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;
  const courseIdNumber = courseIdString ? parseInt(courseIdString) : null; // Convertir a número

  // Función para obtener las lecciones - SIN depender de user para evitar ciclos infinitos
  const fetchLessons = useCallback(async (lessonsIdNumber: number) => {
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
        toast.error('Error', {
          description: `No se pudo cargar la leccion: ${errorMessage}`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar la leccion: ${errorMessage}`);
      toast.error('Error', {
        description: `No se pudo cargar la leccion: ${errorMessage}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar las lecciones al cargar la - SOLO cuando lessonId cambia
  useEffect(() => {
    if (!lessonId) {
      setError('lessonId is null or invalid');
      setLoading(false);
      return;
    }

    const lessonsId2 = Array.isArray(lessonId) ? lessonId[0] : (lessonId ?? '');
    const lessonsIdNumber = parseInt(lessonsId2 ?? '');
    if (isNaN(lessonsIdNumber) || lessonsIdNumber <= 0) {
      setError('lessonId is not a valid number');
      setLoading(false);
      return;
    }

    fetchLessons(lessonsIdNumber).catch((error) =>
      console.error('Error fetching lessons:', error)
    );
  }, [lessonId, fetchLessons]);

  // Función para eliminar la lección
  const handleDelete = async (id: string) => {
    try {
      // Eliminar imagen de portada
      if (lessons?.coverImageKey) {
        const responseAwsImg = await fetch('/api/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: lessons?.coverImageKey,
          }),
        });

        if (!responseAwsImg.ok) {
          console.error('Error al eliminar la imagen de portada');
        }
      }

      // Eliminar video
      if (lessons?.coverVideoKey) {
        const responseAwsVideo = await fetch('/api/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: lessons?.coverVideoKey,
          }),
        });

        if (!responseAwsVideo.ok) {
          console.error('Error al eliminar el video');
        }
      }

      // Eliminar archivos de recursos
      if (lessons?.resourceKey) {
        // Dividir la cadena de resourceKey en un array
        const resourceKeys = lessons?.resourceKey.split(',');

        // Eliminar cada archivo de recurso
        const deletePromises = resourceKeys.map((key) =>
          fetch('/api/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key: key.trim(), // Eliminar espacios en blanco
            }),
          })
        );

        // Esperar a que todas las eliminaciones se completen
        const responses = await Promise.all(deletePromises);

        // Verificar si hubo errores
        responses.forEach((response, index) => {
          if (!response.ok) {
            console.error(
              `Error al eliminar el archivo ${resourceKeys[index]}`
            );
          }
        });
      }

      // Eliminar la lección de la base de datos
      const response = await fetch(`/api/educadores/lessons?lessonId=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la clase');
      }

      toast.success('Clase eliminada', {
        description: `La clase ${lessons?.title} ha sido eliminada exitosamente.`,
      });

      router.push(`/dashboard/educadores/cursos/${courseIdNumber}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error', {
        description: 'No se pudo eliminar la clase completamente',
      });
    }
  };

  // Add this function to refresh the lesson data
  const refreshLessonData = useCallback(async () => {
    if (!lessonId) return;

    const lessonsId2 = Array.isArray(lessonId) ? lessonId[0] : (lessonId ?? '');
    const lessonsIdNumber = parseInt(lessonsId2 ?? '');
    if (!isNaN(lessonsIdNumber) && lessonsIdNumber > 0) {
      await fetchLessons(lessonsIdNumber);
    }
  }, [lessonId, fetchLessons]);

  // Si está cargando, mostrar el spinner
  if (loading) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <div className="size-32 rounded-full border-y-2 border-primary">
          <span className="sr-only" />
        </div>
        <span className="text-primary">Cargando...</span>
      </main>
    );
  }

  // Si hay un error, mostrar el mensaje de error
  if (error) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">
            Error tipo: {error}
          </p>
          <button
            onClick={async () => {
              if (lessonId) {
                await fetchLessons(
                  parseInt(Array.isArray(lessonId) ? lessonId[0] : lessonId)
                );
              }
            }}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Si no hay lecciones, mostrar el mensaje de error
  if (!lessons) return <div>No se encontró la leccion.</div>;

  // Imagen + video — reutilizado en móvil (bajo el hero) y en desktop
  // (columna lateral sticky), igual que en CourseDetail.
  const hasVideo = !!lessons.coverVideoKey && lessons.coverVideoKey !== 'none';

  const renderMedia = () => (
    <div
      className="
        relative overflow-hidden rounded-2xl border border-[#1d283a]
        bg-[#061c37] p-4
        sm:p-6
      "
    >
      {hasVideo ? (
        <video
          className="aspect-video h-auto w-full rounded-lg object-cover"
          controls
          aria-label={`Video de ${lessons.title}`}
        >
          <source
            src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`}
          />
        </video>
      ) : (
        <Image
          src={
            lessons.coverImageKey
              ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverImageKey}`
              : `/favicon.ico`
          }
          alt={lessons.title}
          width={300}
          height={300}
          className="mx-auto h-auto w-full rounded-lg object-contain"
          priority
          quality={75}
        />
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          className="
            w-full border-transparent bg-green-400 px-2 py-1.5 text-xs
            text-white
            hover:bg-green-500
          "
        >
          <Link
            href={`./${lessons.id}/verClase/${lessons.id}`}
            className="w-full"
          >
            👁️ Ver clase
          </Link>
        </Button>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          className="
            w-full border-yellow-500 bg-yellow-500 px-2 py-1.5 text-xs
            text-white
            hover:bg-yellow-600
          "
        >
          Editar clase
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="
                col-span-2 w-full border-red-600 bg-red-600 px-2 py-1.5
                text-xs text-white
                hover:border-red-600 hover:bg-white hover:text-red-600
              "
            >
              🗑️ Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                la clase
                <span className="font-bold"> {lessons.title}</span> y todos los
                datos asociados a este.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(lessons.id.toString())}
                className="
                  border-red-600 bg-red-600 text-white
                  hover:border-red-700 hover:bg-transparent
                  hover:text-red-700
                "
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  // Renderizar la página
  return (
    <>
      <div
        className="
          relative min-h-screen w-full overflow-hidden px-1 py-2
          md:px-3 md:py-4
        "
        style={{
          backgroundColor: 'rgb(25, 45, 80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
      >
        {/* Overlay oscuro para mejorar legibilidad */}
        <div
          className="
            pointer-events-none absolute inset-0 bg-gradient-to-br
            from-black/50 via-[#1a2d4a]/30 to-black/50
          "
        />
        {/* Fondo decorativo con patrón */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div
            className="
              absolute -top-40 -right-40 size-80 rounded-full bg-green-500
              blur-3xl
            "
          />
          <div
            className="
              absolute -bottom-40 -left-40 size-80 rounded-full bg-purple-500
              blur-3xl
            "
          />
        </div>

        <Breadcrumb className="animate-slideInDown relative z-10 mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="
                  text-[#22C4D3] transition-colors duration-300
                  hover:text-[#22C4D3]
                "
                href="/dashboard/educadores"
              >
                Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="
                  text-[#22C4D3] transition-colors duration-300
                  hover:text-[#22C4D3]
                "
                href="/dashboard/educadores/cursos"
              >
                Lista de cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="
                  text-[#22C4D3] transition-colors duration-300
                  hover:text-[#22C4D3]
                "
                href={`/dashboard/educadores/cursos/${courseIdNumber}`}
              >
                Detalles curso
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={``} className="text-white/60">
                Detalles de la clase: {lessons.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="relative z-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2">
              <div
                className="
                  relative overflow-hidden rounded-2xl border
                  border-[#1d283a] bg-[#061c37] p-4 shadow-2xl
                  sm:p-8
                "
              >
                <h1 className="font-display text-2xl leading-tight font-bold text-white md:text-3xl lg:text-4xl">
                  Clase: {lessons.title}
                </h1>
                {lessons.description && (
                  <p className="mt-4 max-w-2xl text-base text-[#94A3B8]">
                    {lessons.description}
                  </p>
                )}
                <div className="mt-6 lg:hidden">{renderMedia()}</div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-6">{renderMedia()}</div>
            </div>
          </div>

          <div
            className="
              relative overflow-hidden rounded-2xl border border-[#1d283a]
              bg-[#061c37] p-4 shadow-2xl
              sm:p-8
            "
          >
            {/* Zona de los files */}
            <div>
              <ViewFiles lessonId={lessons.id} selectedColor={THEME_COLOR} />
            </div>
            <div className="mt-6">
              <div className="pb-6 text-white">
                <h2 className="mb-4 text-xl font-bold sm:text-2xl">
                  Información de la clase
                </h2>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold tracking-wider text-[#22C4D3] uppercase">
                      Categoría
                    </h3>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                      {lessons.course?.categoryId}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold tracking-wider text-[#22C4D3] uppercase">
                      Educador
                    </h3>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                      {lessons.course?.instructor}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold tracking-wider text-[#22C4D3] uppercase">
                      Modalidad
                    </h3>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                      {lessons.course?.modalidadId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-center">
              <button
                type="button"
                onClick={() => setIsCreateActivityOpen(true)}
                className="
                  cursor-pointer justify-center rounded-lg border-transparent
                  bg-green-400 p-2 text-white
                  hover:bg-green-500
                "
              >
                Crear actividad
              </button>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-6">
          <ListActividadesEducator
            key={activitiesRefreshKey}
            lessonId={lessons.id}
            courseId={courseIdNumber ?? 0}
            coverImageKey={lessons.coverImageKey}
            selectedColor={THEME_COLOR}
          />
        </div>
      </div>
      <ModalFormActivityQuick
        open={isCreateActivityOpen}
        onOpenChange={setIsCreateActivityOpen}
        courseId={courseIdNumber ?? 0}
        presetLessonId={lessons.id}
        onSuccess={() => setActivitiesRefreshKey((k) => k + 1)}
      />
      <ModalFormLessons
        isOpen={isEditModalOpen}
        onCloseAction={() => {
          setIsEditModalOpen(false);
        }}
        uploading={false}
        courseId={courseIdNumber ?? 0}
        isEditing={true}
        editingLesson={lessons}
        modalClassName="z-[9999]" // Use the same name here
        onUpdateSuccess={() => {
          void refreshLessonData().catch(console.error);
        }}
      />
    </>
  );
};

export default Page;
