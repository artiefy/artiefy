'use client';
import { useEffect,useState } from 'react';

import Image from 'next/image';
import { useParams,useRouter, useSearchParams } from 'next/navigation'; // Cambiar la importación de useRouter

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

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

// Definir las interfaces de los datos
interface Course {
  id: number;
  title: string;
  description: string;
  categoryid: string;
  nivelid: string;
  modalidadesid: string;
  instructor: string;
  coverImageKey: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  totalParametros: number;
}

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

  const [color, setColor] = useState<string>('#FFFFFF'); // Definir color
  const [isActive, setIsActive] = useState(false); // Definir isActive
  const [fechaMaxima, setFechaMaxima] = useState(false); // Definir fechaMaxima
  const [showLongevidadForm, setShowLongevidadForm] = useState(false); // Definir showLongevidadForm
  const [parametros, setParametros] = useState<Parametros[]>([]); // Definir setParametros
  const [porcentajeDisponible, setPorcentajeDisponible] = useState<
    number | null
  >(null);
  void parametros; // Evitar el warning de ESLint por no usar setParametros
  void cursoIdString; // Evitar el warning de ESLint por no usar cursoIdString
  const activityId = searchParams ? searchParams.get('activityId') : null; // o params.activityId
  const isEditing = activityId !== null;

  const [loadingActivity, setLoadingActivity] = useState(isEditing);

  useEffect(() => {
    if (!isEditing || !activityId) return;
    setLoadingActivity(true);

    console.log(
      '▶ Iniciando carga de actividad. isEditing:',
      isEditing,
      'activityId:',
      activityId
    );

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
        // inspecciona en consola estos campos:
        console.log(
          '   parametroId:',
          data.parametroId,
          'pesoNota:',
          data.pesoNota
        );

        // extraemos los valores correctos
        const tipoId = data.type?.id ?? data.typeid;
        const pesoValor = Number(data.pesoNota ?? data.nota ?? 0);
        const parametroId = data.parametroId ?? 0;

        // seteamos el formulario
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

        // toggles y sección de parámetro
        setIsActive(data.revisada);
        setFechaMaxima(!!data.fechaMaximaEntrega);
        setShowLongevidadForm(data.revisada && parametroId > 0);

        // precargar % disponible (100 – peso asignado)
        if (parametroId > 0) {
          setPorcentajeDisponible(100 - pesoValor);
        }
      })
      .catch((err: unknown) => {
        console.error('❌ Error al cargar la actividad:', err);
        const message =
          err instanceof Error ? err.message : 'Error desconocido';
        toast('Error', { description: `No se pudo cargar: ${message}` });
      })
      .finally(() => {
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
          lessonsId: lessonsId ? parseInt(lessonsId, 10) : 0,
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

      const actividadData = (await actividadResponse.json()) as { id: number };
      const actividadId = actividadData.id;

      // Mostrar mensaje de éxito
      toast('Éxito', {
        description: `Actividad ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      });

      router.push(
        `/dashboard/super-admin/cursos/${courseIdNumber}/${lessonIdNumber}/actividades/${actividadId}`
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

  // Renderizar el formulario
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-primary hover:text-gray-300"
              href="/dashboard/super-admin"
            >
              Inicio
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
              href="#"
              onClick={() => window.history.back()}
              className="text-primary hover:text-gray-300"
            >
              Lession
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="text-primary hover:text-gray-300">
              Creación de actividad:
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
      <div className="group relative mx-auto h-auto w-full md:w-3/5 lg:w-3/5">
        <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
        <div className="relative mt-5 h-auto w-full justify-center">
          {loadingActivity ? (
            <main className="flex h-64 items-center justify-center">
              <div className="border-primary size-32 animate-spin rounded-full border-y-2">
                <span className="sr-only">Cargando actividad…</span>
              </div>
            </main>
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
                <h2 className="mt-5 flex flex-col text-start text-3xl font-semibold">
                  {isEditing ? 'Editar actividad' : 'Creación de actividad'}
                  <p className="text-sm">Del curso: {course?.title}</p>
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2">
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
                          className={`size-1/2 cursor-pointer rounded-full transition-all duration-300 ${
                            isActive ? 'bg-gray-300' : 'bg-red-500'
                          }`}
                        >
                          <span
                            className={`bg-primary absolute top-1 left-1 size-6 rounded-full transition-all duration-300 ${
                              isActive ? 'translate-x-8' : 'translate-x-0'
                            }`}
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
                          className="border-none bg-blue-500 text-white hover:bg-blue-500/90"
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
                            className={`mb-2 ${
                              color === '#FFFFFF' ? 'text-black' : 'text-white'
                            }`}
                          >
                            Peso actividad en el parámetro (0-100 %):
                          </Label>

                          <Input
                            value={formData.porcentaje}
                            className={`rounded-lg border border-slate-200 bg-transparent p-2 outline-none ${
                              color === '#FFFFFF' ? 'text-black' : 'text-white'
                            }`}
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
                              className={`mt-1 text-sm ${
                                color === '#FFFFFF'
                                  ? 'text-black'
                                  : 'text-white'
                              }`}
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
                          className={`size-1/2 cursor-pointer rounded-full transition-all duration-300 ${
                            fechaMaxima ? 'bg-gray-300' : 'bg-red-500'
                          }`}
                        >
                          <span
                            className={`bg-primary absolute top-1 left-1 size-6 rounded-full transition-all duration-300 ${
                              fechaMaxima ? 'translate-x-8' : 'translate-x-0'
                            }`}
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
                        className={`text-xl font-medium ${
                          color === '#FFFFFF' ? 'text-black' : 'text-white'
                        }`}
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
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-black outline-none"
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
                className={`mt-6 mb-2 text-xl ${
                  color === '#FFFFFF' ? 'text-black' : 'text-white'
                }`}
              >
                Título
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre de la actividad"
                className={`border-slate-200 ${
                  color === '#FFFFFF' ? 'text-black' : 'text-white'
                }`}
              />

              <div className="my-4 flex flex-col">
                <Label
                  className={`mb-2 text-xl ${
                    color === '#FFFFFF' ? 'text-black' : 'text-white'
                  }`}
                >
                  Descripción actividad:
                </Label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`rounded-lg border border-slate-200 bg-transparent p-2 outline-none ${
                    color === '#FFFFFF' ? 'text-black' : 'text-white'
                  }`}
                />
              </div>

              <Label
                className={`mb-2 text-xl ${
                  color === '#FFFFFF' ? 'text-black' : 'text-white'
                }`}
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
                    <Button className="mx-auto w-1/6 border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
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
                        className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
                        onClick={() => window.history.back()}
                      >
                        Volver
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Input
                  type="submit"
                  className="w-1/2 cursor-pointer border-green-600 bg-green-600 text-white hover:border-green-600 hover:bg-white hover:text-green-600"
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
