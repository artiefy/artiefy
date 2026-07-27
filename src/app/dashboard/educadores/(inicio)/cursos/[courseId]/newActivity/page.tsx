'use client';
import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; // Cambiar la importación de useRouter

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import QuestionSubidaList from '~/components/educators/layout/ListActSubidaFile';
import SelectParametro from '~/components/educators/layout/SelectParametro';
import TypeActDropdown from '~/components/educators/layout/TypesActDropdown';
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
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';

import type { Course } from '~/types';

// Crear actividad

// Función para obtener el contraste de un color
const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
};
interface ActivityDetailsAPI {
  id: number;
  name: string;
  description: string;
  type: { id: number; name: string; description: string } | null;
  typeid?: number; // <-- si a veces viene así
  revisada: boolean;
  pesoNota?: number | null; // <-- hazlo opcional si a veces no viene
  nota?: number | null; // <-- idem
  parametroId?: number | null;
  fechaMaximaEntrega?: string | null;
}

// Definir la interfaz de los parámetros
interface Parametros {
  id: number;
  name: string;
  description: string;
  entrega: number;
  porcentaje: number;
  courseId: number;
  typeid: number;
  isUsed?: boolean;
  numberOfActivities?: number;
}

interface LessonsResponse {
  lessons: { id: number; title: string; description?: string }[];
}

