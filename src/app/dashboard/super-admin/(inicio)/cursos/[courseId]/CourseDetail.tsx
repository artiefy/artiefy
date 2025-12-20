'use client';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { Portal } from '@radix-ui/react-portal';
import { toast } from 'sonner';

import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import DashboardEstudiantes from '~/components/educators/layout/DashboardEstudiantes';
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
import TechLoader from '~/components/estudiantes/ui/tech-loader';
import LessonsListEducator from '~/components/super-admin/layout/LessonsListEducator'; // Importar el componente
import { ScheduledMeetingsList } from '~/components/super-admin/layout/ScheduledMeetingsList';
import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';
import {
  ModalScheduleMeeting,
  ScheduledMeeting,
} from '~/components/super-admin/modals/ModalScheduleMeeting';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';

// Definir la interfaz del curso
interface Course {
  id: number;
  title: string;
  description: string;
  categoryid: string;
  categoryName?: string;
  nivelid: string; // Replaced  with nivelid
  nivelName?: string;
  modalidadesid: string;
  modalidadesName?: string;
  instructor: string;
  coverImageKey: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
  courseTypeId?: number | null; // ✅ Agrega esto
  courseTypeName?: string;
  isActive: boolean;
  instructorName: string;
  coverVideoCourseKey?: string;
  individualPrice?: number | null;
  courseTypes?: { id: number; name: string }[]; // <== añades esto
  meetings?: ScheduledMeeting[];
  horario?: number | null;
  espacios?: number | null;
  certificationTypeId?: number | null;
  certificationTypeName?: string;
  scheduleOptionId?: number | null;
  scheduleOptionName?: string;
  spaceOptionId?: number | null;
  spaceOptionName?: string;
}
interface Materia {
  id: number;
  title: string;
}

interface VideoData {
  videos?: unknown[];
}

interface SyncResponse {
  error?: string;
  hasMore?: boolean;
}

// Definir la interfaz de las propiedades del componente
interface CourseDetailProps {
  courseId: number;
}

// Definir la interfaz de los parámetros
export interface Parametros {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  courseId: number;
}

type UIMeeting = ScheduledMeeting & {
  id: number;
  meetingId: string;
  joinUrl?: string;
  recordingContentUrl?: string;
  videoUrl?: string;
  video_key?: string;
  video_key_2?: string; // ✅ nuevo
  videoUrl2?: string; // ✅ nuevo opcional
};

// Add these interfaces after the existing interfaces
interface Educator {
  id: string;
  name: string;
  email?: string;
}
// Función para obtener el contraste de un color
const _getContrastYIQ = (hexcolor: string) => {
  if (hexcolor === '#FFFFFF') return 'black'; // Manejar el caso del color blanco
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
};

// Add this CSS block at the top of the file after imports:
const styles = `
    .svg-frame {
      position: relative;
      width: 300px;
      height: 300px;
      transform-style: preserve-3d;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .svg-frame svg {
      position: absolute;
      transition: .5s;
      z-index: calc(1 - (0.2 * var(--j)));
      transform-origin: center;
      width: 344px;
      height: 344px;
      fill: none;
    }

    .svg-frame:hover svg {
      transform: rotate(-80deg) skew(30deg) translateX(calc(45px * var(--i))) translateY(calc(-35px * var(--i)));
    }

    #out2 {
      animation: rotate16 7s ease-in-out infinite alternate;
      transform-origin: center;
    }

    #out3 {
      animation: rotate16 3s ease-in-out infinite alternate;
      transform-origin: center;
      stroke: #ff0;
    }

    @keyframes rotate16 {
      to {
      transform: rotate(360deg);
      }
    }

    @keyframes slideInFromLeft {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInFromBottom {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-in {
      animation: fadeIn 0.5s ease-out forwards;
    }

    .slide-in-from-left-4 {
      animation: slideInFromLeft 0.5s ease-out forwards;
    }

    .slide-in-from-right-4 {
      animation: slideInFromRight 0.5s ease-out forwards;
    }

    .slide-in-from-left-8 {
      animation: slideInFromLeft 0.7s ease-out forwards;
    }

    .slide-in-from-right-8 {
      animation: slideInFromRight 0.7s ease-out forwards;
    }

    .slide-in-from-bottom-8 {
      animation: slideInFromBottom 0.7s ease-out forwards;
    }

    .delay-150 {
      animation-delay: 150ms;
    }

    .duration-500 {
      animation-duration: 500ms;
    }

    .duration-700 {
      animation-duration: 700ms;
    }
    `;

// Replace the stylesheet append code
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Replace the FullscreenLoader component with:
const FullscreenLoader = () => {
  return (
    <Portal>
      <div className="bg-background/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <TechLoader />
      </div>
    </Portal>
  );
};

