'use client';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import { toast } from 'sonner';

import CalificarPreguntas from '~/components/educators/dashboard/CalificarPreguntas';
import FormActCompletado from '~/components/educators/layout/FormActCompletado';
import QuestionSubidaList from '~/components/educators/layout/ListActSubidaFile';
import ListPreguntaAbierta from '~/components/educators/layout/ListPreguntaAbierta';
import ListPreguntaAbierta2 from '~/components/educators/layout/ListPreguntaAbierta2';
import PreguntasAbiertas from '~/components/educators/layout/PreguntasAbiertas';
import PreguntasAbiertas2 from '~/components/educators/layout/PreguntasAbiertas2';
import QuestionForm from '~/components/educators/layout/QuestionsForms';
import QuestionList from '~/components/educators/layout/QuestionsList';
import SeleccionActi from '~/components/educators/layout/SeleccionActi';
import QuestionVOFForm from '~/components/educators/layout/VerdaderoOFalseForm';
import QuestionVOFList from '~/components/educators/layout/VerdaderoOFalseList';
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
import { Button } from '~/components/educators/ui/button';
import VerRespuestasArchivos from '~/components/educators/VerRespuestasArchivos';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';

import type {
  Completado,
  Question,
  QuestionFilesSubida,
  VerdaderoOFlaso,
} from '~/types/typesActi';

//Renderizar la creacion y configuracion de la actividad segun su id

// Definir la interfaz de la actividad
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
  nota: number;
  revisada: boolean;
  parametros: string;
  pesoNota: number;
  lesson: {
    id: number;
    title: string;
    coverImageKey: string;
    courseId: number;
    courseTitle: string;
    courseDescription: string;
    courseInstructor: string;
    courseInstructorName?: string | null;
  };
  fechaMaximaEntrega: string | null;
}

// Definir la interfaz de los porcentajes
interface PorcentajeResponse {
  usado: number;
  disponible: number;
  resumen: {
    opcionMultiple: number;
    verdaderoFalso: number;
    completar: number;
  };
}

// Color pasado a SeleccionActi (sin relación con el fondo de la página, que
// ahora es fijo, igual que en CourseDetail).
const SELECCION_COLOR = 'oklch(19% 0.0542 252.35)';

