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
import { Badge } from '~/components/educators/ui/badge';
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
  const [color, setColor] = useState<string>('oklch(19% 0.0542 252.35)'); // Estado del color
  const [selectedActivityType, setSelectedActivityType] = useState<string>(''); // Estado del tipo de actividad seleccionado
  const [questions, setQuestions] = useState<string[]>([]); // Estado de las preguntas

  type TipoPregunta = 'OM' | 'FOV' | 'COMPLETADO' | 'ARCHIVO';

  type EditableQuestion = (
    | Question
    | VerdaderoOFlaso
    | Completado
    | QuestionFilesSubida
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

  // Guardar el color seleccionado en el localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
    if (savedColor) {
      setColor(savedColor);
    }
  }, [courseIdNumber]);

  useEffect(() => {
    if (actividad?.type.id === 1) {
      setQuestions(['ARCHIVO']);
    }
  }, [actividad]);

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

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="
                text-cyan-400 transition duration-300
                hover:text-cyan-200
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
                text-cyan-400 transition duration-300
                hover:text-cyan-200
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
                text-cyan-400 transition duration-300
                hover:text-cyan-200
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
                text-cyan-400 transition duration-300
                hover:text-cyan-200
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
              className="
                text-cyan-300 transition duration-300
                hover:text-white
              "
            >
              Creación de actividad
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="group relative h-auto w-full">
        <div
          className="
            absolute -inset-0.5 animate-gradient rounded-xl bg-gradient-to-r
            from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition
            duration-500
            group-hover:opacity-100
          "
        />

        <div
          className="
            relative mx-auto mt-2 flex w-full max-w-7xl flex-col rounded-2xl
            border border-cyan-500/20 bg-slate-800 p-4 text-white
            shadow-[0_0_20px_rgba(34,211,238,0.08)]
            sm:p-6
            lg:p-8
          "
        >
          <div className="mb-6 space-y-3">
            <h2
              className="
                bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-2xl
                font-bold text-transparent
                sm:text-3xl
                lg:text-4xl
              "
            >
              {actividad.name}
            </h2>
            <p
              className="
                text-sm font-medium text-white/70
                sm:text-base
                lg:text-lg
              "
            >
              Lección: {actividad.lesson?.title}
            </p>
          </div>

          <div
            className="
              my-6 grid grid-cols-1 gap-6
              lg:grid-cols-2
            "
          >
            <div
              className="
                space-y-4 text-sm
                sm:text-base
              "
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs tracking-wide text-cyan-300/70 uppercase">
                  Docente
                </span>
                <Badge
                  variant="outline"
                  className="
                    w-fit border-cyan-500/30 bg-cyan-950/30 font-medium
                    text-cyan-300
                    hover:bg-cyan-950/50
                  "
                >
                  {actividad.lesson?.courseInstructorName ??
                    actividad.lesson.courseInstructor}
                </Badge>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs tracking-wide text-cyan-300/70 uppercase">
                  Tipo de actividad
                </span>
                <p className="font-medium text-white/90">
                  {actividad.type?.name}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs tracking-wide text-cyan-300/70 uppercase">
                  Descripción
                </span>
                <p className="font-normal text-white/80">
                  {actividad.description}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs tracking-wide text-cyan-300/70 uppercase">
                  Calificable
                </span>
                <Badge
                  variant="outline"
                  className="
                    w-fit border-cyan-500/30 bg-cyan-950/30 text-cyan-300
                    hover:bg-cyan-950/50
                  "
                >
                  {actividad.revisada ? 'Sí' : 'No'}
                </Badge>
              </div>

              {actividad.fechaMaximaEntrega && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs tracking-wide text-cyan-300/70 uppercase">
                    Fecha de entrega
                  </span>
                  <p className="font-medium text-white/90">
                    {new Date(actividad.fechaMaximaEntrega).toLocaleString(
                      'es-ES',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </p>
                </div>
              )}
            </div>

            <div
              className="
                flex items-center justify-center
                lg:col-span-1
              "
            >
              <div
                className="
                  w-full max-w-xs
                  sm:max-w-sm
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
                  className="h-auto w-full rounded-lg object-cover shadow-lg"
                />
              </div>
            </div>
          </div>

          <div
            className="
              my-6 flex flex-col flex-wrap justify-center gap-3
              sm:flex-row
              lg:justify-start
            "
          >
            <Link
              href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}/actividades/${actividadIdNumber}/verActividad`}
              className="
                rounded-lg border border-cyan-500/30 bg-cyan-600 px-6 py-2
                text-center text-sm font-medium text-white transition-colors
                duration-200
                hover:bg-cyan-700
                sm:text-base
              "
            >
              Realizar Actividad
            </Link>

            <Link
              href={`/dashboard/super-admin/cursos/${courseIdNumber}/${lessonIdNumber}/actividades?activityId=${actividadIdNumber}`}
              className="
                rounded-lg border border-cyan-500/30 bg-cyan-600 px-6 py-2
                text-center text-sm font-medium text-white transition-colors
                duration-200
                hover:bg-cyan-700
                sm:text-base
              "
            >
              Editar Actividad
            </Link>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="
                    rounded-lg border border-red-600 bg-red-600 px-6 py-2
                    text-sm font-medium text-white transition-colors
                    duration-200
                    hover:bg-white hover:text-red-600
                    sm:text-base
                  "
                >
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará
                    permanentemente la actividad
                    <span className="font-bold"> {actividad?.name}</span> y
                    todos los datos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAct}
                    className="
                      rounded-lg border border-red-600 bg-red-600 font-medium
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

          {/* Zona de actividades, renderiza la creacion de la actividad segun su tipo "las cuales estan en la database" */}
          {actividad?.type.id === 1 ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl bg-slate-900 shadow-md">
                <div className="space-y-4">
                  {actividadIdNumber !== null && (
                    <>
                      <div
                        className="
                          overflow-hidden rounded-2xl border border-cyan-500/20
                        "
                      >
                        <div
                          className="
                            rounded-t-2xl bg-gradient-to-r from-slate-800
                            to-cyan-950/30 p-4
                            sm:p-6
                          "
                        >
                          <h2
                            className="
                              bg-gradient-to-r from-cyan-300 to-white
                              bg-clip-text text-lg font-semibold
                              text-transparent
                              sm:text-xl
                            "
                          >
                            Gestión de Archivos y Calificaciones
                          </h2>
                          <p
                            className="
                              mt-1 text-xs text-white/60
                              sm:text-sm
                            "
                          >
                            Administra los archivos subidos y asigna
                            calificaciones
                          </p>
                        </div>
                        <VerRespuestasArchivos
                          activityId={actividadIdNumber.toString()}
                        />
                      </div>
                      {questions.includes('ARCHIVO') && (
                        <FormActCompletado
                          activityId={actividadIdNumber}
                          onSubmit={handleFormSubmit}
                          onCancel={handleCancel}
                        />
                      )}

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
                          rounded-2xl border border-cyan-500/20 bg-slate-800 p-6
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
                selectedColor={color}
                onSelectChange={setSelectedActivityType}
              />
              <div
                className="
                  mt-4 rounded-2xl border border-cyan-500/20 bg-slate-900 p-4
                  text-sm text-white
                  sm:p-6 sm:text-base
                "
              >
                <p className="mb-3 font-semibold text-cyan-300">
                  Distribución de preguntas:
                </p>
                <div
                  className="
                    space-y-2 text-xs
                    sm:text-sm
                  "
                >
                  <div className="flex items-center justify-between">
                    <span>Opción Múltiple</span>
                    <span className="font-medium">
                      {resumenPorTipo.opcionMultiple}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Verdadero/Falso</span>
                    <span className="font-medium">
                      {resumenPorTipo.verdaderoFalso}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completar</span>
                    <span className="font-medium">
                      {resumenPorTipo.completar}%
                    </span>
                  </div>
                  <div
                    className="
                      mt-2 flex items-center justify-between border-t
                      border-current/20 pt-2 font-semibold
                    "
                  >
                    <span>Total usado</span>
                    <span>{porcentajeUsado}%</span>
                  </div>
                  <div
                    className="
                      flex items-center justify-between text-xs opacity-80
                      sm:text-sm
                    "
                  >
                    <span>Disponible</span>
                    <span>{porcentajeDisponible}%</span>
                  </div>
                </div>
              </div>

              {selectedActivityType && (
                <Button
                  className="
                    mx-auto mt-4 block border border-cyan-500/30 bg-transparent
                    px-6 py-2 text-sm font-medium text-cyan-300
                    hover:bg-cyan-950/40
                    sm:text-base
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
    </>
  );
};

export default Page;