interface VideoIdxItem {
  meetingId: string;
  videoKey: string;
  videoUrl: string;
  createdAt?: string;
  isSecondary?: boolean;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isVideoIdxItem(v: unknown): v is VideoIdxItem {
  if (!isRecord(v)) return false;
  return (
    typeof v.meetingId === 'string' &&
    typeof v.videoKey === 'string' &&
    typeof v.videoUrl === 'string' &&
    (typeof v.createdAt === 'string' || typeof v.createdAt === 'undefined')
  );
}

const CourseDetail: React.FC<CourseDetailProps> = () => {
  const router = useRouter(); // Obtener el router
  const params = useParams(); // Obtener los parámetros
  const courseIdUrl = params?.courseId; // Obtener el id del curso desde params
  const [course, setCourse] = useState<Course | null>(null); // Nuevo estado para el curso
  const [parametros, setParametros] = useState<Parametros[]>([]); // Nuevo estado para los parámetros
  const [isModalOpen, setIsModalOpen] = useState(false); // Nuevo estado para el modal de edición
  const [editTitle, setEditTitle] = useState(''); // Nuevo estado para el título del curso a editar
  const [editDescription, setEditDescription] = useState(''); // Nuevo estado para la descripción del curso
  const [editCategory, setEditCategory] = useState(0); // Nuevo estado para la categoría del curso
  const [editModalidad, setEditModalidad] = useState(0); // Nuevo estado para la modalidad del curso
  const [editNivel, setEditNivel] = useState(0); // Replaced  with editNivel
  const [editCoverImageKey, setEditCoverImageKey] = useState(''); // Nuevo estado para la imagen del curso
  const [loading, setLoading] = useState(true); // Nuevo estado para el estado de carga de la página
  const [error, setError] = useState<string | null>(null); // Nuevo estado para los errores
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF'); // Color predeterminado blanco
  const predefinedColors = ['#1f2937', '#000000', '#FFFFFF']; // Colores específicos
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [courseTypeId, setCourseTypeId] = useState<number[]>([]);
  const [editCoverVideoCourseKey, setEditCoverVideoCourseKey] = useState<
    string | null
  >(null);
  const [individualPrice, setIndividualPrice] = useState<number | null>(null);

  const BADGE_GRADIENTS = [
    'from-pink-500 via-red-500 to-yellow-500',
    'from-green-300 via-blue-500 to-purple-600',
    'from-pink-300 via-purple-300 to-indigo-400',
    'from-yellow-400 via-pink-500 to-red-500',
    'from-blue-400 via-indigo-500 to-purple-600',
    'from-green-400 via-cyan-500 to-blue-500',
    'from-orange-400 via-pink-500 to-red-500',
  ];

  type BadgeGradientFunction = () => string;

  const _getBadgeGradient: BadgeGradientFunction = () => {
    return BADGE_GRADIENTS[Math.floor(Math.random() * BADGE_GRADIENTS.length)];
  };

  const [isActive, setIsActive] = useState<boolean>(true);

  // Estados para los tabs desplegables
  const [activeTab, setActiveTab] = useState<string>('curso');
  const [_expandedSections, _setExpandedSections] = useState<{
    curso: boolean;
    grabadas: boolean;
    proyectos: boolean;
    recursos: boolean;
    actividades: boolean;
  }>({
    curso: true,
    grabadas: false,
    proyectos: false,
    recursos: false,
    actividades: false,
  });

  const [editParametros, setEditParametros] = useState<
    {
      id: number;
      name: string;
      description: string;
      porcentaje: number;
    }[]
  >([]); // Nuevo estado para los parámetros
  const [editRating, setEditRating] = useState(0); // Añadir esta línea

  const courseIdString = Array.isArray(courseIdUrl)
    ? courseIdUrl[0]
    : courseIdUrl; // Obtener el id del curso como string
  const courseIdString2 = courseIdString ?? ''; // Verificar si el id del curso es nulo
  const courseIdNumber = parseInt(courseIdString2); // Convertir el id del curso a número

  // Add these new states after the existing states
  const [educators, setEducators] = useState<Educator[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentInstructor, setCurrentInstructor] = useState('');

  // Agregar este nuevo estado
  const [currentSubjects, setCurrentSubjects] = useState<{ id: number }[]>([]);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isSyncingVideos, setIsSyncingVideos] = useState(false);
  const [_videos, setVideos] = useState<unknown[]>([]);
  const [editHorario, setEditHorario] = useState<number | null>(null);
  const [editEspacios, setEditEspacios] = useState<number | null>(null);
  const [_scheduleOptionName, setScheduleOptionName] = useState<string | null>(
    null
  );
  const [_spaceOptionName, setSpaceOptionName] = useState<string | null>(null);
  const [certificationTypeName, setCertificationTypeName] = useState<
    string | null
  >(null);

  // Estado para el scroll y la tarjeta mini sticky
  const [showStickyCard, setShowStickyCard] = useState(false);

  // 🔑 ID del organizador principal en Azure AD (Graph)
  const MAIN_AAD_USER_ID = '0843f2fa-3e0b-493f-8bb9-84b0aa1b2417';

  async function fetchVideosList(aadUserId: string = MAIN_AAD_USER_ID) {
    if (!aadUserId) return;

    const res = await fetch(
      `/api/super-admin/teams/video?userId=${aadUserId}`,
      {
        cache: 'no-store',
      }
    );

    const data = (await res.json()) as VideoData;
    const videoList = Array.isArray(data.videos) ? data.videos : [];
    setVideos(videoList);
  }

  async function handleSyncVideos(aadUserId: string = MAIN_AAD_USER_ID) {
    if (!aadUserId) return;

    setIsSyncingVideos(true);
    try {
      const syncRes = await fetch('/api/super-admin/teams/video/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: aadUserId, maxUploads: 3 }),
      });

      const syncData = (await syncRes.json()) as SyncResponse;
      if (!syncRes.ok) {
        const errorMsg =
          typeof syncData.error === 'string' ? syncData.error : 'Sync error';
        throw new Error(errorMsg);
      }

      await fetchVideosList(aadUserId);

      let rounds = 0;
      while (syncData.hasMore === true && rounds < 4) {
        rounds += 1;
        const r = await fetch('/api/super-admin/teams/video/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: aadUserId, maxUploads: 3 }),
        });

        const d = (await r.json()) as SyncResponse;
        if (!r.ok) break;

        await fetchVideosList(aadUserId);
        if (d.hasMore !== true) break;
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      console.error(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSyncingVideos(false);
    }
  }
  const { user } = useUser(); // Ya está dentro del componente

  // Estado para meetings ya poblados desde backend
  const [populatedMeetings, setPopulatedMeetings] = useState<UIMeeting[]>([]);
  const [videosRaw, setVideosRaw] = useState<
    {
      meetingId: string;
      videoKey: string;
      videoUrl: string;
      createdAt?: string;
    }[]
  >([]);

