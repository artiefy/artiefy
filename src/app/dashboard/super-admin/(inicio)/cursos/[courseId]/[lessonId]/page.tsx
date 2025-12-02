'use client';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import ViewFiles from '~/components/educators/layout/ViewFiles';
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
import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { Label } from '~/components/educators/ui/label';
import ListActividadesEducator from '~/components/super-admin/layout/ListActividades';
import ModalFormLessons from '~/components/super-admin/modals/ModalFormLessons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';

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
    instructorName?: string;
    modalidadId: string;
    modalidadName?: string;
    categoryId: string;
    categoryName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Función para obtener el contraste del color
const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
};

const Page: React.FC<{ selectedColor: string }> = ({ selectedColor }) => {
  const { user } = useUser(); // obtener el usuario logeado para verificar permisos
  const router = useRouter(); // Hook para manejar la navegación
  const params = useParams(); // Hook para obtener los parámetros de la URL
  const courseId = params?.courseId ?? null; // Obtener el id del curso
  const lessonId = params?.lessonId ?? null; // Obtener el id de la lección
  const [lessons, setLessons] = useState<Lessons | null>(null); // Estado de la lección
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState<string | null>(null); // Estado de error
  const [color, setColor] = useState<string>(selectedColor || '#FFFFFF'); // Estado del color
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Estado del modal de edición
  const predefinedColors = ['#1f2937', '#000000', '#FFFFFF']; // Colores predefinidos

  // Obtener el id del curso
  const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;
  const courseIdNumber = courseIdString ? parseInt(courseIdString) : null; // Convertir a número

  // Obtener el color guardado en el localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem(
      `selectedColor_${Array.isArray(courseId) ? courseId[0] : courseId}`
    );
    if (savedColor) {
      setColor(savedColor);
    }
  }, [courseId]);

  // Función para cambiar el color predefinido
  const handlePredefinedColorChange = (newColor: string) => {
    setColor(newColor);
    localStorage.setItem(
      `selectedColor_${Array.isArray(courseId) ? courseId[0] : courseId}`,
      newColor
    );
  };

  // Función para obtener las lecciones
  const fetchLessons = useCallback(
    async (lessonsIdNumber: number) => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        // Obtener los datos de la lección
        const response = await fetch(
          `/api/super-admin/lessons/${lessonsIdNumber}`
        );

        if (response.ok) {
          const data = (await response.json()) as Lessons;

          // Obtener datos del curso para traer nombres completos
          // Obtener datos del curso para traer nombres completos
          if (data.course?.id) {
            try {
              const courseResponse = await fetch(
                `/api/educadores/courses/${data.course.id}`
              );
              if (courseResponse.ok) {
                const courseData = (await courseResponse.json()) as {
                  categoryName?: string;
                  modalidadesName?: string;
                  instructorName?: string;
                };

                // Enriquecer los datos de la lección con los nombres del curso
                data.course.categoryName = courseData.categoryName;
                data.course.modalidadName = courseData.modalidadesName;
                data.course.instructorName = courseData.instructorName;
              }
            } catch (err) {
              console.error('Error fetching course details:', err);
              // Continuamos sin los nombres si falla
            }
          }

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
    },
    [user]
  );

  // Cargar las lecciones al cargar la
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

      // Navigate back to the course details page
      router.push(`/dashboard/super-admin/cursos/${courseIdNumber}`);
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
        <div className="border-primary size-32 rounded-full border-y-2">
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
            className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Si no hay lecciones, mostrar el mensaje de error
  if (!lessons) return <div>No se encontró la leccion.</div>;

  // Renderizar la página
  return (
    <>
      <div className="bg-background container mx-auto mt-2 h-auto w-full rounded-lg">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-primary hover:text-gray-300"
                href="/dashboard/super-admin"
              >
                Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-primary hover:text-gray-300"
                href="/dashboard/super-admin/cursos"
              >
                Lista de cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-primary hover:text-gray-300"
                href={`/dashboard/super-admin/cursos/${courseIdNumber}`}
              >
                Detalles curso
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={``}
                className="text-primary hover:text-gray-300"
              >
                Detalles de la clase: {lessons.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="group relative h-auto w-full">
          <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
          <Card
            className={`relative mt-5 border-transparent bg-black p-5 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
            style={{
              backgroundColor: color,
              color: getContrastYIQ(color),
            }}
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className={`text-primary text-xl sm:text-2xl md:text-3xl font-bold`}>
                Clase: {lessons.title}
              </CardTitle>
              {/* Add color selection buttons */}
              <div className="flex flex-col gap-3 mt-4">
                <Label
                  className={`text-sm sm:text-base font-semibold ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
                >
                  🎨 Seleccione el color deseado
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((predefinedColor) => (
                    <Button
                      key={predefinedColor}
                      style={{ backgroundColor: predefinedColor }}
                      className={`size-10 sm:size-12 rounded-lg border-2 transition-all duration-300 hover:scale-110 ${color === predefinedColor ? 'ring-2 ring-offset-2 ring-primary' : ''
                        }`}
                      onClick={() =>
                        handlePredefinedColorChange(predefinedColor)
                      }
                      title={`Cambiar tema a ${predefinedColor}`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
              {/* Columna izquierda - Imagen */}
              <div className="relative flex w-full items-center justify-center order-2 md:order-1">
                <Image
                  src={
                    lessons.coverImageKey
                      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverImageKey}`
                      : `/favicon.ico`
                  }
                  alt={lessons.title}
                  width={300}
                  height={300}
                  className="mx-auto rounded-lg object-contain w-full max-w-sm h-auto"
                  priority
                  quality={75}
                />
              </div>
              {/* Columna derecha - Video */}
              <div className="relative w-full order-1 md:order-2">
                {lessons.coverVideoKey ? (
                  <video
                    className="w-full h-auto rounded-lg object-cover aspect-video"
                    controls
                  >
                    <source
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lessons.coverVideoKey}`}
                    />
                  </video>
                ) : (
                  <>
                    <h4 className="hidden">No hay videos por el momento!.</h4>
                    <Image
                      src={'/NoHayVideos.jpg'}
                      className="mx-auto rounded-lg object-cover w-full h-auto"
                      alt="No hay imagen o video disponible actualmente"
                      width={400}
                      height={300}
                      quality={75}
                    />
                  </>
                )}
              </div>
              <div className="col-span-full mt-4 sm:mt-6 flex justify-center">
                <a
                  href={`/api/super-admin/transcriptionMasive?lessonId=${lessons.id}`}
                  download
                  className="bg-primary hover:bg-[#00A5C0] focus:ring-secondary rounded-lg px-4 sm:px-6 py-2 sm:py-3 text-black text-sm sm:text-base transition duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                >
                  📄 Descargar transcripción (.txt)
                </a>
              </div>
            </div>
            {/* Zona de los files */}
            <div className="mt-6 sm:mt-8">
              <ViewFiles lessonId={lessons.id} selectedColor={color} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-evenly px-2 sm:px-3 py-4 sm:py-6 mt-4">
              <Button
                className={`border-transparent bg-green-400 text-white hover:bg-green-500 w-full sm:w-auto text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-2.5`}
              >
                <Link href={`./${lessons.id}/verClase/${lessons.id}`} className="w-full">
                  👁️ Ver clase
                </Link>
              </Button>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-600 w-full sm:w-auto text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-2.5"
              >
                ✏️ Editar clase
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600 w-full sm:w-auto text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-2.5">
                    🗑️ Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará
                      permanentemente la clase
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
            <div className="mt-6 sm:mt-8">
              <div
                className={`pb-4 sm:pb-6 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-6">📋 Información de la clase</h2>

                {/* Grid de información principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="space-y-2">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide md:text-sm ${color === '#FFFFFF' ? 'text-black/70' : 'text-white/70'}`}>
                      📚 Clase
                    </h3>
                    <h1 className="text-primary text-lg sm:text-xl font-bold">
                      {lessons.title}
                    </h1>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide md:text-sm ${color === '#FFFFFF' ? 'text-black/70' : 'text-white/70'}`}>
                      📂 Categoría
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-primary bg-background text-primary w-fit hover:bg-black/70 text-xs sm:text-sm"
                    >
                      {lessons.course?.categoryName ?? lessons.course?.categoryId ?? 'N/A'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide md:text-sm ${color === '#FFFFFF' ? 'text-black/70' : 'text-white/70'}`}>
                      👨‍🏫 Educador
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-primary bg-background text-primary w-fit hover:bg-black/70 text-xs sm:text-sm"
                    >
                      {lessons.course?.instructorName ?? lessons.course?.instructor ?? 'N/A'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide md:text-sm ${color === '#FFFFFF' ? 'text-black/70' : 'text-white/70'}`}>
                      🎓 Modalidad
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-primary bg-background text-primary w-fit hover:bg-black/70 text-xs sm:text-sm"
                    >
                      {lessons.course?.modalidadName ?? lessons.course?.modalidadId ?? 'N/A'}
                    </Badge>
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-3">
                  <h3 className={`text-xs font-semibold uppercase tracking-wide md:text-sm ${color === '#FFFFFF' ? 'text-black/70' : 'text-white/70'}`}>
                    📝 Descripción
                  </h3>
                  <p className={`text-justify text-sm sm:text-base leading-relaxed ${color === '#FFFFFF' ? 'text-black/90' : 'text-white/90'}`}>
                    {lessons.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-center mt-6 sm:mt-8 px-2">
              <Link
                href={`./${lessons.id}/actividades?lessonId=${lessons.id}`}
                className="cursor-pointer justify-center rounded-lg border-transparent bg-green-400 px-4 sm:px-6 py-2 sm:py-3 text-white hover:bg-green-500 transition duration-300 text-sm sm:text-base w-full sm:w-auto text-center"
              >
                ➕ Crear actividad
              </Link>
            </div>
          </Card>
        </div>
        <div>
          <ListActividadesEducator
            lessonId={lessons.id}
            courseId={courseIdNumber ?? 0}
            coverImageKey={lessons.coverImageKey}
            selectedColor={color}
          />
        </div>
      </div>
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