const Page: React.FC = () => {
  const { user } = useUser(); // Usar useUser de Clerk
  const params = useParams(); // Usar useParams de next/navigation
  const courseIdUrl = Array.isArray(params?.courseId)
    ? params.courseId[0]
    : params?.courseId;

  const lessonIdUrl = Array.isArray(params?.lessonId)
    ? params.lessonId[0]
    : params?.lessonId;

  const cursoIdUrl = params?.courseId; // Obtener el ID del curso de los parámetros
  const searchParams = useSearchParams(); // Usar useSearchParams de next/navigation
  const lessonsId = searchParams?.get('lessonId'); // Obtener el ID de la lección de los parámetros
  const [isUploading, setIsUploading] = useState(false); // Definir isUploading
  const [uploadProgress, setUploadProgress] = useState(0); // Definir uploadProgress
  const [course, setCourse] = useState<Course | null>(null); // Definir course
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    description: '',
    type: '',
    porcentaje: 0,
    revisada: false,
    parametro: 0,
    fechaMaximaEntrega: null as string | null,
  }); // Definir formData
  const cursoIdString = Array.isArray(cursoIdUrl) ? cursoIdUrl[0] : cursoIdUrl; // Obtener el ID del curso como string
  const courseIdNumber = courseIdUrl ? parseInt(courseIdUrl, 10) : null;
  const lessonIdNumber = lessonIdUrl ? parseInt(lessonIdUrl, 10) : null;
  const router = useRouter(); // Usar useRouter de next/navigation

  const [color, setColor] = useState<string>('#01142B');
  const [isActive, setIsActive] = useState(false);
  const [showLongevidadForm, setShowLongevidadForm] = useState(false);
  const [fechaMaxima, setFechaMaxima] = useState(false); // Definir fechaMaxima
  const [parametros, setParametros] = useState<Parametros[]>([]); // Definir setParametros
  const [porcentajeDisponible, setPorcentajeDisponible] = useState<
    number | null
  >(null);
  void parametros; // Evitar el warning de ESLint por no usar setParametros
  void cursoIdString; // Evitar el warning de ESLint por no usar cursoIdString
  const activityId = searchParams ? searchParams.get('activityId') : null; // o params.activityId
  const isEditing = activityId !== null;

  const [loadingActivity, setLoadingActivity] = useState(isEditing);

  const [lessons, setLessons] = useState<{ id: number; title: string }[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
    lessonIdNumber ?? null
  );

  // Subida de documento: una vez creada la actividad base, se muestra de una
  // el formulario para subir el archivo en esta misma página (sin redirigir).
  // Se guarda también en la URL para sobrevivir al reload que hace
  // FormActCompletado al guardar cada archivo, permitiendo subir más de uno.
  const [uploadActivityId, setUploadActivityId] = useState<number | null>(null);
  const [uploadLessonId, setUploadLessonId] = useState<number | null>(null);

  // Subida de documento: campos visibles de una al elegir el tipo, para
  // adjuntar el primer documento en el mismo paso de creación.
  const [docPregunta, setDocPregunta] = useState('');
  const [docCriterios, setDocCriterios] = useState('');
  const [docArchivo, setDocArchivo] = useState<File | null>(null);
  const [docImagen, setDocImagen] = useState<File | null>(null);

  const uploadFileToS3 = async (file: File): Promise<string> => {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: file.type,
        fileSize: file.size,
        fileName: file.name,
      }),
    });
    if (!res.ok) throw new Error('Error al generar la URL de subida');
    const { url, fields, key } = (await res.json()) as {
      url: string;
      fields: Record<string, string>;
      key: string;
    };
    const uploadForm = new FormData();
    Object.entries(fields).forEach(([k, v]) => uploadForm.append(k, v));
    uploadForm.append('file', file);
    const uploadRes = await fetch(url, { method: 'POST', body: uploadForm });
    if (!uploadRes.ok) throw new Error('Error al subir archivo');
    return key;
  };

  useEffect(() => {
    const idParam = searchParams?.get('uploadingActivityId');
    const lessonParam = searchParams?.get('uploadingLessonId');
    if (idParam) setUploadActivityId(parseInt(idParam, 10));
    if (lessonParam) setUploadLessonId(parseInt(lessonParam, 10));
  }, [searchParams]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch(
          `/api/super-admin/courses/lessonsCourse?courseId=${courseIdNumber}`
        );
        const data = (await res.json()) as LessonsResponse;
        setLessons(Array.isArray(data.lessons) ? data.lessons : []);
      } catch (err) {
        console.error('❌ Error al cargar clases:', err);
        setLessons([]); // fallback seguro
        toast('Error', { description: 'No se pudieron cargar las clases' });
      }
    };
    if (courseIdNumber) fetchLessons();
  }, [courseIdNumber]);

  useEffect(() => {
    console.log('🔍 Entró al useEffect de cargar actividad');
    console.log(' - isEditing:', isEditing);
    console.log(' - activityId:', activityId);

    if (!isEditing || !activityId) {
      console.log('✅ Es una creación nueva, no carga datos previos');
      return;
    }

    console.log('🚀 Iniciando carga de datos para edición');
    setLoadingActivity(true);

    fetch(`/api/educadores/actividades/${activityId}`)
      .then((res): Promise<ActivityDetailsAPI> => {
        console.log(
          `▶ Respuesta del servidor: ${res.status} ${res.statusText}`
        );
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: ActivityDetailsAPI) => {
        console.log('✅ Datos recibidos de la actividad:', data);
        console.log(
          '   parametroId:',
          data.parametroId,
          '| pesoNota:',
          data.pesoNota,
          '| revisada:',
          data.revisada,
          '| fechaMaximaEntrega:',
          data.fechaMaximaEntrega
        );

        const tipoId = data.type?.id ?? data.typeid;
        const pesoValor = Number(data.pesoNota ?? data.nota ?? 0);
        const parametroId = data.parametroId ?? 0;

        setFormData({
          id: data.id,
          name: data.name,
          description: data.description,
          type: String(tipoId),
          porcentaje: pesoValor,
          revisada: data.revisada,
          parametro: parametroId,
          fechaMaximaEntrega: data.fechaMaximaEntrega ?? null,
        });

        console.log('⏩ Estado tras setFormData:');
        console.log({
          id: data.id,
          name: data.name,
          description: data.description,
          type: String(tipoId),
          porcentaje: pesoValor,
          revisada: data.revisada,
          parametro: parametroId,
          fechaMaximaEntrega: data.fechaMaximaEntrega ?? null,
        });

        if (data.revisada || parametroId > 0) {
          console.log(
            '⚙️ Actividad revisada o con parámetro, activando toggle'
          );
          setIsActive(true);
          setShowLongevidadForm(true);
        } else {
          console.log(
            '🛑 Actividad NO revisada ni con parámetro, desactivando toggle'
          );
          setIsActive(false);
          setShowLongevidadForm(false);
        }

        setFechaMaxima(!!data.fechaMaximaEntrega);
        console.log('📅 Fecha máxima toggle:', !!data.fechaMaximaEntrega);

        if (parametroId > 0) {
          setPorcentajeDisponible(100 - pesoValor);
          console.log('📊 Porcentaje disponible calculado:', 100 - pesoValor);
        }
      })
      .catch((err: unknown) => {
        console.error('❌ Error al cargar la actividad:', err);
        const message =
          err instanceof Error ? err.message : 'Error desconocido';
        toast('Error', { description: `No se pudo cargar: ${message}` });
      })
      .finally(() => {
        console.log('🏁 Finalizó proceso de carga del activity');
        setLoadingActivity(false);
      });
  }, [isEditing, activityId]);

  // Obtener los parámetros
  useEffect(() => {
    const fetchParametros = async () => {
      try {
        // Obtener parámetros
        const parametrosResponse = await fetch(
          `/api/educadores/parametros?courseId=${courseIdNumber}`
        );
        if (!parametrosResponse.ok) {
          throw new Error('Error al obtener los parámetros');
        }
        const parametrosData =
          (await parametrosResponse.json()) as Parametros[];

        // Obtener actividades para verificar parámetros en uso
        const actividadesResponse = await fetch(
          `/api/educadores/actividades?courseId=${courseIdNumber}`
        );
        if (!actividadesResponse.ok) {
          throw new Error('Error al obtener las actividades');
        }
        const actividadesData = (await actividadesResponse.json()) as {
          parametroId: number;
        }[];

        // Obtener los IDs de parámetros que ya están siendo usados
        const parametrosUsados = actividadesData
          .filter((actividad: { parametroId: number }) => actividad.parametroId)
          .map((actividad: { parametroId: number }) => actividad.parametroId);

        // Actualizar los parámetros marcando cuáles están en uso
        const parametrosActualizados = parametrosData.map((parametro) => ({
          ...parametro,
          isUsed: parametrosUsados.includes(parametro.id),
          entrega: parametro.entrega,
          porcentaje: parametro.porcentaje,
          description: parametro.description,
          numberOfActivities: parametro.numberOfActivities, // ← PRESERVAR ESTE CAMPO
        }));

        setParametros(parametrosActualizados);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('❌ Error al cargar los parámetros:', error);
          toast('Error', { description: error.message });
        } else {
          console.error('❌ Error al cargar los parámetros (no Error):', error);
          toast('Error', { description: 'Error al cargar los parámetros' });
        }
      }
    };

    if (courseIdNumber) {
      void fetchParametros();
    }
  }, [courseIdNumber]);

  // Obtener el color guardado
  useEffect(() => {
    if (!lessonsId || !courseIdNumber) {
      return;
    }
    const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
    if (savedColor) {
      setColor(savedColor);
    }
  }, [lessonsId, courseIdNumber]);

  // Guardar el color seleccionado y actualizar el color
  useEffect(() => {
    const fetchCourse = async () => {
      if (!user) return;
      if (courseIdNumber !== null) {
        try {
          const response = await fetch(
            `/api/educadores/courses/${courseIdNumber}`
          );

          if (response.ok) {
            const data = (await response.json()) as Course;
            setCourse(data);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          toast('Error', {
            description: `No se pudo cargar el curso: ${errorMessage}`,
          });
        }
      }
    };
    void fetchCourse();
  }, [user, courseIdNumber]);
  useEffect(() => {
    if (!isEditing && searchParams) {
      const parametroIdFromUrl = searchParams.get('parametroId');
      if (parametroIdFromUrl) {
        const idNumber = parseInt(parametroIdFromUrl, 10);
        console.log('🚀 Nueva actividad con parametroId desde URL:', idNumber);

        setIsActive(true);
        setShowLongevidadForm(true);

        setFormData((prev) => ({
          ...prev,
          revisada: true,
          parametro: idNumber,
        }));

        // Fetch porcentaje disponible para ese parametro
        fetch('/api/educadores/actividades/actividadesByLesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parametroId: idNumber, porcentaje: 0 }),
        })
          .then((res) => res.json())
          .then((data: { totalActual: number; disponible: number }) => {
            console.log('📊 % disponible para parametro:', data);
            setPorcentajeDisponible(data.disponible);
            toast('Porcentaje disponible', {
              description: `Ya usado: ${data.totalActual}%, Disponible: ${data.disponible}%`,
            });
          })
          .catch((err) => {
            console.error('❌ Error al obtener %:', err);
            toast('Error', {
              description: 'No se pudo obtener el porcentaje disponible',
            });
          });
      }
    }
  }, [isEditing, searchParams]);

  // Función para manejar el cambio de color y guardarlo
  const handleToggle = () => {
    setIsActive((prevIsActive) => {
      const newIsActive = !prevIsActive;
      setFormData((prevFormData) => ({
        ...prevFormData,
        revisada: newIsActive,
        ...(!newIsActive && {
          name: '',
          description: '',
          porcentaje: 0,
          parametro: 0,
        }),
      }));

      if (!newIsActive) {
        setShowLongevidadForm(false);
      }
      return newIsActive;
    });
  };

  // Función para manejar el cambio de la fecha máxima de entrega
  const handleToggleFechaMaxima = () => {
    setFechaMaxima((prevFechaMaxima) => !prevFechaMaxima);
    setFormData((prevFormData) => ({
      ...prevFormData,
      fechaMaximaEntrega: fechaMaxima ? new Date().toISOString() : null,
    }));
  };

  // Función para manejar el click en el botón de asignar parámetro
  const handleLongevidadClick = () => {
    setShowLongevidadForm(true);
  };

  // Función para validar el porcentaje de la actividad
  const validarPorcentaje = async (
    parametroId: number,
    nuevoPorcentaje: number
  ) => {
    try {
      const response = await fetch(
        '/api/educadores/actividades/actividadesByLesson',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parametroId,
            porcentaje: nuevoPorcentaje,
            actividadId: Number(activityId), // ↪️ agrega esto
          }),
        }
      );

      const data = (await response.json()) as {
        totalActual: number;
        disponible: number;
        detalles?: { name: string; porcentaje: number }[];
      };

      if (!response.ok) {
        toast.error('Error de porcentaje', {
          description: 'Error desconocido',
        });
        return false;
      }

      // Mostrar información detallada
      toast('Información del parámetro', {
        description: `
            Porcentaje total actual: ${data.totalActual}%
            Porcentaje disponible: ${data.disponible}%
            ${data.detalles?.length ? '\nActividades asignadas:' : ''}
            ${data.detalles?.map((act) => `\n- ${act.name}: ${act.porcentaje}%`).join('') ?? ''}
          `,
      });

      return nuevoPorcentaje <= data.disponible;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error al validar porcentaje:', error);
        toast('Error', { description: error.message });
      } else {
        console.error('❌ Error al validar porcentaje (no Error):', error);
        toast('Error', { description: 'Error al validar el porcentaje' });
      }
      return false;
    }
  };

  // Función para manejar el cambio del porcentaje
  const handlePorcentajeChange = (value: string) => {
    const nuevoPorcentaje = parseFloat(value) || 0;

    // Primero actualizamos el estado sin validar
    setFormData({
      ...formData,
      porcentaje: nuevoPorcentaje,
    });
  };

  const handleParametroChange = async (parametroId: number) => {
    setFormData((prev) => ({
      ...prev,
      parametro: parametroId,
      porcentaje: 0,
    }));

    // Fetch de porcentaje disponible
    const response = await fetch(
      '/api/educadores/actividades/actividadesByLesson',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parametroId, porcentaje: 0 }),
      }
    );

    if (!response.ok) return;

    const data = (await response.json()) as {
      totalActual: number;
      disponible: number;
    };

    setPorcentajeDisponible(data.disponible);

    // Opcional: Toast informativo
    toast('Porcentaje disponible', {
      description: `Ya usado: ${data.totalActual}%, Disponible: ${data.disponible}%`,
    });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones específicas con mensajes de error
    if (!formData.name) {
      toast('Error', {
        description: 'El nombre de la actividad es requerido',
      });
      return;
    }

    if (!formData.description) {
      toast('Error', {
        description: 'La descripción de la actividad es requerida',
      });
      return;
    }

    if (!formData.type) {
      toast('Error', {
        description: 'Debe seleccionar un tipo de actividad',
      });
      return;
    }

    // Validaciones específicas para actividades revisadas
    if (formData.revisada) {
      if (
        formData.parametro &&
        (!formData.porcentaje || formData.porcentaje <= 0)
      ) {
        toast('Error', {
          description:
            'Debe asignar un porcentaje mayor a 0 para actividades revisadas con parámetro',
        });
        return;
      }
    }

    // Validaciones finales
    const newErrors = {
      name: !formData.name,
      description: !formData.description,
      type: !formData.type,
      parametro: false,
      porcentaje: !!(
        formData.revisada &&
        formData.parametro &&
        (!formData.porcentaje || formData.porcentaje <= 0)
      ),
    };

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    // Validación final del porcentaje antes de crear la actividad
    if (formData.revisada && formData.parametro) {
      const porcentajeValido = await validarPorcentaje(
        formData.parametro,
        formData.porcentaje || 0
      );

      if (!porcentajeValido) {
        toast('Error', {
          description: 'El porcentaje asignado excede el disponible',
        });
        return;
      }
    }

    setIsUploading(true);

    try {
      // Asegurarnos de que el porcentaje sea un número
      const porcentaje = formData.revisada ? formData.porcentaje || 0 : 0;
      void porcentaje;
      const endpoint = isEditing
        ? `/api/educadores/actividades/${activityId}`
        : '/api/educadores/actividades';

      const method = isEditing ? 'PUT' : 'POST';

      const actividadResponse = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          typeid: parseInt(formData.type, 10),
          lessonsId: selectedLessonId ?? 0,
          courseId: courseIdNumber ?? 0,
          revisada: formData.revisada,
          parametroId: formData.parametro || null,
          porcentaje: formData.revisada ? formData.porcentaje || 0 : 0,
          fechaMaximaEntrega: formData.fechaMaximaEntrega
            ? new Date(formData.fechaMaximaEntrega).toISOString()
            : null,
        }),
      });

      if (!actividadResponse.ok) {
        const errorData = (await actividadResponse.json()) as {
          error?: string;
        };
        throw new Error(errorData.error ?? 'Error al crear la actividad');
      }

      const actividadData = (await actividadResponse.json()) as {
        id: number;
        lessonsId: number;
      };
      const actividadId = actividadData.id;
      const finalLessonId = actividadData.lessonsId || lessonIdNumber;

      // Mostrar mensaje de éxito
      toast('Éxito', {
        description: `Actividad ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      });

      // Subida de documento: si el educador ya llenó los campos del
      // documento (visibles de una al elegir el tipo), se suben junto con
      // la creación de la actividad, en el mismo clic de "Crear".
      if (!isEditing && formData.type === '1') {
        if (docPregunta || docCriterios || docArchivo || docImagen) {
          try {
            const archivoKey = docArchivo
              ? await uploadFileToS3(docArchivo)
              : '';
            const portadaKey = docImagen ? await uploadFileToS3(docImagen) : '';

            await fetch('/api/educadores/question/archivos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityId: actividadId,
                questionsFilesSubida: {
                  id: crypto.randomUUID(),
                  text: docPregunta,
                  parametros: docCriterios,
                  pesoPregunta: 0,
                  archivoKey,
                  portadaKey,
                },
              }),
            });
          } catch (err) {
            console.error('Error al subir el documento inicial:', err);
            toast('Error', {
              description:
                'La actividad se creó, pero hubo un error subiendo el documento.',
            });
          }
        }

        // Se queda en la misma pantalla, mostrando lo ya subido y la
        // opción de subir más de un archivo antes de finalizar.
        setUploadActivityId(actividadId);
        setUploadLessonId(finalLessonId);
        const params = new URLSearchParams(window.location.search);
        params.set('uploadingActivityId', String(actividadId));
        params.set('uploadingLessonId', String(finalLessonId));
        router.replace(`${window.location.pathname}?${params.toString()}`);
        return;
      }

      router.push(
        `/dashboard/educadores/cursos/${courseIdNumber}/${finalLessonId}/actividades/${actividadId}`
      );
    } catch (err: unknown) {
      console.error('Error detallado:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast('Error', { description: message });
    } finally {
      setIsUploading(false);
    }
  };

  // Barra de carga al crear la actividad
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10; // Incrementar de 10 en 10
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isUploading]);

  console.log('📚 Lessons:', lessons);
  console.log('🎯 selectedLessonId:', selectedLessonId);

  // Renderizar el formulario
  return (
    <>
      <Breadcrumb className="mt-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="
                text-primary
                hover:text-gray-300
              "
              href="/dashboard/educadores"
            >
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="
                text-primary
                hover:text-gray-300
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
                text-primary
                hover:text-gray-300
              "
              href={`/dashboard/educadores/cursos/${courseIdNumber}`}
            >
              Detalles curso
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={() => window.history.back()}
              className="
                text-primary
                hover:text-gray-300
              "
            >
              Lession
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="
                text-primary
                hover:text-gray-300
              "
            >
              Creación de actividad:
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
      <div
        className="
          group relative mx-auto h-auto w-full
          md:w-3/5
          lg:w-3/5
        "
      >
        <div
          className="
            absolute -inset-0.5 animate-gradient rounded-xl bg-gradient-to-r
            from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition
            duration-500
            group-hover:opacity-100
          "
        />
        <div className="relative mt-5 h-auto w-full justify-center">
          {loadingActivity ? (
            <main className="flex h-64 items-center justify-center">
              <div
                className="
                  size-32 animate-spin rounded-full border-y-2 border-primary
                "
              >
                <span className="sr-only">Cargando actividad…</span>
              </div>
            </main>
          ) : uploadActivityId ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#22C4D3]/40 bg-[#061c37] p-6 text-center shadow-2xl">
                <p className="text-lg font-semibold text-white">
                  Actividad creada. Ahora sube el documento.
                </p>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  Puedes subir más de un archivo antes de finalizar.
                </p>
              </div>

              <QuestionSubidaList activityId={uploadActivityId} />

              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    router.push(
                      `/dashboard/educadores/cursos/${courseIdNumber}/${uploadLessonId ?? lessonIdNumber}/actividades/${uploadActivityId}`
                    )
                  }
                  className="
                    rounded-lg border-none bg-[#22C4D3] px-6 py-2
                    font-semibold text-[#01142B]
                    hover:bg-[#00A5C0]
                  "
                >
                  Finalizar
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="mx-auto w-full justify-center rounded-lg bg-white p-4"
              onSubmit={handleSubmit}
              style={{ backgroundColor: color, color: getContrastYIQ(color) }}
            >
              <div className="mb-2 flex">
                <Image
                  src="/favicon.ico"
                  alt="Artiefy logo"
                  width={70}
                  height={70}
                />
                <h2
                  className="
                    mt-5 flex flex-col text-start text-3xl font-semibold
                  "
                >
                  {isEditing ? 'Editar actividad' : 'Creación de actividad'}
                  <p className="text-sm">Del curso: {course?.title}</p>
                </h2>
              </div>
              <div className="my-4">
                <Label
                  className={`
                    mb-2 text-xl
                    ${color === '#FFFFFF' ? 'text-black' : 'text-white'}
                  `}
                >
                  Clase / lección del curso
                </Label>
                <select
                  className="
                    w-full rounded-lg border border-gray-500 bg-[#01142B] p-2
                    text-white outline-none
                  "
                  value={selectedLessonId ?? ''}
                  onChange={(e) =>
                    setSelectedLessonId(parseInt(e.target.value, 10))
                  }
                >
                  <option value="" disabled>
                    Selecciona una clase
                  </option>
                  {(Array.isArray(lessons) ? lessons : []).map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="
                  grid grid-cols-1
                  lg:grid-cols-2
                "
              >
                {/* ───── Columna «Calificable» ───── */}
                <div className="flex flex-col">
                  <div className="flex flex-col">
                    <p>¿La actividad es calificable?:</p>
                    <div className="flex">
                      <label
                        htmlFor="toggle"
                        className="relative inline-block h-8 w-16"
                      >
                        <input
                          type="checkbox"
                          id="toggle"
                          checked={isActive}
                          onChange={handleToggle}
                          className="absolute size-0"
                        />
                        <span
                          className={`
                            size-1/2 cursor-pointer rounded-full transition-all
                            duration-300
                            ${isActive ? 'bg-gray-300' : 'bg-red-500'}
                          `}
                        >
                          <span
                            className={`
                              absolute top-1 left-1 size-6 rounded-full
                              bg-primary transition-all duration-300
                              ${isActive ? 'translate-x-8' : 'translate-x-0'}
                            `}
                          />
                        </span>
                      </label>
                      <span className="mt-1 text-sm text-gray-400">
                        {isActive ? 'Si' : 'No'}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <>
                      <div className="my-1">
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLongevidadClick();
                          }}
                          className="
                            border-none bg-blue-500 text-white
                            hover:bg-blue-500/90
                          "
                        >
                          Asignar un parámetro de evaluación
                        </Button>
                      </div>

                      {showLongevidadForm && (
                        <div className="my-4">
                          <SelectParametro
                            key={`param-${activityId ?? 'new'}`}
                            courseId={courseIdNumber}
                            parametro={formData.parametro ?? 0}
                            onParametroChange={handleParametroChange}
                            selectedColor={color}
                          />

                          <Label
                            htmlFor="porcentaje"
                            className={`
                              mb-2
                              ${
                                color === '#FFFFFF'
                                  ? 'text-black'
                                  : 'text-white'
                              }
                            `}
                          >
                            Peso actividad en el parámetro (0-100 %):
                          </Label>

                          <Input
                            value={formData.porcentaje}
                            className={`
                              rounded-lg border border-slate-200 bg-transparent
                              p-2 outline-none
                              ${
                                color === '#FFFFFF'
                                  ? 'text-black'
                                  : 'text-white'
                              }
                            `}
                            type="number"
                            id="percentage"
                            min="0"
                            max="100"
                            step="1"
                            onChange={(e) =>
                              handlePorcentajeChange(e.target.value)
                            }
                          />

                          {porcentajeDisponible !== null && (
                            <p
                              className={`
                                mt-1 text-sm
                                ${
                                  color === '#FFFFFF'
                                    ? 'text-black'
                                    : 'text-white'
                                }
                              `}
                            >
                              Porcentaje disponible:{' '}
                              <strong>{porcentajeDisponible}%</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* ───── Columna «Fecha de entrega» ───── */}
                <div className="flex flex-col">
                  <div className="flex flex-col">
                    <p>¿La actividad tiene fecha de entrega?</p>
                    <div className="flex space-x-2">
                      <label
                        htmlFor="toggleFechaMaxima"
                        className="relative inline-block h-8 w-16"
                      >
                        <input
                          type="checkbox"
                          id="toggleFechaMaxima"
                          checked={fechaMaxima}
                          onChange={handleToggleFechaMaxima}
                          className="absolute size-0"
                        />
                        <span
                          className={`
                            size-1/2 cursor-pointer rounded-full transition-all
                            duration-300
                            ${fechaMaxima ? 'bg-gray-300' : 'bg-red-500'}
                          `}
                        >
                          <span
                            className={`
                              absolute top-1 left-1 size-6 rounded-full
                              bg-primary transition-all duration-300
                              ${fechaMaxima ? 'translate-x-8' : 'translate-x-0'}
                            `}
                          />
                        </span>
                      </label>
                      <span className="mt-1 text-sm text-gray-400">
                        {fechaMaxima ? 'Si' : 'No'}
                      </span>
                    </div>
                  </div>

                  {fechaMaxima && (
                    <>
                      <span
                        className={`
                          text-xl font-medium
                          ${color === '#FFFFFF' ? 'text-black' : 'text-white'}
                        `}
                      >
                        Fecha máxima de entrega:
                      </span>
                      <input
                        type="datetime-local"
                        value={
                          formData.fechaMaximaEntrega
                            ? new Date(formData.fechaMaximaEntrega)
                                .toISOString()
                                .slice(0, 16)
                            : ''
                        }
                        className="
                          w-full rounded-lg border border-slate-200 bg-white p-2
                          text-black outline-none
                        "
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fechaMaximaEntrega: e.target.value,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              </div>

              {/* ─────  TÍTULO, DESCRIPCIÓN y SELECT de tipo ───── */}
              <Label
                className={`
                  mt-6 mb-2 text-xl
                  ${color === '#FFFFFF' ? 'text-black' : 'text-white'}
                `}
              >
                Título
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre de la actividad"
                className={`
                  border-slate-200
                  ${color === '#FFFFFF' ? 'text-black' : 'text-white'}
                `}
              />

              <div className="my-4 flex flex-col">
                <Label
                  className={`
                    mb-2 text-xl
                    ${color === '#FFFFFF' ? 'text-black' : 'text-white'}
                  `}
                >
                  Descripción actividad:
                </Label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`
                    rounded-lg border border-slate-200 bg-transparent p-2
                    outline-none
                    ${color === '#FFFFFF' ? 'text-black' : 'text-white'}
                  `}
                />
              </div>

              <Label
                className={`
                  mb-2 text-xl
                  ${color === '#FFFFFF' ? 'text-black' : 'text-white'}
                `}
              >
                Tipo de actividad
              </Label>
              <TypeActDropdown
                key={`tipo-${activityId ?? 'new'}`}
                typeActi={parseInt(formData.type, 10)}
                setTypeActividad={(t) =>
                  setFormData({ ...formData, type: t.toString() })
                }
                selectedColor={color}
              />

              {formData.type === '1' && !isEditing && (
                <div
                  className="
                    mt-6 space-y-6 rounded-2xl border border-[#22C4D3]/40
                    bg-[#01142B] p-6 shadow-2xl
                  "
                >
                  <h3
                    className="
                      bg-gradient-to-r from-[#22C4D3] to-[#00BDD8]
                      bg-clip-text text-center text-xl font-extrabold
                      tracking-tight text-transparent
                    "
                  >
                    Documento a subir
                  </h3>

                  <div className="space-y-2">
                    <label className="block font-bold text-[#22C4D3]">
                      Pregunta
                    </label>
                    <textarea
                      className="
                        w-full rounded-lg border border-[#1d283a]/40
                        bg-[#1e2939] p-3 text-white shadow-md outline-none
                        placeholder:text-[#00BDD8]
                        focus:border focus:border-[#22C4D3]
                        focus:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
                      "
                      placeholder="Digite aquí la descripción del trabajo"
                      value={docPregunta}
                      onChange={(e) => setDocPregunta(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-[#22C4D3]">
                      Criterios de evaluación
                    </label>
                    <textarea
                      className="
                        w-full rounded-lg border border-[#1d283a]/40
                        bg-[#1e2939] p-3 text-white shadow-md outline-none
                        placeholder:text-[#00BDD8]
                        focus:border focus:border-[#22C4D3]
                        focus:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
                      "
                      placeholder="Parámetros de evaluación"
                      value={docCriterios}
                      onChange={(e) => setDocCriterios(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-[#22C4D3]">
                      Archivo de ayuda
                    </label>
                    <div
                      className="
                        relative flex items-center justify-between
                        rounded-lg border border-[#1d283a]/40 bg-[#1e2939]
                        px-4 py-2 shadow transition-all duration-200
                        focus-within:border-[#22C4D3]
                        focus-within:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
                      "
                    >
                      <span className="truncate text-sm text-[#00BDD8]">
                        {docArchivo?.name ??
                          'Selecciona un archivo de ayuda (PDF, Word, video...)'}
                      </span>
                      <label
                        className="
                          cursor-pointer rounded-md bg-[#00BDD8] px-3 py-1
                          text-sm font-bold text-[#01142B] transition-all
                          duration-150
                          hover:bg-[#00A5C0]
                        "
                      >
                        Seleccionar
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,application/*"
                          onChange={(e) =>
                            setDocArchivo(e.target.files?.[0] ?? null)
                          }
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-[#22C4D3]">
                      Recurso complementario (imagen)
                    </label>
                    <div
                      className="
                        relative flex items-center justify-between
                        rounded-lg border border-[#1d283a]/40 bg-[#1e2939]
                        px-4 py-2 shadow transition-all duration-200
                        focus-within:border-[#22C4D3]
                        focus-within:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
                      "
                    >
                      <span className="truncate text-sm text-[#00BDD8]">
                        {docImagen?.name ??
                          'Selecciona una imagen complementaria'}
                      </span>
                      <label
                        className="
                          cursor-pointer rounded-md bg-[#22C4D3] px-3 py-1
                          text-sm font-bold text-[#01142B] transition-all
                          duration-150
                          hover:bg-[#00A5C0]
                        "
                      >
                        Seleccionar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setDocImagen(e.target.files?.[0] ?? null)
                          }
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="my-1">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="mt-2 text-center text-sm text-gray-500">
                    {uploadProgress}% Completado
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-evenly">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="
                        mx-auto w-1/6 border-red-600 bg-red-600 text-white
                        hover:border-red-600 hover:bg-white hover:text-red-600
                      "
                    >
                      Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción te devolverá a la página anterior
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="
                          border-red-600 bg-red-600 text-white
                          hover:border-red-700 hover:bg-transparent
                          hover:text-red-700
                        "
                        onClick={() => window.history.back()}
                      >
                        Volver
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Input
                  type="submit"
                  className="
                    w-1/2 cursor-pointer border-green-600 bg-green-600
                    text-white
                    hover:border-green-600 hover:bg-white hover:text-green-600
                  "
                  value={isEditing ? 'Actualizar' : 'Crear'}
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
