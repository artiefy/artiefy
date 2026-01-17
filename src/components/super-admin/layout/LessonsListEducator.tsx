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
import { Card, CardTitle } from '~/components/educators/ui/card';
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

  // Nuevo: bloqueo mientras se persiste el nuevo orden y cooldown para evitar re-arrastres rápidos
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
            className={`mx-auto cursor-pointer border-transparent px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:shadow-xl active:scale-95 ${
              selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
            }`}
            style={{ backgroundColor: selectedColor }}
            onClick={() => {
              console.log('Botón Crear nueva clase clickeado');
              setIsModalOpenLessons(true);
              console.log('isModalOpenLessons:', isModalOpenLessons);
            }}
          >
            <ArrowUpFromLine className="mr-2" />
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
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (isReordering || reorderCooldown) return; // bloquea si ya hay una ordenación en curso o cooldown

    setIsReordering(true);

    const sourceIdx = result.source.index;
    const destIdx = result.destination.index;
    if (sourceIdx === destIdx) return;

    const reordered = Array.from(ordered);
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(destIdx, 0, moved);

    // Reasigna orderIndex = posición + 1
    const withNewOrder = reordered.map((l, idx) => ({
      ...l,
      orderIndex: idx + 1,
    }));
    setLessons(withNewOrder);

    // Persistir cambios: PUT /api/super-admin/lessons/[id] con { orderIndex }
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
      // opcional: recargar si falla
      // location.reload();
    } finally {
      setIsReordering(false);
    }
  };

  // Al soltar en la vista "visible" (arrastrable en panel lateral)
  const handleDragEndVisible = async (result: DropResult) => {
    if (!result.destination) return;
    if (isReordering || reorderCooldown) return; // bloquea si ya hay una ordenación en curso o cooldown

    setIsReordering(true);

    // ✅ USAR ordered EN LUGAR DE lessons
    const reordered = Array.from(ordered);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Recalcular orderIndex = posición + 1 para cada elemento
    const withNewOrder = reordered.map((lesson, index) => ({
      ...lesson,
      orderIndex: index + 1,
    }));

    // ✅ Actualizar lessons (estado principal) con el nuevo orden
    setLessons(withNewOrder);

    try {
      // Enviar nuevo orden al servidor
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
        // Establecer cooldown corto para evitar nuevos drags inmediatos
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
            <h3 className="text-background text-lg font-semibold">
              Modo Reordenar Clases
            </h3>
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
                    {/* ✅ USAR ordered EN LUGAR DE lessons */}
                    {ordered.map((lesson, index) => (
                      <Draggable
                        key={lesson.id}
                        draggableId={String(lesson.id)}
                        index={index}
                      >
                        {(provided: DraggableProvided, _snapshot) => (
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
                            <div className="text-background flex-1 font-medium">
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
            Activa el modo reordenar para cambiar el orden de las clases.
          </p>
        )}
      </div>

      {/* Botón Crear nueva clase */}
      <div className="mx-auto my-8">
        <Button
          className={`mx-auto cursor-pointer border-transparent px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:shadow-xl active:scale-95 ${
            selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
          }`}
          style={{ backgroundColor: selectedColor }}
          onClick={() => {
            console.log('Botón Crear nueva clase clickeado');
            setIsModalOpenLessons(true);
            console.log('isModalOpenLessons:', isModalOpenLessons);
          }}
        >
          <ArrowUpFromLine className="mr-2" />
          Crear nueva clase
        </Button>
      </div>

      {/* Lista de clases original - Modificado para una sola card por fila con diseño mejorado */}
      <div className="flex w-full flex-col">
        {isReorderModeActive ? (
          // En modo ordenar, usar el DragDropContext como antes
          <div className="px-3 lg:px-1">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="lessons">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {ordered.map((lesson, index) => (
                      <Draggable
                        key={lesson.id}
                        draggableId={String(lesson.id)}
                        index={index}
                      >
                        {(provided: DraggableProvided, _snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={
                              provided.draggableProps
                                .style as React.CSSProperties
                            }
                          >
                            {/* Card content */}
                            <div className="group relative">
                              <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
                              <Card
                                className="zoom-in relative flex flex-col overflow-hidden border-0 border-transparent bg-gray-800 shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl"
                                style={{
                                  backgroundColor: selectedColor,
                                  color: getContrastYIQ(selectedColor),
                                }}
                              >
                                {/* Card content en horizontal */}
                                <div className="relative flex flex-col lg:flex-row">
                                  {/* Imagen a la izquierda */}
                                  <div className="lg:w-1/6">
                                    <div className="relative h-20 w-full lg:h-full">
                                      <Image
                                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverImageKey}`}
                                        alt={lesson.title}
                                        className="h-full w-full rounded-l-lg object-cover transition-transform duration-300 hover:scale-105"
                                        width={400}
                                        height={300}
                                        quality={75}
                                      />
                                      <div className="absolute top-2 left-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-xs font-bold text-white shadow-xl ring-2 ring-white/50">
                                          {lesson.orderIndex}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Contenido a la derecha */}
                                  <div className="flex flex-1 flex-col justify-center gap-2 p-4 lg:w-5/6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <CardTitle className="text-base leading-tight font-bold">
                                        {lesson.title}
                                      </CardTitle>

                                      <Button asChild>
                                        <Link
                                          href={`/dashboard/super-admin/cursos/${courseId}/${lesson.id}`}
                                          className="group/button relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-yellow-600 hover:to-orange-600 hover:shadow-lg active:scale-95"
                                        >
                                          <span>Ver clase</span>
                                          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                                        </Link>
                                      </Button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-1 backdrop-blur-sm">
                                        <span>📚</span>
                                        <span className="font-medium">
                                          {lesson.course.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 backdrop-blur-sm">
                                        <span>⏱️</span>
                                        <span className="font-medium">
                                          {lesson.duration} min
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1 backdrop-blur-sm">
                                        <span>👨‍🏫</span>
                                        <span className="font-medium">
                                          {lesson.course.instructor}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
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
        ) : (
          // Fuera del modo ordenar, una sola card por fila con diseño mejorado
          <div className="space-y-4 px-3 lg:px-1">
            {ordered.map((lesson) => (
              <div key={lesson.id} className="group relative">
                <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
                <Card
                  className="zoom-in relative flex flex-col overflow-hidden border-0 border-transparent bg-gray-800 shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl"
                  style={{
                    backgroundColor: selectedColor,
                    color: getContrastYIQ(selectedColor),
                  }}
                >
                  {/* Card content en horizontal */}
                  <div className="relative flex flex-col lg:flex-row">
                    {/* Imagen a la izquierda */}
                    <div className="lg:w-1/6">
                      <div className="relative h-20 w-full lg:h-full">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverImageKey}`}
                          alt={lesson.title}
                          className="h-full w-full rounded-l-lg object-cover transition-transform duration-300 hover:scale-105"
                          width={400}
                          height={300}
                          quality={75}
                        />
                      </div>
                    </div>

                    {/* Contenido a la derecha */}
                    <div className="flex flex-1 flex-col justify-center gap-2 p-4 lg:w-5/6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="text-base leading-tight font-bold">
                          {lesson.title}
                        </CardTitle>

                        <Button asChild>
                          <Link
                            href={`/dashboard/super-admin/cursos/${courseId}/${lesson.id}`}
                            className="group/button relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-yellow-600 hover:to-orange-600 hover:shadow-lg active:scale-95"
                          >
                            <span>Ver clase</span>
                            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                          </Link>
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-1 backdrop-blur-sm">
                          <span className="font-medium">
                            {lesson.course.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 backdrop-blur-sm">
                          <span className="font-medium">
                            {lesson.duration} min
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1 backdrop-blur-sm">
                          <span className="font-medium">
                            {lesson.course.instructor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
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