  useEffect(() => {
    if (!courseIdNumber) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/super-admin/teams/recordings/by-course?courseId=${courseIdNumber}`,
          { cache: 'no-store' }
        );

        const body = (await res.json()) as unknown;
        if (!res.ok) {
          console.error('❌ by-course:', body);
          return;
        }

        interface ByCourseResponse {
          meetings?: unknown;
        }
        const meetingsUnknown = (body as ByCourseResponse)?.meetings;
        const rawMeetings: unknown[] = Array.isArray(meetingsUnknown)
          ? meetingsUnknown
          : [];

        // Helpers locales (evitan usar ensureUIMeeting y "any")
        const getStr = (obj: Record<string, unknown>, key: string) => {
          const v = obj[key];
          return typeof v === 'string' && v.trim() ? (v as string) : undefined;
        };
        const toIsoDate = (v: unknown): string | undefined => {
          if (typeof v === 'string' && v.trim()) return v; // ya viene ISO/legible
          if (v instanceof Date) return v.toISOString();
          if (typeof v === 'number' && Number.isFinite(v)) {
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
          }
          // Si es un objeto con toISOString (e.g. dayjs/moment toDate()):
          if (
            v &&
            typeof v === 'object' &&
            typeof (v as { toISOString?: () => string }).toISOString ===
              'function'
          ) {
            try {
              return (v as { toISOString: () => string }).toISOString();
            } catch {
              return undefined;
            }
          }
          return undefined;
        };

        const toUIMeeting = (raw: unknown): UIMeeting => {
          const r = (raw ?? {}) as Record<string, unknown>;

          const meetingId =
            getStr(r, 'meeting_id') ?? getStr(r, 'meetingId') ?? '';

          return {
            ...(r as Partial<ScheduledMeeting>), // conserva campos extra si existen
            id: Number(r.id) || 0,
            meetingId,
            joinUrl: getStr(r, 'join_url') ?? getStr(r, 'joinUrl'),
            recordingContentUrl: getStr(r, 'recordingContentUrl'),
            video_key: getStr(r, 'video_key') ?? getStr(r, 'videoKey'),
            video_key_2: getStr(r, 'video_key_2') ?? getStr(r, 'videoKey2'),
            videoUrl: getStr(r, 'videoUrl'),
            videoUrl2: getStr(r, 'videoUrl2'),
            title: typeof r.title === 'string' ? (r.title as string) : '',
            startDateTime: toIsoDate(r.startDateTime) ?? '',
            endDateTime: toIsoDate(r.endDateTime) ?? '',
            weekNumber: Number(r.weekNumber ?? 0),
          };
        };

        const mts: UIMeeting[] = rawMeetings.map(toUIMeeting);

        setPopulatedMeetings(mts);

        // log compacto (sin any)
        console.table(
          mts.map((x) => ({
            id: x.id,
            meetingId: x.meetingId,
            start: String(x.startDateTime),
            video_key: x.video_key ?? '',
            videoUrl: x.videoUrl ?? '',
          }))
        );
      } catch (e) {
        console.error('❌ fetch populated meetings:', e);
      }
    })();
  }, [courseIdNumber]);

  const handleEnrollAndRedirect = async () => {
    if (!user?.id || !courseIdNumber) {
      toast.error('Usuario no autenticado o curso inválido');
      return;
    }

    try {
      const res = await fetch('/api/enrollments/educatorsEnroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: String(courseIdNumber),
          userIds: [user.id], // 🔁 Aquí sí tienes acceso
          planType: 'Premium',
        }),
      });

      if (!res.ok) {
        const responseData: unknown = await res.json();

        const errorMessage =
          typeof responseData === 'object' &&
          responseData !== null &&
          'error' in responseData &&
          typeof (responseData as { error?: unknown }).error === 'string'
            ? (responseData as { error: string }).error
            : 'Error al matricular';

        toast.error(errorMessage);
      } else {
        toast.success('Matriculado correctamente');
        router.push(`/estudiantes/cursos/${courseIdNumber}`);
      }
    } catch (error) {
      console.error('Error al matricular:', error);
      toast.error('Error al matricular al curso');
    }
  };

  // Función para obtener el curso y los parámetros
  const fetchCourse = useCallback(async () => {
    if (courseIdNumber !== null) {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/educadores/courses/${courseIdNumber}`
        );
        const responseParametros = await fetch(
          `/api/educadores/parametros?courseId=${courseIdNumber}`
        ); // Obtener los parámetros
        const materiasResponse = await fetch(
          `/api/educadores/courses/${courseIdNumber}/materiasOne`
        );
        if (materiasResponse.ok) {
          const materiasData = (await materiasResponse.json()) as Materia[];
          setMaterias(materiasData);
        } else {
          console.log(
            'No se encontraron materias o no se pudo cargar la información de las materias.'
          );
        }

        if (!response.ok || !responseParametros.ok) {
          throw new Error(response.statusText);
        }
        if (response.ok && responseParametros.ok) {
          const data = (await response.json()) as Course;
          setCourse(data);
          setCourseTypeId(
            Array.isArray(data.courseTypes)
              ? data.courseTypes.map((type) => type.id)
              : data.courseTypeId !== null && data.courseTypeId !== undefined
                ? [data.courseTypeId]
                : []
          );
          setIndividualPrice(data.individualPrice ?? null);
          setCurrentInstructor(data.instructor); // Set current instructor when course loads
          setSelectedInstructor(data.instructor); // Set selected instructor when course loads
          setEditCoverVideoCourseKey(data.coverVideoCourseKey ?? null);
          // Set certification type names
          setCertificationTypeName(data.certificationTypeName ?? null);
          setScheduleOptionName(data.scheduleOptionName ?? null);
          setSpaceOptionName(data.spaceOptionName ?? null);

          const dataParametros =
            (await responseParametros.json()) as Parametros[]; // Obtener los parámetros
          setParametros(dataParametros); // Inicializar los parámetros
        } else {
          let errorMessage = response.statusText;

          // Intentamos parsear el cuerpo de la respuesta como JSON
          const errorResponseRaw: unknown = await response
            .json()
            .catch(() => null);

          if (
            errorResponseRaw &&
            typeof errorResponseRaw === 'object' &&
            'error' in errorResponseRaw &&
            typeof (errorResponseRaw as { error: unknown }).error === 'string'
          ) {
            errorMessage = (errorResponseRaw as { error: string }).error;
          }

          // Guardar en estado y mostrar toast con mensaje claro
          setError(`Error al cargar el curso: ${errorMessage}`);
          toast('Error', {
            description: `No se pudo cargar el curso: ${errorMessage}`,
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar el curso: ${errorMessage}`);
        toast('Error', {
          description: `No se pudo cargar el curso: ${errorMessage}`,
        });
      } finally {
        setLoading(false);
      }
    }
  }, [courseIdNumber]);

  // Add this function after fetchCourse
  const fetchEducators = async () => {
    try {
      const response = await fetch('/api/super-admin/changeEducators');
      if (!response.ok) throw new Error('Failed to fetch educators');
      const data = (await response.json()) as Educator[];
      setEducators(data);
    } catch (error) {
      console.error('Error fetching educators:', error);
    }
  };
  useEffect(() => {
    if (currentInstructor && educators.length > 0) {
      const foundByName = educators.find((e) => e.name === currentInstructor);
      if (foundByName) {
        // Esto corrige el error si por alguna razón vino el nombre en vez del ID
        setCurrentInstructor(foundByName.id);
      }
    }
  }, [currentInstructor, educators]);

  // Obtener el curso y los parámetros al cargar la página
  useEffect(() => {
    void fetchCourse();
  }, [fetchCourse]);

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    void fetchEducators(); // Use void operator to explicitly ignore the promise
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        // Obtener videos del organizador principal
        const organizerAadUserId = '0843f2fa-3e0b-493f-8bb9-84b0aa1b2417';

        // Obtener también del coorganizador si existe
        const coOrganizerIds = course?.meetings
          ?.map((m) => m.joinUrl)
          .filter(Boolean)
          .map((url) => {
            // Extraer ID de organizador alternativo de la URL si existe
            const match = /organizer=([^&]+)/.exec(url ?? '');
            return match?.[1];
          })
          .filter((id, idx, arr) => id && arr.indexOf(id) === idx);

        const userIds = [organizerAadUserId, ...(coOrganizerIds ?? [])].filter(
          Boolean
        );

        const allVideos: VideoIdxItem[] = [];

        for (const userId of userIds) {
          const res = await fetch(
            `/api/super-admin/teams/video?userId=${userId}&courseId=${courseIdNumber}`
          );

          if (!res.ok) return;

          // ...
          const raw = (await res.json()) as unknown;

          const videos: VideoIdxItem[] =
            isRecord(raw) &&
            Array.isArray((raw as Record<string, unknown>).videos)
              ? ((raw as Record<string, unknown>).videos as unknown[]).filter(
                  isVideoIdxItem
                )
              : [];

          allVideos.push(...videos);
        }

        // Deduplicar por videoKey
        const uniqueVideos = Array.from(
          new Map(allVideos.map((v) => [v.videoKey, v])).values()
        );

        setVideosRaw(uniqueVideos);

        console.log(
          `🎥 videosRaw=${uniqueVideos.length} (de ${userIds.length} organizadores)`
        );
        for (const v of uniqueVideos) {
          console.log(
            `  • videoKey=${v.videoKey} createdAt=${v.createdAt ?? '-'} meetingId=${v.meetingId || '-'}`
          );
        }

        const map = new Map<
          string,
          { videoKey: string; videoUrl: string; createdAt?: string }
        >();
        for (const v of uniqueVideos) {
          const prev = map.get(v.meetingId);
          if (!prev) {
            map.set(v.meetingId, v);
          } else {
            const pt = prev.createdAt ? new Date(prev.createdAt).getTime() : 0;
            const ct = v.createdAt ? new Date(v.createdAt).getTime() : 0;
            if (ct >= pt) map.set(v.meetingId, v);
          }
        }
      } catch (e) {
        console.error('❌ Error fetch /teams/video:', e);
      }
    };

    void run();
  }, [course?.meetings, courseIdNumber]);

  // Obtener el color seleccionado al cargar la página
  useEffect(() => {
    const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
    if (savedColor) {
      setSelectedColor(savedColor);
    }
  }, [courseIdNumber]);

  // Listener para mostrar/ocultar la tarjeta sticky según el scroll
  useEffect(() => {
    const handleScroll = () => {
      // Mostrar la tarjeta mini cuando el scroll es mayor a 300px
      setShowStickyCard(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manejo de actualizar
  const handleUpdateCourse = async (
    _id: string,
    title: string,
    description: string,
    file: File | null,
    categoryid: number,
    modalidadesid: number,
    nivelid: number,
    rating: number,
    addParametros: boolean,
    coverImageKey: string,
    fileName: string,
    courseTypeId: number[],
    isActive: boolean,
    subjects: { id: number }[],
    coverVideoCourseKey: string | null,
    individualPrice: number | null,
    parametros: {
      id: number;
      name: string;
      description: string;
      porcentaje: number;
    }[],
    horario: number | null,
    espacios: number | null,
    certificationTypeId: number | null
  ): Promise<void> => {
    try {
      setIsUpdating(true);

      let finalCoverImageKey = coverImageKey;
      let finalFileName = fileName;
      if (addParametros) {
        console.log('Se agregarán parámetros adicionales');
      }

      // Si viene un nuevo archivo, subimos el archivo
      if (file) {
        console.log('🟡 Subiendo nuevo archivo...');
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: file.type,
            fileSize: file.size,
            fileName: file.name,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al generar URL de carga');
        }

        const uploadData = (await uploadResponse.json()) as {
          url: string;
          fields: Record<string, string>;
          key: string;
          fileName: string;
        };

        const formData = new FormData();
        Object.entries(uploadData.fields).forEach(([k, v]) =>
          formData.append(k, v)
        );
        formData.append('file', file);

        const uploadResult = await fetch(uploadData.url, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResult.ok) {
          throw new Error('Error al subir archivo a S3');
        }

        finalCoverImageKey = uploadData.key;
        finalFileName = uploadData.fileName;

        console.log('🟢 Archivo subido correctamente:', {
          finalCoverImageKey,
          finalFileName,
        });
      }

      const payload = {
        title,
        description,
        coverImageKey,
        coverVideoCourseKey: coverVideoCourseKey ?? null,
        fileName: finalFileName,
        categoryid,
        modalidadesid,
        nivelid,
        instructor: currentInstructor,
        rating,
        courseTypeId,
        isActive,
        subjects: subjects.length ? subjects : currentSubjects,
        individualPrice,
        parametros,
        horario,
        espacios,
        certificationTypeId,
      };

      console.log('🚀 Payload final de actualización:', payload);

      const response = await fetch(
        `/api/educadores/courses/${courseIdNumber}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (addParametros && parametros.length) {
        console.log('📝 Se actualizarán o crearán parámetros...');

        for (const parametro of parametros) {
          if (parametro.id && parametro.id !== 0) {
            console.log(`➡️ Actualizando parámetro ID: ${parametro.id}`);

            const updateResponse = await fetch(
              `/api/educadores/parametros/${parametro.id}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: parametro.name,
                  description: parametro.description,
                  porcentaje: parametro.porcentaje,
                  courseId: Number(courseIdString2),
                }),
              }
            );

            if (!updateResponse.ok) {
              console.error(
                `🔴 Error al actualizar parámetro ID ${parametro.id}`
              );
            } else {
              console.log(
                `✅ Parámetro ID ${parametro.id} actualizado correctamente`
              );
            }
          } else {
            const createResponse = await fetch(`/api/educadores/parametros`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: parametro.name,
                description: parametro.description,
                porcentaje: parametro.porcentaje,
                courseId: Number(courseIdString2),
              }),
            });

            if (!createResponse.ok) {
              console.error('🔴 Error al crear nuevo parámetro');
            } else {
              console.log('✅ Nuevo parámetro creado correctamente');
            }
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Error al actualizar curso:', errorText);
        throw new Error('Error al actualizar el curso');
      }

      const updatedCourse = (await response.json()) as Course;

      setCourse(updatedCourse);
      setIsModalOpen(false);
      toast.success('Curso actualizado correctamente');
      await fetchCourse();
    } catch (err) {
      console.error('❌ ERROR FATAL EN handleUpdateCourse:', err);
      toast.error('Error al actualizar curso');
    } finally {
      setIsUpdating(false);
      console.log('🟢 FIN handleUpdateCourse');
    }
  };

  // Función para manejar la edición del curso
  const handleEditCourse = () => {
    if (!course) return;
    setEditTitle(course.title);
    setEditDescription(course.description);
    setEditCategory(parseInt(course.categoryid));
    setEditModalidad(parseInt(course.modalidadesid));
    setEditNivel(parseInt(course.nivelid));
    setIndividualPrice(course.individualPrice ?? null);

    // 🔥 VALIDAMOS QUE coverImageKey NO SEA UN VIDEO
    if (course.coverImageKey.endsWith('.mp4')) {
      console.warn(
        '⚠ El coverImageKey tenía un video, lo limpiamos para edición.'
      );
      setEditCoverImageKey('');
    } else {
      setEditCoverImageKey(course.coverImageKey);
    }

    setEditCoverVideoCourseKey(course.coverVideoCourseKey ?? '');
    setEditParametros(
      parametros.map((parametro) => ({
        id: parametro.id,
        name: parametro.name,
        description: parametro.description,
        porcentaje: parametro.porcentaje,
      }))
    );
    setEditRating(course.rating);
    setCourseTypeId(
      Array.isArray(course.courseTypes)
        ? course.courseTypes.map((type) => type.id)
        : course.courseTypeId !== null && course.courseTypeId !== undefined
          ? [course.courseTypeId]
          : []
    );
    setIsActive(course.isActive ?? true);
    setCurrentInstructor(course.instructor);
    setCurrentSubjects(materias.map((materia) => ({ id: materia.id })));
    setEditHorario(course.horario ?? null);
    setEditEspacios(course.espacios ?? null);
    setIsModalOpen(true);
  };

  // Verificar si se está cargando
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

  // Verificar si hay un error o hay curso
  if (!course) return <div>No se encontró el curso.</div>;

  // Función para manejar la eliminación del curso
  const handleDelete = async () => {
    if (!course) return;
    try {
      // Primero intentamos eliminar la imagen de S3
      if (course.coverImageKey) {
        const responseAws = await fetch('/api/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: course.coverImageKey,
          }),
        });

        if (!responseAws.ok) {
          console.error('Error al eliminar la imagen de S3');
        }
      }

      // Luego eliminamos el curso
      const response = await fetch(
        `/api/educadores/courses?courseId=${course.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar el curso`);
      }

      toast('Curso eliminado', {
        description: 'El curso se ha eliminado con éxito.',
      });
      router.push('/dashboard/super-admin/cursos');
    } catch (error) {
      console.error('Error:', error);
      toast('Error', {
        description: 'No se pudo eliminar el curso completamente',
      });
    }
  };

  // Verificar si hay un error
  if (error) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">
            Error tipo: {error}
          </p>
          <button
            onClick={fetchCourse}
            className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Función para manejar el cambio de color predefinido
  const handlePredefinedColorChange = (color: string) => {
    setSelectedColor(color);
    localStorage.setItem(`selectedColor_${courseIdNumber}`, color);
  };

  // Modify handleChangeInstructor to include name
  const handleChangeInstructor = async () => {
    if (!selectedInstructor || !course?.id) {
      toast.error('Por favor seleccione un instructor');
      return;
    }

    try {
      setIsUpdating(true);

      const response = await fetch('/api/super-admin/changeEducators', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          newInstructor: selectedInstructor,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el instructor');
      }

      // Update the course state with new instructor
      const selectedEducator = educators.find(
        (e) => e.id === selectedInstructor
      );

      if (selectedEducator && course) {
        setCourse({
          ...course,
          instructor: selectedInstructor,
          instructorName: selectedEducator.name,
        });

        setSelectedInstructor('');
        toast.success('Instructor actualizado exitosamente');
        await fetchCourse();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el instructor');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add this before the return statement
  if (isUpdating) {
    return <FullscreenLoader />;
  }
  const EducatorsList: React.FC<{
    educators: Educator[];
    course: Course;
    onSelectEducator: (id: string) => void;
    selectedInstructor: string;
    onSaveChange: () => void;
    isUpdating: boolean;
  }> = ({
    educators,
    course,
    onSelectEducator,
    selectedInstructor,
    onSaveChange,
    isUpdating,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const currentEducator = educators.find((e) => e.id === course.instructor);
    const displayEducator = educators.find(
      (e) => e.id === (selectedInstructor ?? course.instructor)
    );
    void currentEducator;

    // Filtrar educadores por búsqueda
    const filteredEducators = educators.filter(
      (educator) =>
        (educator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false) ||
        (educator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false)
    );

    // Función para copiar al portapapeles
    const copyToClipboard = (text: string, type: string) => {
      navigator.clipboard.writeText(text);
      toast.success(`${type} copiado al portapapeles`);
    };

    return (
      <div className="flex flex-col gap-3">
        {/* Dropdown personalizado */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full rounded-md border border-cyan-500/50 bg-slate-900 p-3 text-left text-sm text-cyan-400 transition-colors hover:border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">
                  {displayEducator?.name ?? 'Sin nombre'}
                </p>
                {displayEducator?.email && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-cyan-400/70">
                    <span>✉️</span>
                    <span>{displayEducator.email}</span>
                  </p>
                )}
                {!displayEducator?.email && (
                  <p className="mt-1 text-xs text-cyan-400/50 italic">
                    Sin correo disponible
                  </p>
                )}
              </div>
              <svg
                className={`h-5 w-5 flex-shrink-0 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {/* Lista desplegable */}
          {isOpen && (
            <>
              {/* Overlay para cerrar al hacer clic afuera */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-cyan-500/50 bg-slate-900 shadow-lg">
                {/* Campo de búsqueda */}
                <div className="border-b border-cyan-500/30 p-2">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded border border-cyan-500/40 bg-slate-900 px-3 py-2 text-sm text-cyan-400 placeholder:text-cyan-400/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Lista de educadores */}
                <div className="max-h-60 overflow-auto">
                  {filteredEducators.length > 0 ? (
                    filteredEducators.map((educator) => (
                      <div
                        key={educator.id}
                        className={`group border-b border-cyan-500/20 p-3 transition-colors last:border-b-0 hover:bg-cyan-500/10 ${
                          educator.id ===
                          (selectedInstructor ?? course.instructor)
                            ? 'bg-cyan-500/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectEducator(educator.id);
                              setIsOpen(false);
                              setSearchTerm('');
                            }}
                            className="flex-1 text-left text-cyan-400"
                          >
                            <p className="text-sm font-medium">
                              {educator.name}
                            </p>
                            {educator.email ? (
                              <p className="mt-1 flex items-center gap-1 text-xs text-cyan-400/70">
                                <span>✉️</span>
                                <span>{educator.email}</span>
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-cyan-400/50 italic">
                                Sin correo
                              </p>
                            )}
                          </button>

                          {/* Botones de copiar */}
                          <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(educator.name ?? '', 'Nombre');
                              }}
                              className="rounded p-1 text-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-400"
                              title="Copiar nombre"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                            {educator.email && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(
                                    educator.email ?? '',
                                    'Correo'
                                  );
                                }}
                                className="rounded p-1 text-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-400"
                                title="Copiar correo"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-cyan-400/50">
                      No se encontraron educadores
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botón de guardado */}
        {selectedInstructor && selectedInstructor !== course.instructor && (
          <Button
            size="sm"
            onClick={onSaveChange}
            className="relative w-full border-cyan-500 bg-cyan-500/20 text-cyan-400 transition-colors hover:bg-cyan-500/40"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <span className="mr-2">💾</span>
                Guardar Cambio
              </>
            )}
          </Button>
        )}
      </div>
    );
  };
  const awsBase = (process.env.NEXT_PUBLIC_AWS_S3_URL ?? '').replace(
    /\/+$/,
    ''
  );

  function toMsFlexible(v: unknown): number {
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'string') {
      const s = v.trim();
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
        if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s).getTime();
        return new Date(`${s}-05:00`).getTime(); // Bogotá
      }
      const t = new Date(s).getTime();
      if (!Number.isNaN(t)) return t;
    }
    return Number.NaN;
  }
  function ensureUIMeeting(raw: unknown): UIMeeting {
    const r = isRecord(raw) ? raw : {};

    const str = (k: string): string | undefined => {
      const v = r[k];
      return typeof v === 'string' && v.trim() ? v : undefined;
    };

    const num = (k: string): number | undefined => {
      const v = r[k];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) {
        return Number(v);
      }
      return undefined;
    };

    const id = num('id') ?? 0;

    const meetingId = str('meeting_id') ?? str('meetingId') ?? '';

    const joinUrl = str('join_url') ?? str('joinUrl');

    const video_key = str('video_key') ?? str('videoKey');
    const videoUrlFromApi = str('videoUrl');
    const finalVideoUrl = video_key
      ? `${awsBase}/video_clase/${video_key}`
      : videoUrlFromApi;
    const video_key_2 = str('video_key_2') ?? str('videoKey2');
    const finalVideoUrl2 = video_key_2
      ? `${awsBase}/video_clase/${video_key_2}`
      : undefined;

    return {
      id,
      meetingId,
      joinUrl,
      recordingContentUrl: undefined,
      video_key,
      videoUrl: finalVideoUrl,
      title: str('title') ?? '',
      startDateTime: str('startDateTime') ?? '',
      endDateTime: str('endDateTime') ?? '',
      weekNumber: num('weekNumber') ?? 0,
      video_key_2,
      videoUrl2: finalVideoUrl2,
    };
  }

  // Fuente base: si el back ya te trajo meetings "poblados", úsalos; si no, usa las del curso
  const baseMeetings: UIMeeting[] = (
    populatedMeetings.length ? populatedMeetings : (course.meetings ?? [])
  ).map(ensureUIMeeting);

  // Emparejamiento ESTRICTO por meetingId (sin ventana temporal)
  const allowedMeetingIds = new Set(
    baseMeetings.map((m) => m.meetingId).filter(Boolean)
  );

  // Agrupar videos por meetingId (máximo 2 por reunión), ordenados por createdAt asc
  const videosByMeetingId = new Map<string, VideoIdxItem[]>();

  for (const video of videosRaw) {
    if (!video.meetingId || !allowedMeetingIds.has(video.meetingId)) continue;

    const currentList = videosByMeetingId.get(video.meetingId) ?? [];
    currentList.push(video);

    currentList.sort((a, b) => {
      const at = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
      return at - bt;
    });

    // Nos quedamos con las 2 primeras (parte 1 y parte 2)
    videosByMeetingId.set(video.meetingId, currentList.slice(0, 2));
  }

  // Enriquecer meetings con hasta 2 videos por meetingId
  const enrichedMeetings: UIMeeting[] = baseMeetings.map((meeting) => {
    if (!meeting.meetingId) return meeting;

    const candidates = videosByMeetingId.get(meeting.meetingId);
    if (!candidates?.length) return meeting;

    const [first, second] = candidates;

    const alreadyHasFirst = Boolean(meeting.video_key ?? meeting.videoUrl);
    const alreadyHasSecond = Boolean(meeting.video_key_2);

    // Si no tiene nada, setear ambos (si existen)
    if (!alreadyHasFirst && !alreadyHasSecond) {
      return {
        ...meeting,
        video_key: first?.videoKey,
        videoUrl: first?.videoKey
          ? `${awsBase}/video_clase/${first.videoKey}`
          : meeting.videoUrl,
        video_key_2: second?.videoKey,
        videoUrl2: second?.videoKey
          ? `${awsBase}/video_clase/${second.videoKey}`
          : meeting.videoUrl2,
      };
    }

    // Si tiene el primero pero no el segundo, setear solo el segundo
    if (alreadyHasFirst && !alreadyHasSecond && second?.videoKey) {
      return {
        ...meeting,
        video_key_2: second.videoKey,
        videoUrl2: `${awsBase}/video_clase/${second.videoKey}`,
      };
    }

    return meeting;
  });

  const meetingsForList: UIMeeting[] = [...enrichedMeetings].sort((a, b) => {
    const aMs = toMsFlexible(a.startDateTime);
    const bMs = toMsFlexible(b.startDateTime);
    return (aMs || 0) - (bMs || 0);
  });

  // Renderizar el componente
  return (
    <div className="h-auto w-full p-4">
      {/* Tarjeta Mini Sticky - Aparece al hacer scroll */}
      {showStickyCard && course && (
        <div className="animate-in fade-in slide-in-from-top-4 fixed top-4 right-4 left-4 z-50 mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-xl border border-cyan-500/40 bg-slate-950 p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm duration-500 md:right-8 md:left-8">
          {/* Mini Imagen y Info */}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {/* Mini Imagen */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL ?? ''}/${course.coverImageKey}`}
                alt={course.title}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                quality={60}
              />
            </div>

            {/* Información compacta */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-white">
                {course.title}
              </h3>
              <p className="truncate text-xs font-semibold text-cyan-400">
                {course.categoryName ?? 'Curso'} • {course.nivelName ?? 'Nivel'}
              </p>
              <div className="mt-1 flex gap-2">
                <Badge className="border-cyan-500/50 bg-cyan-500/30 text-xs text-cyan-300">
                  {course.modalidadesName ?? 'Modalidad'}
                </Badge>
                {course.instructorName && (
                  <Badge className="border-purple-500/50 bg-purple-500/30 text-xs text-purple-300">
                    👨‍🏫 {course.instructorName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Botón Volver arriba */}
          <Button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex-shrink-0 bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-all hover:bg-cyan-600"
          >
            ↑ Arriba
          </Button>
        </div>
      )}

      <Breadcrumb className="animate-in fade-in slide-in-from-top-4 mb-8 duration-500">
        <BreadcrumbList className="flex flex-wrap gap-2">
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href="/dashboard/super-admin"
            >
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-cyan-400 transition-colors duration-300 hover:text-cyan-300"
              href="/dashboard/super-admin/cursos"
            >
              Cursos
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="text-white/60">Detalles</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="group relative h-auto w-full">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 opacity-0 blur-3xl transition-all duration-700 group-hover:opacity-100" />
        <Card className="zoom-in sticky top-0 z-30 mt-3 h-auto overflow-hidden border-2 border-cyan-500/30 bg-slate-950 p-4 shadow-2xl transition-all duration-500 ease-out hover:border-cyan-500/60 hover:shadow-cyan-500/30 sm:p-8">
          <CardHeader className="grid w-full grid-cols-1 gap-6 border-b border-cyan-500/20 p-0 pb-8 md:grid-cols-2 md:gap-12">
            <div className="animate-in fade-in slide-in-from-left-4 space-y-3 duration-500">
              <p className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
                Detalles del Curso
              </p>
              <CardTitle className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {course.title}
              </CardTitle>
            </div>
            <div className="animate-in fade-in slide-in-from-right-4 flex flex-col justify-start gap-4 duration-500">
              <Label className="flex items-center gap-2 text-sm font-bold tracking-wider text-cyan-400 uppercase">
                Tema Visual
              </Label>
              <div className="flex flex-wrap gap-3">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handlePredefinedColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`h-12 w-12 rounded-xl border-2 transition-all duration-300 hover:scale-125 hover:shadow-lg hover:shadow-cyan-500/50 ${
                      selectedColor === color
                        ? `scale-110 border-white shadow-lg ring-2 ring-cyan-400 ring-offset-2`
                        : 'border-white/20 hover:border-cyan-400'
                    }`}
                    title={`Cambiar tema a ${color}`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Left Column - Image */}
            <div className="animate-in fade-in slide-in-from-left-8 flex w-full flex-col space-y-5 duration-700">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL ?? ''}/${course.coverImageKey}`}
                  alt={course.title}
                  width={300}
                  height={100}
                  className="mx-auto h-full w-full rounded-2xl object-contain"
                  priority
                  quality={75}
                />
              </div>
              <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                <Button
                  onClick={handleEnrollAndRedirect}
                  className="w-full bg-cyan-500 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-cyan-600 md:px-4 md:py-3 md:text-sm"
                >
                  Ver
                </Button>
                <Button
                  onClick={handleEditCourse}
                  className="w-full bg-yellow-500 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-yellow-600 md:px-4 md:py-3 md:text-sm"
                >
                  ✏️ Editar
                </Button>
                <Button className="w-full bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-blue-600 md:px-4 md:py-3 md:text-sm">
                  <Link
                    href={`/dashboard/super-admin/detailsDashboard/${course.id}`}
                  >
                    Stats
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full bg-red-500 px-3 py-2 text-xs font-semibold transition-all duration-300 hover:bg-red-600 md:px-4 md:py-3 md:text-sm"
                    >
                      🗑️ Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará
                        permanentemente el curso
                        <span className="font-bold"> {course.title}</span> y
                        todos los datos asociados a este.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete()}
                        className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {/* Right Column - Information */}
            <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-700">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Información del Curso
              </h2>

              {/* Grid de información rápida */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Categoría
                  </p>
                  <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                    {course.categoryName ?? course.categoryid}
                  </Badge>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Nivel
                  </p>
                  <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                    {course.nivelName ?? course.nivelid}
                  </Badge>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Modalidad
                  </p>
                  <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                    {course.modalidadesName ?? course.modalidadesid}
                  </Badge>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Certificación
                  </p>
                  <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                    {certificationTypeName ?? 'No asignado'}
                  </Badge>
                </div>
              </div>

              {/* Descripción */}
              <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/60 hover:bg-white/10">
                <h3 className="mb-3 text-sm font-bold tracking-wide text-cyan-400 uppercase">
                  Descripción
                </h3>
                <p className="text-sm leading-relaxed text-white/80">
                  {course.description}
                </p>
              </div>

              {/* Educador */}
              <div className="rounded-xl border-2 border-cyan-500/40 bg-cyan-500/10 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/70">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-cyan-400 uppercase">
                  Educador Asignado
                </h2>
                <EducatorsList
                  educators={educators}
                  course={course}
                  onSelectEducator={setSelectedInstructor}
                  selectedInstructor={selectedInstructor}
                  onSaveChange={handleChangeInstructor}
                  isUpdating={isUpdating}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
      {loading ? (
        <LoadingCourses />
      ) : (
        courseIdNumber !== null && (
          <div className="mt-16 space-y-8">
            {/* TABS MENU HORIZONTAL */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Tabs Navigation */}
              <div className="mb-8 border-b border-cyan-500/20">
                <div className="flex gap-8 overflow-x-auto pb-4">
                  <button
                    onClick={() => setActiveTab('curso')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'curso'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Curso
                  </button>
                  <button
                    onClick={() => setActiveTab('lecciones')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'lecciones'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Lista de Clases
                  </button>
                  <button
                    onClick={() => setActiveTab('estudiantes')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'estudiantes'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Estudiantes
                  </button>
                  <button
                    onClick={() => setActiveTab('grabadas')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'grabadas'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Clases grabadas{' '}
                    <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                      {meetingsForList.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('proyectos')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'proyectos'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Proyectos{' '}
                    <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                      1
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('recursos')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'recursos'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Recursos{' '}
                    <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                      3
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('actividades')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'actividades'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Actividades{' '}
                    <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                      5
                    </span>
                  </button>
                </div>
              </div>

              {/* TAB CONTENT */}
              <div className="space-y-6">
                {/* Curso Tab - Solo Clase en Vivo */}
                {activeTab === 'curso' && (
                  <div className="animate-in fade-in duration-500">
                    <h2 className="mb-6 text-2xl font-bold text-white">
                      Clase en Vivo
                    </h2>

                    {/* Clases agendadas */}
                    <div className="mb-6 space-y-4">
                      <ScheduledMeetingsList
                        meetings={meetingsForList}
                        color={selectedColor}
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex w-full flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={() => void handleSyncVideos()}
                        disabled={isSyncingVideos}
                        className="w-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-cyan-600 disabled:opacity-50 sm:w-auto md:px-6 md:py-3 md:text-base"
                      >
                        {isSyncingVideos
                          ? 'Sincronizando...'
                          : 'Sincronizar Videos'}
                      </Button>

                      <Button
                        onClick={() => setIsMeetingModalOpen(true)}
                        className="w-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-cyan-600 sm:w-auto md:px-6 md:py-3 md:text-base"
                      >
                        Agendar Clase
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lista de Clases Tab */}
                {activeTab === 'lecciones' && (
                  <div className="animate-in fade-in duration-500">
                    <LessonsListEducator
                      courseId={courseIdNumber}
                      selectedColor={selectedColor}
                    />
                  </div>
                )}

                {/* Estudiantes Tab */}
                {activeTab === 'estudiantes' && (
                  <div className="animate-in fade-in duration-500">
                    <DashboardEstudiantes
                      courseId={courseIdNumber}
                      selectedColor={selectedColor}
                    />
                  </div>
                )}

                {/* Clases Grabadas Tab */}
                {activeTab === 'grabadas' && (
                  <div className="animate-in fade-in duration-500">
                    <h2 className="mb-6 text-2xl font-bold text-white">
                      Clases Grabadas ({meetingsForList.length})
                    </h2>
                    <div className="space-y-4">
                      <ScheduledMeetingsList
                        meetings={meetingsForList}
                        color={selectedColor}
                      />
                    </div>
                  </div>
                )}

                {/* Proyectos Tab */}
                {activeTab === 'proyectos' && (
                  <div className="animate-in fade-in duration-500">
                    <h2 className="mb-6 text-2xl font-bold text-white">
                      Proyectos
                    </h2>
                    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
                      <p className="text-white/60">
                        Aquí irán los proyectos del curso...
                      </p>
                    </div>
                  </div>
                )}

                {/* Recursos Tab */}
                {activeTab === 'recursos' && (
                  <div className="animate-in fade-in duration-500">
                    <h2 className="mb-6 text-2xl font-bold text-white">
                      Recursos
                    </h2>
                    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
                      <p className="text-white/60">
                        Aquí irán los recursos del curso...
                      </p>
                    </div>
                  </div>
                )}

                {/* Actividades Tab */}
                {activeTab === 'actividades' && (
                  <div className="animate-in fade-in duration-500">
                    <h2 className="mb-6 text-2xl font-bold text-white">
                      Actividades
                    </h2>
                    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6">
                      <p className="text-white/60">
                        Aquí irán las actividades del curso...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      <ModalScheduleMeeting
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        onMeetingsCreated={() => {
          setIsMeetingModalOpen(false);
          fetchCourse(); // 🔄 vuelve a traer el curso con los meetings desde backend
        }}
        courseId={courseIdNumber} // <-- aquí lo pasas
      />

      {isModalOpen && (
        <ModalFormCourse
          isOpen={isModalOpen}
          onSubmitAction={(
            id,
            title,
            description,
            file,
            categoryid,
            modalidadesid,
            nivelid,
            rating,
            addParametros,
            coverImageKey,
            fileName,
            courseTypeId,
            isActive,
            subjects,
            coverVideoCourseKey,
            individualPrice,
            parametros,
            horario,
            espacios,
            certificationTypeId
          ) =>
            handleUpdateCourse(
              id,
              title,
              description,
              file,
              categoryid,
              modalidadesid,
              nivelid,
              rating,
              addParametros,
              coverImageKey,
              fileName,
              courseTypeId,
              isActive,
              subjects,
              coverVideoCourseKey,
              individualPrice,
              parametros,
              horario,
              espacios,
              certificationTypeId
            )
          }
          editingCourseId={course.id}
          title={editTitle}
          description={editDescription}
          categoryid={editCategory}
          modalidadesid={editModalidad}
          nivelid={editNivel}
          coverImageKey={editCoverImageKey}
          parametros={editParametros}
          rating={editRating}
          setTitle={setEditTitle}
          setDescription={setEditDescription}
          setModalidadesid={(value: number | number[]) =>
            setEditModalidad(
              Array.isArray(value) ? Number(value[0]) : Number(value)
            )
          }
          setCategoryid={setEditCategory}
          setNivelid={setEditNivel}
          setCoverImageKey={setEditCoverImageKey}
          setParametrosAction={setEditParametros}
          setRating={setEditRating}
          onCloseAction={() => setIsModalOpen(false)}
          uploading={false}
          courseTypeId={courseTypeId}
          setCourseTypeId={setCourseTypeId}
          isActive={isActive}
          setIsActive={setIsActive}
          instructor={currentInstructor}
          setInstructor={setCurrentInstructor}
          educators={educators}
          subjects={currentSubjects}
          setSubjects={setCurrentSubjects}
          coverVideoCourseKey={editCoverVideoCourseKey}
          setCoverVideoCourseKey={setEditCoverVideoCourseKey}
          individualPrice={individualPrice}
          setIndividualPrice={setIndividualPrice}
          horario={editHorario}
          setHorario={setEditHorario}
          espacios={editEspacios}
          setEspacios={setEditEspacios}
          certificationTypeId={course.certificationTypeId ?? null}
          setCertificationTypeId={(id) => {
            setCourse((prev) =>
              prev ? { ...prev, certificationTypeId: id } : null
            );
          }}
          certificationTypes={[]}
        />
      )}
    </div>
  );
};

export default CourseDetail;