const Page: React.FC = () => {
  const params = useParams(); // Obtener los parametros de la URL
  const searchParams = useSearchParams(); // para obtener activityId del query string
  void searchParams; // Evitar el warning de ESLint por no usar searchParams
  const actividadIdUrl = params?.activityId ?? null; // Obtener el id de la actividad
  const lessonsId = params?.lessonId ?? null; // Obtener el id de la leccion
  const courseId = params?.courseId ?? null; // Obtener el id del curso
  const [actividad, setActividad] = useState<ActivityDetails | null>(null); // Estado de la actividad
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState<string | null>(null); // Estado de error
  const [selectedActivityType, setSelectedActivityType] = useState<string>(''); // Estado del tipo de actividad seleccionado
  const [questions, setQuestions] = useState<string[]>([]); // Estado de las preguntas

  type TipoPregunta = 'OM' | 'FOV' | 'COMPLETADO' | 'ARCHIVO';

  type EditableQuestion = (
    Question | VerdaderoOFlaso | Completado | QuestionFilesSubida
  ) & {
    tipo: TipoPregunta;
  };

  const [editingQuestion, setEditingQuestion] =
    useState<EditableQuestion | null>(null);

  // Convertir los parametros de la URL a numeros
  const actividadIdString = Array.isArray(actividadIdUrl)
    ? actividadIdUrl[0]
    : actividadIdUrl; // Obtener el id de la actividad
  const actividadIdNumber = actividadIdString
    ? parseInt(actividadIdString)
    : null; // Convertir el id de la actividad a numero
  const lessonIdString = Array.isArray(lessonsId) ? lessonsId[0] : lessonsId; // Obtener el id de la leccion
  const lessonIdNumber = lessonIdString ? parseInt(lessonIdString) : null; // Convertir el id de la leccion a numero
  const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId; // Obtener el id del curso
  const courseIdNumber = courseIdString ? parseInt(courseIdString) : null; // Convertir el id del curso a numero
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [porcentajeUsado, setPorcentajeUsado] = useState(0);
  const [porcentajeDisponible, setPorcentajeDisponible] = useState(100);

  const [resumenPorTipo, setResumenPorTipo] = useState({
    opcionMultiple: 0,
    verdaderoFalso: 0,
    completar: 0,
  });

  // Funcion para cargar la actividad
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
          toast('Error', {
            description: `No se pudo cargar la actividad: ${errorMessage}`,
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar la actividad: ${errorMessage}`);
        toast('Error', {
          description: `No se pudo cargar la actividad: ${errorMessage}`,
        });
      } finally {
        setLoading(false);
      }
    }
  }, [actividadIdNumber]);

  // Cargar la actividad
  useEffect(() => {
    fetchActividad().catch((error) =>
      console.error('Error fetching activity:', error)
    );
  }, [fetchActividad]);

  const fetchPorcentajes = useCallback(() => {
    if (actividadIdNumber !== null) {
      fetch(
        `/api/educadores/actividades/porcentajes?activityId=${actividadIdNumber}`
      )
        .then((res) => res.json() as Promise<PorcentajeResponse>)
        .then((data) => {
          setPorcentajeUsado(Number(data.usado));
          setPorcentajeDisponible(Number(data.disponible));
          if (
            typeof data.resumen === 'object' &&
            data.resumen !== null &&
            'opcionMultiple' in data.resumen &&
            'verdaderoFalso' in data.resumen &&
            'completar' in data.resumen
          ) {
            setResumenPorTipo({
              opcionMultiple: Number(data.resumen.opcionMultiple),
              verdaderoFalso: Number(data.resumen.verdaderoFalso),
              completar: Number(data.resumen.completar),
            });
          }
        })
        .catch((err) => {
          console.error('Error obteniendo porcentajes por tipo:', err);
        });
    }
  }, [actividadIdNumber]);

  useEffect(() => {
    if (actividadIdNumber !== null) {
      fetch(
        `/api/educadores/actividades/porcentajes?activityId=${actividadIdNumber}`
      )
        .then((res) => res.json() as Promise<PorcentajeResponse>)
        .then((data) => {
          setPorcentajeUsado(Number(data.usado));
          setPorcentajeDisponible(Number(data.disponible));
          setResumenPorTipo({
            opcionMultiple: Number(data.resumen.opcionMultiple),
            verdaderoFalso: Number(data.resumen.verdaderoFalso),
            completar: Number(data.resumen.completar),
          });
        })
        .catch((err) => {
          console.error('Error obteniendo porcentajes por tipo:', err);
        });
    }
  }, [actividadIdNumber]);

  useEffect(() => {
    fetchPorcentajes();
  }, [shouldRefresh, fetchPorcentajes]);

  // Funcion para eliminar la actividad
  const handleDeleteAct = async () => {
    if (actividadIdNumber) {
      try {
        const response = await fetch(
          `/api/educadores/actividades?id=${actividadIdNumber}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          toast('Actividad eliminada', {
            description:
              'La actividad y todos sus archivos asociados se eliminaron con éxito.',
          });
          window.history.back();
        } else {
          const errorData = (await response.json()) as { error?: string };
          toast('Error', {
            description: errorData.error ?? 'Error al eliminar la actividad.',
          });
        }
      } catch (error: unknown) {
        if ((error as Error).name === 'AbortError') {
          console.log('Delete cancelled');
          return;
        } else {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          toast('Error', {
            description: `Error al eliminar la actividad: ${errorMessage}`,
          });
        }
      }
    }
  };

  // Funcion del boton para agregar una pregunta a la actividad
  const handleAddQuestion = () => {
    if (selectedActivityType) {
      setQuestions([selectedActivityType]); // Solo mantener el nuevo formulario
      setSelectedActivityType('');
    }
  };

  // Funcion para manejar el envio del formulario
  const handleFormSubmit = () => {
    setEditingQuestion(null);
    setQuestions([]);
    setShouldRefresh((prev) => !prev);
  };

  // Funcion para cancelar la edicion de la pregunta
  const handleCancel = () => {
    setEditingQuestion(null);
    setQuestions([]); // Limpiar las preguntas para dejar de renderizar el formulario
  };

  // Spinner de carga
  if (loading) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <div
          className="
            size-32 animate-spin rounded-full border-y-2 border-primary
          "
        >
          <span className="sr-only" />
        </div>
        <span className="text-primary">Cargando...</span>
      </main>
    );
  }

  // Mostrar el error con boton para volver a cargar
  if (error) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">
            Error tipo: {error}
          </p>
          <button
            onClick={fetchActividad}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Mostrar mensaje si no se encuentra la actividad
  if (!actividad)
    return (
      <div className="text-center text-xl">No se encontró la actividad.</div>
    );

  // Imagen de la lección — reutilizada en móvil (bajo el hero) y en desktop
  // (columna lateral sticky), igual que en CourseDetail y en Clase.
  const renderMedia = () => (
    <div
      className="
        relative overflow-hidden rounded-2xl border border-[#1d283a]
        bg-[#061c37] p-4
        sm:p-6
      "
    >
      <Image
        src={
          actividad.lesson.coverImageKey
            ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${actividad.lesson.coverImageKey}`
            : `/favicon.ico`
        }
        alt="Imagen de la lección"
        width={400}
        height={400}
        className="mx-auto h-auto w-full rounded-lg object-cover shadow-lg"
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}/actividades/${actividadIdNumber}/verActividad`}
          className="
            w-full rounded-lg bg-[#22C4D3] px-2 py-1.5 text-center text-xs
            text-white
            transition-colors duration-200
            hover:bg-cyan-600
          "
        >
          Realizar Actividad
        </Link>

        <Link
          href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}/actividades?activityId=${actividadIdNumber}`}
          className="
            w-full rounded-lg bg-[#22C4D3] px-2 py-1.5 text-center text-xs
            text-white
            transition-colors duration-200
            hover:bg-cyan-600
          "
        >
          Editar Actividad
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="
                col-span-2 w-full rounded-lg border border-red-600
                bg-red-600 px-2 py-1.5 text-xs text-white
                transition-colors duration-200
                hover:bg-white hover:text-red-600
              "
            >
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                la actividad
                <span className="font-bold">
                  {' '}
                  {actividad?.name}, del tipo: {actividad?.type?.name}
                </span>{' '}
                y todos los datos asociados a este.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAct}
                className="
                  rounded-lg border border-red-600 bg-red-600 px-4 py-2
                  text-white transition-colors duration-200
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

  return (
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
          pointer-events-none absolute inset-0 bg-gradient-to-br from-black/50
          via-[#1a2d4a]/30 to-black/50
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

      <div className="relative z-10">
        <Breadcrumb className="animate-slideInDown mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="
                  text-[#22C4D3] transition-colors duration-300
                  hover:text-[#22C4D3]
                "
                href="/dashboard/super-admin"
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
                href="/dashboard/super-admin/cursos"
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
                href={`/dashboard/super-admin/cursos/${courseIdNumber}`}
              >
                Detalles curso
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/dashboard/super-admin/cursos/${courseIdNumber}/${lessonIdNumber}`}
                className="
                  text-[#22C4D3] transition-colors duration-300
                  hover:text-[#22C4D3]
                "
              >
                Lección
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={() => window.history.back()}
                className="text-white/60"
              >
                Creación de actividad
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-2">
            <div
              className="
                relative overflow-hidden rounded-2xl border border-[#1d283a]
                bg-[#061c37] p-4 shadow-2xl
                sm:p-8
              "
            >
              <div className="mb-6 space-y-3">
                <h2 className="font-display text-2xl leading-tight font-bold text-white sm:text-3xl md:text-4xl">
                  Actividad: <b>{actividad.name}</b>
                </h2>
                <p className="text-base text-white/70 sm:text-lg">
                  Perteneciente a la clase: {actividad.lesson?.title}
                </p>
              </div>

              <div
                className="
                  grid grid-cols-1 gap-4 text-sm
                  sm:grid-cols-2 sm:text-base
                "
              >
                <p className="font-semibold text-white">
                  Del docente:{' '}
                  <span className="ml-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                    {actividad.lesson?.courseInstructorName ??
                      actividad.lesson.courseInstructor}
                  </span>
                </p>
                <p className="font-semibold text-white">
                  Tipo de actividad:{' '}
                  <b className="text-[#22C4D3]">{actividad.type?.name}</b>
                </p>
                <p className="font-semibold text-white sm:col-span-2">
                  Permite: <b>{actividad.type?.description}</b>
                </p>
                <p className="font-semibold text-white sm:col-span-2">
                  Descripción de la actividad:{' '}
                  <b className="block">{actividad.description}.</b>
                </p>
                <p className="font-semibold text-white">
                  ¿La actividad es calificable?:{' '}
                  <span className="ml-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                    {actividad.revisada ? 'Si' : 'No'}.
                  </span>
                </p>
                <p className="font-semibold text-white">
                  Fecha máxima de entrega:{' '}
                  <span className="ml-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#22C4D3]/40 px-3 py-1.5 text-xs font-medium text-white">
                    {actividad.fechaMaximaEntrega
                      ? new Date(actividad.fechaMaximaEntrega).toLocaleString()
                      : 'No tiene fecha máxima de entrega'}
                    .
                  </span>
                </p>
              </div>

              <div className="mt-6 lg:hidden">{renderMedia()}</div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-6">{renderMedia()}</div>
          </div>
        </div>

        <div
          className="
            relative mt-6 overflow-hidden rounded-2xl border
            border-[#1d283a] bg-[#061c37] p-4 shadow-2xl
            sm:p-8
          "
        >
          {/* Zona de actividades, renderiza la creacion de la actividad segun su tipo "las cuales estan en la database" */}
          {actividad?.type.id === 1 ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl bg-[#061c37] shadow-md">
                <div className="space-y-4">
                  {actividadIdNumber !== null && (
                    <>
                      <div className="overflow-hidden rounded-2xl border border-[#1d283a]">
                        <div className="rounded-t-2xl bg-gradient-to-r from-[#01142B] to-[#22C4D3]/10 p-4">
                          <h2 className="bg-gradient-to-r from-[#22C4D3] to-white bg-clip-text text-center text-lg font-semibold text-transparent sm:text-xl">
                            Gestión de Archivos y Calificaciones
                          </h2>
                          <p className="mt-1 text-center text-xs text-white/60 sm:text-sm">
                            En esta sección puedes gestionar los archivos
                            subidos por los estudiantes y asignar
                            calificaciones.
                          </p>
                        </div>
                        <VerRespuestasArchivos
                          activityId={actividadIdNumber.toString()}
                        />
                      </div>
                      {editingQuestion?.tipo === 'ARCHIVO' &&
                        'parametros' in editingQuestion && (
                          <FormActCompletado
                            activityId={actividadIdNumber}
                            editingQuestion={editingQuestion}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCancel}
                          />
                        )}

                      <div
                        className="
                          rounded-2xl border border-[#1d283a] bg-[#061c37] p-6
                        "
                      >
                        <QuestionSubidaList
                          key={`subida-${shouldRefresh}`}
                          activityId={actividadIdNumber}
                          onEdit={(q) => {
                            if ('parametros' in q) {
                              console.log(
                                '[onEdit] Editando pregunta con parámetros:',
                                q
                              );
                              setEditingQuestion({ ...q, tipo: 'ARCHIVO' });
                            } else {
                              console.warn(
                                '[onEdit] La pregunta no tiene "parametros":',
                                q
                              );
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : actividad?.type.id === 2 ? (
            <>
              <SeleccionActi
                selectedColor={SELECCION_COLOR}
                onSelectChange={setSelectedActivityType}
              />
              <div className="mt-2 text-center text-sm text-white">
                <p>
                  <strong>Porcentaje usado por tipo de pregunta:</strong>
                </p>
                <p>
                  🟡 Opción Múltiple: {resumenPorTipo.opcionMultiple}%, 🔵
                  Verdadero/Falso: {resumenPorTipo.verdaderoFalso}%, 🟢
                  Completar: {resumenPorTipo.completar}%
                </p>
                <hr className="my-2" />
                <p>
                  Total usado: <strong>{porcentajeUsado}%</strong>
                </p>
                <p>
                  Porcentaje disponible:{' '}
                  <strong>{porcentajeDisponible}%</strong>
                </p>
              </div>

              {selectedActivityType && (
                <Button
                  className="
                    mx-auto mb-4 w-full border border-[#22C4D3]/30
                    bg-transparent text-white
                    hover:bg-[#22C4D3]/10
                    sm:w-2/4
                    md:w-1/4
                  "
                  onClick={handleAddQuestion}
                >
                  Agregar Pregunta
                </Button>
              )}
              {/* Para agregar nuevas preguntas */}
              {questions.map((questionType, index) => (
                <div key={index}>
                  {questionType === 'OM' && actividadIdNumber !== null && (
                    <QuestionForm
                      activityId={actividadIdNumber}
                      onSubmit={handleFormSubmit}
                      onCancel={handleCancel}
                      isUploading={false}
                      editingQuestion={undefined} // <- ✅ Tipo correcto
                    />
                  )}
                  {questionType === 'FOV' && actividadIdNumber !== null && (
                    <QuestionVOFForm
                      activityId={actividadIdNumber}
                      onSubmit={handleFormSubmit}
                      onCancel={handleCancel}
                      isUploading={false}
                      editingQuestion={undefined} // <- ✅ Tipo correcto
                    />
                  )}
                  {questionType === 'COMPLETADO' &&
                    actividadIdNumber !== null && (
                      <PreguntasAbiertas
                        activityId={actividadIdNumber}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCancel}
                        isUploading={false}
                      />
                    )}
                </div>
              ))}

              {/* Para editar una pregunta existente */}
              {editingQuestion && (
                <div className="mt-4">
                  {editingQuestion.tipo === 'OM' &&
                    actividadIdNumber !== null && (
                      <QuestionForm
                        activityId={actividadIdNumber}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCancel}
                        isUploading={false}
                        editingQuestion={editingQuestion as Question}
                      />
                    )}
                  {editingQuestion.tipo === 'FOV' &&
                    actividadIdNumber !== null && (
                      <QuestionVOFForm
                        activityId={actividadIdNumber}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCancel}
                        isUploading={false}
                        editingQuestion={editingQuestion as VerdaderoOFlaso}
                      />
                    )}
                </div>
              )}

              {actividadIdNumber !== null && (
                <>
                  <QuestionVOFList
                    key={`vof-${shouldRefresh}`}
                    activityId={actividadIdNumber}
                    onEdit={(q) => setEditingQuestion({ ...q, tipo: 'FOV' })}
                    shouldRefresh={shouldRefresh}
                  />

                  <QuestionList
                    key={`om-${shouldRefresh}`}
                    activityId={actividadIdNumber}
                    onEdit={(q) => setEditingQuestion({ ...q, tipo: 'OM' })}
                  />
                  <ListPreguntaAbierta
                    key={`abierta-${shouldRefresh}`}
                    activityId={actividadIdNumber}
                    shouldRefresh={shouldRefresh}
                  />
                </>
              )}
            </>
          ) : (
            actividad.type.id === 4 &&
            actividadIdNumber !== null && (
              <>
                <CalificarPreguntas activityId={actividadIdNumber} />
                <PreguntasAbiertas2
                  activityId={actividadIdNumber}
                  onSubmit={handleFormSubmit}
                  isUploading={false}
                />
                <ListPreguntaAbierta2 activityId={actividadIdNumber} />
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
