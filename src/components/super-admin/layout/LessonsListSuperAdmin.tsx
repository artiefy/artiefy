'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  DragDropContext,
  Draggable,
  type DraggableProvided,
  Droppable,
  type DroppableProvided,
  type DropResult,
} from '@hello-pangea/dnd';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { ArrowUpFromLine, GripVertical, SortAsc } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingCourses } from '~/app/dashboard/super-admin/(inicio)/cursos/page';
import { Badge } from '~/components/educators/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/educators/ui/card';
import { Switch } from '~/components/super-admin/ui/switch';

import ModalFormLessons from '../modals/ModalFormLessons';
import StudentsModal from '../modals/studentModal';
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
  orderIndex: number; // Cambia 'order' por 'orderIndex'
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModeActive, setIsReorderModeActive] = useState(false);

  // Nuevo bloqueo + cooldown
  const [isReordering, setIsReordering] = useState(false);
  const [reorderCooldown, setReorderCooldown] = useState(false);

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
            `/api/super-admin/lessons?courseId=${courseIdString}`
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
  }, [courseId, courseIdString]); // Este efecto se ejecuta cada vez que el courseId cambia

  const ordered = useMemo(
    () =>
      [...lessons].sort(
        (a, b) => (a.orderIndex ?? 1e9) - (b.orderIndex ?? 1e9) || a.id - b.id
      ),
    [lessons]
  );

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
        />
      </div>
    );
  }
  if (error) {
    return <div>Se presentó un error: {error}</div>;
  }

  // Al soltar, reordena localmente, recalcula orderIndex y guarda en backend (PUT por lección)
  const handleDragEnd = async (result: DropResult): Promise<void> => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceIdx: number = source.index;
    const destIdx: number = destination.index;
    if (sourceIdx === destIdx) return;

    const reordered = Array.from(ordered);
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(destIdx, 0, moved);

    const withNewOrder = reordered.map((l, idx) => ({
      ...l,
      orderIndex: idx + 1,
    }));
    setLessons(withNewOrder);

    try {
      await Promise.all(
        withNewOrder.map((l) =>
          fetch(`/api/super-admin/lessons/${l.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIndex: l.orderIndex }),
          })
        )
      );
    } catch (e) {
      console.error('Error al guardar el nuevo orden:', e);
    }
  };

  // Agrega esta función para manejar el drag and drop
  const handleDragEndVisible = async (result: DropResult): Promise<void> => {
    if (!result.destination) return;
    if (isReordering || reorderCooldown) return;
    setIsReordering(true);

    const reordered = Array.from(lessons);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setLessons(reordered);

    const withNewOrder = reordered.map((lesson, index) => ({
      ...lesson,
      orderIndex: index + 1,
    }));

    try {
      const response = await fetch('/api/super-admin/lessons/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonIds: withNewOrder.map((l) => ({
            id: l.id,
            orderIndex: l.orderIndex,
          })),
        }),
      });

      if (response.ok) {
        toast.success('Orden actualizado correctamente');
        setReorderCooldown(true);
        setTimeout(() => setReorderCooldown(false), 1000);
      } else {
        toast.error('Error al actualizar el orden');
        await fetchLessons();
      }
    } catch (error) {
      console.error('Error al reordenar lecciones:', error);
      toast.error('Error al actualizar el orden');
      await fetchLessons();
    } finally {
      setIsReordering(false);
    }
  };

  // Asegúrate de que fetchLessons sea accesible y reutilizable
  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/super-admin/lessons?courseId=${courseIdString}`
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Error al obtener las lecciones');
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

  // Renderizamos las lecciones si todo es correcto
  return (
    <>
      <h2 className="mt-10 mb-4 text-2xl font-bold">Lista de clases:</h2>

      {/* Sección de reordenar - Nueva */}
      <div className="mb-8 flex flex-col gap-4 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SortAsc className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Modo Reordenar Clases</h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${isReorderModeActive ? 'font-bold text-blue-600' : 'text-gray-600'}`}
            >
              {isReorderModeActive ? 'Activado' : 'Desactivado'}
            </span>
            <Switch
              checked={isReorderModeActive}
              onCheckedChange={setIsReorderModeActive}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>

        {isReorderModeActive ? (
          <>
            <p className="text-sm text-gray-600">
              Arrastra y suelta las clases para cambiar su orden. Los cambios se
              guardarán automáticamente.
            </p>

            <DragDropContext onDragEnd={handleDragEndVisible}>
              <Droppable droppableId="lessons">
                {(provided: DroppableProvided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="max-h-[500px] space-y-2 overflow-y-auto p-2"
                  >
                    {lessons.map((lesson, index) => (
                      <Draggable
                        key={lesson.id}
                        draggableId={String(lesson.id)}
                        index={index}
                      >
                        {(
                          provided: DraggableProvided,
                          _snapshot: { isDragging: boolean }
                        ) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-2 rounded-md border bg-white p-3 shadow-sm hover:bg-gray-50"
                            style={
                              provided.draggableProps
                                .style as React.CSSProperties
                            }
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab p-1 active:cursor-grabbing"
                            >
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">
                              {lesson.orderIndex || index + 1}
                            </div>

                            <div className="flex-1 font-medium">
                              {lesson.title}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        ) : (
          <p className="text-sm text-gray-600 italic">
            Activa el modo reordenar para cambiar el orden de las clases
            mediante drag & drop.
          </p>
        )}
      </div>

      {/* Lista de clases original */}
      <div className="flex w-full flex-col">
        <div className="grid grid-cols-1 gap-4 px-3 sm:grid-cols-2 lg:grid-cols-2 lg:px-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lessons">
              {(provided: DroppableProvided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {ordered.map((lesson, index) => (
                    <Draggable
                      key={lesson.id}
                      draggableId={String(lesson.id)}
                      index={index}
                    >
                      {(
                        provided: DraggableProvided,
                        _snapshot: { isDragging: boolean }
                      ) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="lesson-card"
                          style={
                            provided.draggableProps.style as React.CSSProperties
                          }
                        >
                          <div key={lesson.id} className="group relative">
                            <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
                            <Card
                              key={lesson.id}
                              className="zoom-in relative flex flex-col overflow-hidden border-0 border-transparent bg-gray-800 px-2 pt-2 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02]"
                              style={{
                                backgroundColor: selectedColor,
                                color: getContrastYIQ(selectedColor),
                              }}
                            >
                              <div className="relative grid grid-cols-1 p-5 lg:grid-cols-2">
                                <CardHeader>
                                  <div className="relative size-full">
                                    <Image
                                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverImageKey}`}
                                      alt={lesson.title}
                                      className="rounded-lg object-cover px-2 pt-2 transition-transform duration-300 hover:scale-105"
                                      width={350}
                                      height={100}
                                      quality={75}
                                    />
                                  </div>
                                </CardHeader>
                                <CardContent
                                  className={`flex grow flex-col justify-between space-y-2 px-2 ${
                                    selectedColor === '#FFFFFF'
                                      ? 'text-black'
                                      : 'text-white'
                                  }`}
                                >
                                  <CardTitle className="rounded-lg text-lg">
                                    <div className="font-bold">
                                      Clase: {lesson.title}
                                    </div>
                                  </CardTitle>

                                  <div className="mb-2 items-center">
                                    <p className="text-sm font-bold">
                                      Perteneciente al curso:
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="border-primary bg-background text-primary ml-1 hover:bg-black/70"
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
                                    <span className="font-bold italic">
                                      {lesson.orderIndex}
                                    </span>
                                  </p>

                                  <p className="text-sm font-bold italic">
                                    Duración:{' '}
                                    <span className="font-bold italic">
                                      {lesson.duration} Minutos
                                    </span>
                                  </p>

                                  <p className="text-sm font-bold italic">
                                    Orden:{' '}
                                    <input
                                      type="number"
                                      value={lesson.orderIndex}
                                      min={1}
                                      className="w-16 rounded border px-2 py-1 text-black"
                                      onChange={async (e) => {
                                        const newOrder = Number(e.target.value);
                                        await fetch(
                                          `/api/super-admin/lessons/${lesson.id}/order`,
                                          {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type':
                                                'application/json',
                                            },
                                            body: JSON.stringify({
                                              orderIndex: newOrder,
                                            }),
                                          }
                                        );
                                        // Si quieres refrescar la lista aquí, llama a fetchLessons()
                                        // await fetchLessons();
                                      }}
                                    />
                                  </p>
                                </CardContent>
                              </div>

                              <CardFooter className="-mt-6 flex flex-col items-start justify-between">
                                <Button asChild className="mx-auto">
                                  <Link
                                    href={`/dashboard/super-admin/cursos/${courseId}/${lesson.id}`}
                                    className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-yellow-500 p-2 text-white hover:border-yellow-600 hover:bg-yellow-500 active:scale-95"
                                  >
                                    <p>Ver clase</p>
                                    <ArrowRightIcon className="animate-bounce-right size-5" />
                                    <div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
                                      <div className="relative h-full w-10 bg-white/30" />
                                    </div>
                                  </Link>
                                </Button>
                              </CardFooter>
                            </Card>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div className="mx-auto my-4">
          <Button
            className={`bg-primary mx-auto mt-6 cursor-pointer justify-center border-transparent font-semibold ${
              selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
            }`}
            style={{ backgroundColor: selectedColor }}
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
      </div>
      <ModalFormLessons
        isOpen={isModalOpenLessons}
        onCloseAction={() => setIsModalOpenLessons(false)}
        courseId={courseId}
        uploading={false}
      />
      <StudentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
      />
      {isReordering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-md bg-white/90 px-6 py-4 text-sm font-medium text-black">
            Guardando nuevo orden...
          </div>
        </div>
      )}
    </>
  );
};

export default LessonsListEducator;
