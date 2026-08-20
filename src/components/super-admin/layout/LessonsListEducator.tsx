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
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MdVideoLibrary } from 'react-icons/md';
import { toast } from 'sonner';

import { LoadingCourses } from '~/app/dashboard/super-admin/(inicio)/cursos/page';
import { TranscribeCourseButton } from '~/components/super-admin/transcriptions/TranscriptionButtons';
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
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const toggleLesson = (id: number) =>
    setExpandedLesson((prev) => (prev === id ? null : id));

  // Nuevo: bloqueo mientras se persiste el nuevo orden y cooldown para evitar re-arrastres rápidos
  const [isReordering, setIsReordering] = useState(false);
  const [reorderCooldown, setReorderCooldown] = useState(false);

  const courseIdString = courseId.toString();

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
      <div
        className="rounded-lg border p-8 text-center"
        style={{ backgroundColor: '#061c37', borderColor: '#1d283a' }}
      >
        <h2 className="mb-2 text-2xl font-bold text-white">
          Lista de clases creadas
        </h2>
        <p className="text-lg text-gray-300">
          No hay clases creadas hasta el momento
        </p>
        <p className="my-2 text-gray-400">
          Comienza creando tu primer clase haciendo clic en el botón de abajo
          <br /> &quot;Crear Clase&quot;
        </p>
        <span className="text-2xl">&#128071;&#128071;&#128071;</span>
        <div className="mt-4">
          <Button
            className={`
              mx-auto cursor-pointer border px-8 py-6 text-lg font-semibold
              shadow-lg transition-all
              hover:shadow-xl hover:shadow-[#22C4D3]/20
              active:scale-95
              ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}
            `}
            style={{
              backgroundColor: selectedColor,
              borderColor: 'rgba(34,196,211,0.35)',
            }}
            onClick={() => {
              setIsModalOpenLessons(true);
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
    return (
      <div
        className="rounded-lg border p-4 text-red-300"
        style={{ backgroundColor: '#061c37', borderColor: '#1d283a' }}
      >
        Se presentó un error: {error}
      </div>
    );
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
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: '#061c37', borderColor: '#1d283a' }}
    >
      <h2 className="mb-4 flex items-center justify-between text-xl font-bold text-white">
        <div className="flex items-center gap-3">
          <span
            className="
              inline-flex items-center justify-center rounded-full border
              border-transparent bg-blue-500/20 p-2 text-blue-300
            "
          >
            <MdVideoLibrary className="size-4" />
          </span>
          Clases del Curso
        </div>
        <div className="flex items-center gap-3">
          <TranscribeCourseButton courseId={courseId} />
          <div
            className="
              inline-flex items-center rounded-full border border-primary/30
              px-2.5 py-0.5 text-xs font-semibold text-primary
            "
          >
            {lessons.length} clases
          </div>
        </div>
      </h2>

      {/* Sección de reordenar */}
      <div
        className="mb-8 flex flex-col gap-4 rounded-lg border p-4"
        style={{ backgroundColor: '#1a233366', borderColor: '#1d283a' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SortAsc className="size-5 text-blue-300" />
            <h3 className="text-lg font-semibold text-white">
              Modo Reordenar Clases
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`
          text-sm
          ${isReorderModeActive ? 'font-bold text-blue-300' : 'text-gray-400'}`}
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
            <p className="text-sm text-gray-400">
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
                            className="flex items-center gap-2 rounded-md border p-3"
                            style={{
                              backgroundColor: '#1a233366',
                              borderColor: '#1d283a',
                              ...(provided.draggableProps
                                .style as React.CSSProperties),
                            }}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="
                          cursor-grab p-1
                          active:cursor-grabbing
                        "
                            >
                              <GripVertical className="size-5 text-gray-400" />
                            </div>
                            <div
                              className="
                          flex size-8 items-center justify-center
                          rounded-full bg-blue-500/20 font-bold text-blue-300
                        "
                            >
                              {lesson.orderIndex || index + 1}
                            </div>
                            <div className="flex-1 font-medium text-white">
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
          <p className="text-sm text-gray-400 italic">
            Activa el modo reordenar para cambiar el orden de las clases.
          </p>
        )}
      </div>

      {/* Botón Crear nueva clase */}
      <div className="mx-auto my-8">
        <Button
          className={`
            mx-auto cursor-pointer border px-8 py-6 text-lg font-semibold
            shadow-lg transition-all
            hover:shadow-xl hover:shadow-[#22C4D3]/20
            active:scale-95
            ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}
          `}
          style={{
            backgroundColor: selectedColor,
            borderColor: 'rgba(34,196,211,0.35)',
          }}
          onClick={() => {
            setIsModalOpenLessons(true);
          }}
        >
          <ArrowUpFromLine className="mr-2" />
          Crear nueva clase
        </Button>
      </div>

      {/* Lista de clases: mismo acordeón oscuro que usan los estudiantes */}
      <div className="flex w-full flex-col">
        {isReorderModeActive ? (
          // En modo ordenar, usar el DragDropContext como antes
          <div
            className="
              px-3
              lg:px-1
            "
          >
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
                            className="overflow-hidden rounded-lg border text-white"
                            style={{
                              backgroundColor: '#1a233366',
                              borderColor: '#1d283a',
                              ...(provided.draggableProps
                                .style as React.CSSProperties),
                            }}
                          >
                            <div className="flex w-full items-center gap-3 p-4 sm:px-6">
                              <GripVertical className="size-4 shrink-0 text-gray-400" />
                              <MdVideoLibrary className="size-5 shrink-0 text-blue-300" />
                              <span className="min-w-0 flex-1 truncate font-medium text-white">
                                {lesson.title}
                              </span>
                              {Number(lesson.duration) > 0 && (
                                <span className="shrink-0 text-sm text-gray-300">
                                  ({lesson.duration} mins)
                                </span>
                              )}
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
          // Fuera del modo ordenar: acordeón, igual estilo/uso que en estudiantes
          <div
            className="
              space-y-4 px-3
              lg:px-1
            "
          >
            {ordered.map((lesson) => (
              <div
                key={lesson.id}
                className="overflow-hidden rounded-lg border text-white transition-colors"
                style={{
                  backgroundColor: '#1a233366',
                  borderColor: '#1d283a',
                }}
              >
                <button
                  type="button"
                  className="
                    flex w-full items-center justify-between p-4
                    sm:px-6
                  "
                  onClick={() => toggleLesson(lesson.id)}
                >
                  <div
                    className="
                      flex w-full min-w-0 flex-wrap items-start
                      justify-between gap-3
                      sm:flex-nowrap sm:items-center
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start gap-2">
                        <MdVideoLibrary className="mt-0.5 size-5 shrink-0 text-blue-300" />
                        <span
                          className="
                            min-w-0 flex-1 truncate text-left font-medium
                            text-white
                          "
                        >
                          {lesson.title}
                        </span>
                        {Number(lesson.duration) > 0 && (
                          <span className="shrink-0 text-sm text-gray-300">
                            ({lesson.duration} mins)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      {expandedLesson === lesson.id ? (
                        <FaChevronUp className="text-gray-400" />
                      ) : (
                        <FaChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedLesson === lesson.id && (
                  <div
                    className="border-t px-6 py-5"
                    style={{
                      borderColor: '#1d283a',
                      backgroundColor: '#0d1a2f',
                    }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div
                        className="
                          relative size-24 shrink-0 overflow-hidden
                          rounded-xl border-2 shadow-lg
                        "
                        style={{ borderColor: 'rgba(34,196,211,0.4)' }}
                      >
                        <Image
                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${lesson.coverImageKey}`}
                          alt={lesson.title}
                          fill
                          className="object-cover"
                          quality={75}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        {lesson.description && (
                          <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">
                            {lesson.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <div
                            className="
                              flex items-center gap-1.5 rounded-full
                              border border-[#22C4D3]/30 bg-[#22C4D3]/10
                              px-3 py-1 text-[#22C4D3]
                            "
                          >
                            <span className="font-medium">
                              👨‍🏫 {lesson.course.instructor}
                            </span>
                          </div>
                          {Number(lesson.duration) > 0 && (
                            <div
                              className="
                                flex items-center gap-1.5 rounded-full
                                border border-purple-400/30 bg-purple-500/10
                                px-3 py-1 text-purple-300
                              "
                            >
                              <span className="font-medium">
                                ⏱️ {lesson.duration} min
                              </span>
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/dashboard/super-admin/cursos/${courseId}/${lesson.id}`}
                          className="
                            group/button relative inline-flex items-center
                            justify-center gap-1.5 overflow-hidden rounded-lg
                            bg-gradient-to-r from-[#22C4D3] to-cyan-600 px-4
                            py-2 text-sm font-semibold text-[#04101f]
                            shadow-md transition-all
                            hover:from-cyan-400 hover:to-cyan-500
                            hover:shadow-lg hover:shadow-[#22C4D3]/30
                            active:scale-95
                          "
                        >
                          <span>Ver clase</span>
                          <ArrowRightIcon
                            className="
                              size-4 transition-transform
                              group-hover/button:translate-x-1
                            "
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
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
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center bg-black/30
          "
        >
          <div
            className="
              rounded-md bg-white/90 px-6 py-4 text-sm font-medium text-black
            "
          >
            Guardando nuevo orden...
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonsListEducator;
