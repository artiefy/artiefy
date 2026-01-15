'use client';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { Portal } from '@radix-ui/react-portal';
import {
  CornerDownLeft,
  ImageIcon,
  Mic,
  Music,
  ThumbsUp,
  Video,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import { AudioRecorder } from '~/components/AudioRecorder';
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
  instructorProfesion?: string;
  instructorDescripcion?: string;
  instructorProfileImageKey?: string;
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

// Interface para foros
interface Forum {
  id: number;
  title: string;
  description: string;
  coverImageKey?: string;
  documentKey?: string;
  courseId: number;
  userId: string;
  createdAt?: string;
  _count?: {
    posts?: number;
  };
}

// Interface para posts de foro
interface ForumPost {
  id: number;
  postId?: number;
  content: string;
  userId: string | { id: string; name: string; email: string };
  forumId?: number;
  imageKey?: string | null;
  audioKey?: string | null;
  videoKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  repliesCount?: number;
  user?: {
    id: string;
    name: string;
    role?: string;
    isEducator?: boolean;
  };
}

interface PostReply {
  id: number;
  postId: number;
  userId: { id: string; name: string; email: string };
  content: string;
  imageKey?: string | null;
  audioKey?: string | null;
  videoKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Interface para proyectos de estudiantes
interface StudentProject {
  id: number;
  name: string;
  planteamiento?: string;
  justificacion?: string;
  objetivo_general?: string;
  coverImageKey?: string;
  coverVideoKey?: string;
  type_project?: string;
  userId: string;
  categoryId?: number;
  isPublic?: boolean;
  public_comment?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_visualizacion?: string;
  createdAt?: string;
  updatedAt?: string;
  horas_por_dia?: number;
  total_horas?: number;
  tiempo_estimado?: string;
  dias_estimados?: number;
  dias_necesarios?: number;
  studentName?: string;
  studentEmail?: string;
  cover_image_key?: string;
  cover_video_key?: string;
  users_name?: string;
  users_email?: string;
  user?: {
    name?: string;
    email?: string;
  };
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
  const [activeTab, setActiveTab] = useState<string>('lecciones');
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

  // Estados para foros
  const [forums, setForums] = useState<Forum[]>([]);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');
  const [forumImage, setForumImage] = useState<File | null>(null);
  const [forumDocument, setForumDocument] = useState<File | null>(null);
  const [isCreatingForum, setIsCreatingForum] = useState(false);
  const [selectedForum, setSelectedForum] = useState<number | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Estados para respuestas/comentarios de foros
  const [replyingToPostId, setReplyingToPostId] = useState<Set<number>>(
    new Set()
  );
  const [replyMessage, setReplyMessage] = useState<Record<number, string>>({});
  const [postReplies, setPostReplies] = useState<{
    [key: number]: PostReply[];
  }>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyImage, setReplyImage] = useState<Record<number, File>>({});
  const [replyAudio, setReplyAudio] = useState<Record<number, File>>({});
  const [replyVideo, setReplyVideo] = useState<Record<number, File>>({});

  // Estados para media en posts
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showReplyAudioRecorder, setShowReplyAudioRecorder] = useState<
    Set<number>
  >(new Set());

  // --- Proyectos de estudiantes ---
  const [studentProjects, setStudentProjects] = useState<StudentProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  // Estado para el modal de proyecto seleccionado
  const [selectedProject, setSelectedProject] = useState<StudentProject | null>(
    null
  );

  // Función para obtener respuestas de un post
  const fetchPostReplies = useCallback(async () => {
    if (!selectedForum || posts.length === 0) return;
    try {
      const postIds = posts.map((post) => post.id).join(',');
      if (postIds) {
        const response = await fetch(
          `/api/forums/posts/postReplay?postIds=${postIds}`
        );
        if (response.ok) {
          const data = await response.json();
          // Reorganizar replies por postId
          const repliesByPost: { [key: number]: PostReply[] } = {};
          data.forEach((reply: PostReply) => {
            if (!repliesByPost[reply.postId]) {
              repliesByPost[reply.postId] = [];
            }
            repliesByPost[reply.postId].push(reply);
          });
          setPostReplies(repliesByPost);
        }
      }
    } catch (error) {
      console.error('Error al obtener respuestas:', error);
    }
  }, [posts, selectedForum]);

  // Fetch respuestas cuando se cargan los posts
  useEffect(() => {
    if (posts.length > 0) {
      void fetchPostReplies();
      // Abrir todos los formularios de respuesta por defecto
      const allPostIds = new Set(posts.map((post) => post.id));
      setReplyingToPostId(allPostIds);
    }
  }, [posts, fetchPostReplies]);

  // Función para crear respuesta a un post
  const handleCreateReply = async (postId: number) => {
    const currentReplyMessage = replyMessage[postId] || '';
    const currentReplyImage = replyImage[postId];
    const currentReplyAudio = replyAudio[postId];
    const currentReplyVideo = replyVideo[postId];

    if (!currentReplyMessage.trim() || !user?.id || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const formData = new FormData();
      formData.append('content', currentReplyMessage);
      formData.append('postId', postId.toString());
      formData.append('userId', user.fullName || user.id);

      if (currentReplyImage) formData.append('image', currentReplyImage);
      if (currentReplyAudio) formData.append('audio', currentReplyAudio);
      if (currentReplyVideo) formData.append('video', currentReplyVideo);

      const response = await fetch('/api/forums/posts/postReplay', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setReplyMessage((prev) => {
          const updated = { ...prev };
          delete updated[postId];
          return updated;
        });
        setReplyImage((prev) => {
          const updated = { ...prev };
          delete updated[postId];
          return updated;
        });
        setReplyAudio((prev) => {
          const updated = { ...prev };
          delete updated[postId];
          return updated;
        });
        setReplyVideo((prev) => {
          const updated = { ...prev };
          delete updated[postId];
          return updated;
        });
        setExpandedPosts((prev) => new Set(prev).add(postId));
        await fetchPostReplies();
        toast.success('Respuesta publicada');
      } else {
        toast.error('Error al enviar respuesta');
      }
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
      toast.error('Error al enviar respuesta');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Fetch student projects for all students enrolled in this course
  useEffect(() => {
    if (!courseIdNumber) return;
    setLoadingProjects(true);
    fetch(`/api/super-admin/proyects?courseId=${courseIdNumber}`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error('Error al obtener proyectos de estudiantes');
        const data = await res.json();
        console.log('Proyectos recibidos:', data); // LOG para depuración
        // Mapear los campos para que el frontend use cover_image_key y cover_video_key
        const mapped = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              cover_image_key: p.coverImageKey || p.cover_image_key || '',
              cover_video_key: p.coverVideoKey || p.cover_video_key || '',
            }))
          : [];
        setStudentProjects(mapped);
      })
      .catch((err) => {
        setStudentProjects([]);
        console.error('Error fetching student projects:', err);
      })
      .finally(() => setLoadingProjects(false));
  }, [courseIdNumber]);

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

  // Función para obtener foros
  const fetchForums = useCallback(async () => {
    try {
      const response = await fetch(`/api/forums?courseId=${courseIdNumber}`);
      if (response.ok) {
        const data = await response.json();
        setForums(data);
      }
    } catch (error) {
      console.error('Error fetching forums:', error);
    }
  }, [courseIdNumber]);

  // Obtener el curso y los parámetros al cargar la página
  useEffect(() => {
    void fetchCourse();
  }, [fetchCourse]);

  // Fetch forums when course loads
  useEffect(() => {
    if (courseIdNumber) {
      void fetchForums();
    }
  }, [courseIdNumber, fetchForums]);

  // Función para crear foro
  const handleCreateForum = async () => {
    if (!newForumTitle.trim() || !user?.id) {
      toast.error('Por favor completa el título del foro');
      return;
    }

    setIsCreatingForum(true);
    try {
      const formData = new FormData();
      formData.append('courseId', courseIdNumber.toString());
      formData.append('title', newForumTitle);
      formData.append('description', newForumDescription);
      formData.append('userId', user.id);

      if (forumImage) formData.append('coverImage', forumImage);
      if (forumDocument) formData.append('document', forumDocument);

      const response = await fetch('/api/forums', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Foro creado exitosamente');
        setNewForumTitle('');
        setNewForumDescription('');
        setForumImage(null);
        setForumDocument(null);
        await fetchForums();
      } else {
        // Si el error es por correo, igual mostrar éxito pero advertir en consola
        const data = await response.json().catch(() => ({}));
        if (data && data.error && String(data.error).includes('534-5.7.9')) {
          toast.success('Foro creado (no se pudo notificar por correo)');
          console.warn('Foro creado pero falló el correo:', data.error);
          setNewForumTitle('');
          setNewForumDescription('');
          setForumImage(null);
          setForumDocument(null);
          await fetchForums();
        } else {
          toast.error('Error al crear el foro');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el foro');
    } finally {
      setIsCreatingForum(false);
    }
  };

  // Función para obtener posts de un foro
  const fetchPosts = async (forumId: number) => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`/api/forums/${forumId}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Función para crear post
  const handleCreatePost = async (forumId: number) => {
    if (!newPostContent.trim() || !user?.id) {
      toast.error('Por favor escribe un mensaje');
      return;
    }

    setIsUploadingPost(true);
    try {
      const formData = new FormData();
      formData.append('content', newPostContent);
      formData.append('foroId', forumId.toString());

      if (selectedImage) formData.append('image', selectedImage);
      if (selectedAudio) formData.append('audio', selectedAudio);
      if (selectedVideo) formData.append('video', selectedVideo);

      const response = await fetch(`/api/forums/posts`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Post publicado con éxito');
        setNewPostContent('');
        setSelectedImage(null);
        setSelectedAudio(null);
        setSelectedVideo(null);
        await fetchPosts(forumId);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al publicar');
      }
    } catch (error) {
      toast.error('Error al publicar el post');
      console.error(error);
    } finally {
      setIsUploadingPost(false);
    }
  };

  // Seleccionar foro y cargar posts
  const handleSelectForum = (forumId: number) => {
    setSelectedForum(forumId);
    void fetchPosts(forumId);
  };

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

          {/* Lista desplegable con Portal */}
          {isOpen && (
            <Portal>
              {/* Overlay para cerrar al hacer clic afuera */}
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
              />

              <div
                className="fixed z-[9999] overflow-hidden rounded-md border border-cyan-500/50 bg-slate-900 shadow-2xl"
                style={{
                  top: '300px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '90%',
                  maxWidth: '500px',
                }}
              >
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
            </Portal>
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
                    onClick={() => setActiveTab('en-vivo')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'en-vivo'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Clases en Vivo
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
                    onClick={() => setActiveTab('foros')}
                    className={`border-b-2 pb-4 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'foros'
                        ? 'border-cyan-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Foros{' '}
                    <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                      {forums.length}
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
                      {Array.isArray(studentProjects)
                        ? studentProjects.length
                        : 0}
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
                  <div className="animate-in fade-in space-y-8 duration-500">
                    {/* Sobre el educador */}
                    {course.instructorProfileImageKey && (
                      <div className="group relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-8 shadow-xl transition-all duration-300 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/20">
                        {/* Efecto de brillo en hover */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                        <h2 className="mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-3xl font-bold text-transparent">
                          Sobre el educador
                        </h2>

                        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
                          {/* Foto del educador con efecto */}
                          <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 opacity-75 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                            <Image
                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.instructorProfileImageKey}`}
                              alt={course.instructorName}
                              width={128}
                              height={128}
                              className="relative h-32 w-32 rounded-full object-cover ring-4 ring-cyan-500/50 transition-transform duration-300 group-hover:scale-105"
                              quality={70}
                            />
                          </div>

                          {/* Información del educador */}
                          <div className="relative flex-1">
                            <h3 className="text-2xl font-bold text-white">
                              {course.instructorName}
                            </h3>
                            {course.instructorProfesion && (
                              <p className="mt-2 text-base font-semibold text-cyan-400">
                                {course.instructorProfesion}
                              </p>
                            )}
                            {course.instructorDescripcion && (
                              <p className="mt-4 leading-relaxed text-white/80">
                                {course.instructorDescripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <h2 className="text-2xl font-bold text-white">
                      Clase en Vivo
                    </h2>

                    {/* Clases agendadas */}
                    <div className="space-y-4">
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
                {/* Clases en Vivo Tab */}
                {activeTab === 'en-vivo' && (
                  <div className="animate-in fade-in space-y-8 duration-500">
                    {/* Sobre el educador */}
                    {course.instructorProfileImageKey && (
                      <div className="group relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-8 shadow-xl transition-all duration-300 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/20">
                        {/* Efecto de brillo en hover */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                        <h2 className="mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-3xl font-bold text-transparent">
                          Sobre el educador
                        </h2>

                        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
                          {/* Foto del educador con efecto */}
                          <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 opacity-75 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                            <Image
                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.instructorProfileImageKey}`}
                              alt={course.instructorName}
                              width={128}
                              height={128}
                              className="relative h-32 w-32 rounded-full object-cover ring-4 ring-cyan-500/50 transition-transform duration-300 group-hover:scale-105"
                              quality={70}
                            />
                          </div>

                          {/* Información del educador */}
                          <div className="relative flex-1">
                            <h3 className="text-2xl font-bold text-white">
                              {course.instructorName}
                            </h3>
                            {course.instructorProfesion && (
                              <p className="mt-2 text-base font-semibold text-cyan-400">
                                {course.instructorProfesion}
                              </p>
                            )}
                            {course.instructorDescripcion && (
                              <p className="mt-4 leading-relaxed text-white/80">
                                {course.instructorDescripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <h2 className="text-2xl font-bold text-white">
                      Clases Agendadas
                    </h2>

                    {/* Clases agendadas */}
                    <div className="space-y-4">
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
                {/* Foros Tab */}
                {activeTab === 'foros' && (
                  <div className="animate-in fade-in duration-500">
                    {/* Formulario de creación de foro siempre visible */}
                    <div className="mb-6 rounded-2xl border border-cyan-700/30 bg-[#101c2b] p-6 shadow">
                      <h2 className="mb-1 text-xl font-bold text-cyan-300">
                        Foro del curso
                      </h2>
                      <p className="mb-4 text-sm text-white/60">
                        {forums.length} foros · Crea nuevas conversaciones
                      </p>
                      <div className="relative space-y-3">
                        <textarea
                          placeholder="Título del nuevo foro..."
                          value={newForumTitle}
                          onChange={(e) => setNewForumTitle(e.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-xl border border-cyan-700/20 bg-[#0d1726] px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none"
                          style={{ minHeight: '60px' }}
                        />

                        <textarea
                          placeholder="Descripción del foro (opcional)..."
                          value={newForumDescription}
                          onChange={(e) =>
                            setNewForumDescription(e.target.value)
                          }
                          rows={2}
                          className="w-full resize-none rounded-xl border border-cyan-700/20 bg-[#0d1726] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none"
                          style={{ minHeight: '50px' }}
                        />

                        {/* Inputs de media para foro */}
                        <div className="grid grid-cols-2 gap-3">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setForumImage(e.target.files?.[0] || null)
                              }
                              className="hidden"
                            />
                            <div className="rounded-lg border border-dashed border-cyan-700/30 bg-slate-900/50 p-3 text-center transition hover:border-cyan-500 hover:bg-slate-900">
                              <div className="text-lg">□</div>
                              <div className="text-xs text-white/70">
                                {forumImage
                                  ? forumImage.name.slice(0, 15) + '...'
                                  : 'Portada'}
                              </div>
                            </div>
                          </label>

                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={(e) =>
                                setForumDocument(e.target.files?.[0] || null)
                              }
                              className="hidden"
                            />
                            <div className="rounded-lg border border-dashed border-cyan-700/30 bg-slate-900/50 p-3 text-center transition hover:border-cyan-500 hover:bg-slate-900">
                              <div className="text-lg">📄</div>
                              <div className="text-xs text-white/70">
                                {forumDocument
                                  ? forumDocument.name.slice(0, 15) + '...'
                                  : 'Documento'}
                              </div>
                            </div>
                          </label>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2">
                          {(forumImage || forumDocument) && (
                            <button
                              onClick={() => {
                                setForumImage(null);
                                setForumDocument(null);
                              }}
                              className="px-3 py-2 text-xs text-white/60 hover:text-white transition-colors"
                            >
                              Limpiar archivos
                            </button>
                          )}
                          <Button
                            onClick={async () => {
                              if (!newForumTitle.trim()) return;
                              await handleCreateForum();
                              setNewForumTitle('');
                              setNewForumDescription('');
                            }}
                            disabled={isCreatingForum || !newForumTitle.trim()}
                            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2 text-base font-semibold hover:bg-cyan-600"
                          >
                            {isCreatingForum ? 'Creando...' : '+ Nuevo Foro'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Layout de dos columnas */}
                    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                      {/* Columna izquierda - Lista de foros */}
                      <div className="space-y-4">
                        {/* Lista de foros */}
                        <div className="space-y-2">
                          {forums.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/20 bg-slate-900/30 p-8 text-center">
                              <p className="text-sm text-white/60">
                                No hay foros aún
                              </p>
                            </div>
                          ) : (
                            forums.map((forum) => (
                              <button
                                key={forum.id}
                                onClick={() => handleSelectForum(forum.id)}
                                className={`w-full rounded-2xl border border-cyan-700/30 bg-[#101c2b] p-5 text-left shadow transition-all duration-200 hover:border-cyan-400/60 hover:bg-[#14243a] ${
                                  selectedForum === forum.id
                                    ? 'border-cyan-400 bg-[#16263b] shadow-cyan-500/10'
                                    : ''
                                }`}
                                style={{ marginBottom: '18px' }}
                              >
                                <div className="mb-2 flex items-center gap-4">
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-700 to-cyan-400 text-lg font-bold text-white">
                                    {forum.title?.[0]?.toUpperCase() || '?'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="block truncate text-base font-semibold text-cyan-300">
                                      {forum.title}
                                    </span>
                                    {forum.description && (
                                      <span className="block truncate text-xs text-white/50">
                                        {forum.description}
                                      </span>
                                    )}
                                  </div>
                                  <span className="ml-auto text-xs whitespace-nowrap text-white/40">
                                    {forum.createdAt
                                      ? new Date(
                                          forum.createdAt
                                        ).toLocaleDateString('es-ES', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : ''}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-4 text-xs text-cyan-400">
                                  <span>
                                    {forum._count?.posts || 0} comentarios
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Columna derecha - Contenido del foro */}
                      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
                        {!selectedForum ? (
                          <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
                            <div className="mb-4 h-20 w-20 rounded-full bg-white/5" />
                            <h3 className="mb-2 text-xl font-bold text-white">
                              Selecciona un foro
                            </h3>
                            <p className="text-sm text-white/50">
                              Elige un foro de la lista para ver las
                              conversaciones
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Header del foro */}
                            <div className="border-b border-white/10 pb-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h2 className="mb-1 text-2xl font-bold text-white">
                                    {
                                      forums.find((f) => f.id === selectedForum)
                                        ?.title
                                    }
                                  </h2>
                                  <p className="text-sm text-white/50">
                                    {posts.length}{' '}
                                    {posts.length === 1 ? 'post' : 'posts'}
                                  </p>
                                </div>
                                {forums.find((f) => f.id === selectedForum)
                                  ?.coverImageKey && (
                                  <button
                                    onClick={() =>
                                      setLightboxImage(
                                        `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${
                                          forums.find(
                                            (f) => f.id === selectedForum
                                          )?.coverImageKey
                                        }`
                                      )
                                    }
                                    className="group relative overflow-hidden rounded-lg border border-cyan-700/30 hover:border-cyan-500/60 transition-colors flex-shrink-0"
                                  >
                                    <Image
                                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${
                                        forums.find(
                                          (f) => f.id === selectedForum
                                        )?.coverImageKey
                                      }`}
                                      alt="Imagen del foro"
                                      className="h-24 w-24 object-cover group-hover:opacity-80 transition-opacity"
                                      width={96}
                                      height={96}
                                      loading="lazy"
                                      onError={(e) => {
                                        console.error(
                                          'Error cargando imagen del foro'
                                        );
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                                      <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Formulario de crear post con media */}
                            <div className="rounded-lg border border-cyan-700/30 bg-[#0d1726] p-4">
                              <textarea
                                placeholder="Comparte tu pensamiento, pregunta o avance..."
                                value={newPostContent}
                                onChange={(e) =>
                                  setNewPostContent(e.target.value)
                                }
                                rows={3}
                                className="mb-3 w-full resize-none rounded-lg border border-cyan-700/20 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none"
                              />

                              {/* Inputs de media */}
                              <div className="mb-4 grid grid-cols-3 gap-2">
                                {/* Imagen */}
                                <label className="group cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      setSelectedImage(
                                        e.target.files?.[0] || null
                                      )
                                    }
                                    className="hidden"
                                  />
                                  <div className="rounded-lg border border-dashed border-cyan-700/30 bg-slate-900/50 p-3 text-center transition hover:border-cyan-500 hover:bg-slate-900">
                                    <div className="text-lg">□</div>
                                    <div className="text-xs text-white/70">
                                      {selectedImage
                                        ? selectedImage.name.slice(0, 15) +
                                          '...'
                                        : 'Imagen'}
                                    </div>
                                    <div className="text-xs text-white/40">
                                      Máx 5MB
                                    </div>
                                  </div>
                                </label>

                                {/* Audio */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowAudioRecorder(!showAudioRecorder)
                                    }
                                    className="group cursor-pointer w-full"
                                  >
                                    <div className="rounded-lg border border-dashed border-cyan-700/30 bg-slate-900/50 p-3 text-center transition hover:border-cyan-500 hover:bg-slate-900">
                                      <div className="text-lg">♪</div>
                                      <div className="text-xs text-white/70">
                                        {selectedAudio
                                          ? selectedAudio.name.slice(0, 15) +
                                            '...'
                                          : 'Audio'}
                                      </div>
                                      <div className="text-xs text-white/40">
                                        Máx 50MB
                                      </div>
                                    </div>
                                  </button>

                                  {/* Input de archivo oculto */}
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) =>
                                      setSelectedAudio(
                                        e.target.files?.[0] || null
                                      )
                                    }
                                    className="hidden"
                                    id="audio-upload-input"
                                  />

                                  {/* Menú desplegable con grabador */}
                                  {showAudioRecorder && (
                                    <div className="absolute bottom-full right-0 z-50 mb-2 w-80 rounded-lg border border-cyan-700/30 bg-slate-900 p-4 shadow-lg">
                                      <div className="space-y-3">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            document
                                              .getElementById(
                                                'audio-upload-input'
                                              )
                                              ?.click();
                                            setShowAudioRecorder(false);
                                          }}
                                          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                        >
                                          📁 Subir archivo
                                        </button>

                                        <AudioRecorder
                                          onAudioSelect={(file) => {
                                            setSelectedAudio(file);
                                            setShowAudioRecorder(false);
                                          }}
                                          onClose={() =>
                                            setShowAudioRecorder(false)
                                          }
                                        />

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setShowAudioRecorder(false)
                                          }
                                          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                                        >
                                          Cerrar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Video */}
                                <label className="group cursor-pointer">
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) =>
                                      setSelectedVideo(
                                        e.target.files?.[0] || null
                                      )
                                    }
                                    className="hidden"
                                  />
                                  <div className="rounded-lg border border-dashed border-cyan-700/30 bg-slate-900/50 p-3 text-center transition hover:border-cyan-500 hover:bg-slate-900">
                                    <div className="text-lg">▶</div>
                                    <div className="text-xs text-white/70">
                                      {selectedVideo
                                        ? selectedVideo.name.slice(0, 15) +
                                          '...'
                                        : 'Video'}
                                    </div>
                                    <div className="text-xs text-white/40">
                                      Máx 200MB
                                    </div>
                                  </div>
                                </label>
                              </div>

                              {/* Resumen de archivos seleccionados */}
                              {(selectedImage ||
                                selectedAudio ||
                                selectedVideo) && (
                                <div className="mb-3 rounded-lg bg-cyan-700/10 p-2 text-xs text-cyan-300">
                                  <div className="font-semibold">
                                    Archivos seleccionados:
                                  </div>
                                  {selectedImage && (
                                    <div>🖼️ {selectedImage.name}</div>
                                  )}
                                  {selectedAudio && (
                                    <div>🎙️ {selectedAudio.name}</div>
                                  )}
                                  {selectedVideo && (
                                    <div>🎬 {selectedVideo.name}</div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-white/40">
                                  {newPostContent.length}
                                </span>
                                <Button
                                  onClick={() =>
                                    handleCreatePost(selectedForum!)
                                  }
                                  disabled={
                                    !newPostContent.trim() || isUploadingPost
                                  }
                                  size="sm"
                                  className="bg-cyan-500 hover:bg-cyan-600"
                                >
                                  {isUploadingPost
                                    ? 'Subiendo...'
                                    : 'Publicar Post'}
                                </Button>
                              </div>
                            </div>

                            {/* Lista de posts */}
                            <div className="space-y-4">
                              {isLoadingPosts ? (
                                <div className="flex items-center justify-center py-12">
                                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                                </div>
                              ) : posts.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/30 p-8 text-center">
                                  <p className="text-sm text-white/60">
                                    No hay posts aún. ¡Sé el primero en
                                    compartir!
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {posts.map((post) => {
                                    const userName =
                                      typeof post.userId === 'object'
                                        ? post.userId?.name
                                        : post.user?.name;
                                    const userInitial =
                                      userName?.[0]?.toUpperCase() || '?';

                                    return (
                                      <div
                                        key={post.id}
                                        className="mb-6 rounded-2xl border border-cyan-700/30 bg-[#101c2b] p-6 shadow hover:border-cyan-700/60 transition-all"
                                      >
                                        <div className="flex gap-4">
                                          {/* Avatar */}
                                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-700 to-cyan-400 text-sm font-bold text-white">
                                            {userInitial}
                                          </div>

                                          {/* Content */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-base font-semibold text-cyan-300">
                                                {userName || 'Usuario'}
                                              </span>
                                              <span className="text-xs text-white/40">
                                                {post.createdAt
                                                  ? new Date(
                                                      post.createdAt
                                                    ).toLocaleDateString(
                                                      'es-ES',
                                                      {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                      }
                                                    )
                                                  : ''}
                                              </span>
                                            </div>

                                            <p className="mt-2 text-sm leading-relaxed text-white/90">
                                              {post.content}
                                            </p>

                                            {/* Mostrar media si existe */}
                                            {(post.imageKey ||
                                              post.audioKey ||
                                              post.videoKey) && (
                                              <div className="mt-6 space-y-4">
                                                {/* Imagen y Video lado a lado */}
                                                {(post.imageKey ||
                                                  post.videoKey) && (
                                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {/* Imagen - Marco premium */}
                                                    {post.imageKey && (
                                                      <button
                                                        onClick={() =>
                                                          setLightboxImage(
                                                            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.imageKey}`
                                                          )
                                                        }
                                                        className="group relative overflow-hidden rounded-lg border border-cyan-700/35 shadow-lg shadow-black/50 transition-all duration-300 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30"
                                                      >
                                                        <Image
                                                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.imageKey}`}
                                                          alt="Imagen del post"
                                                          className="h-64 w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                          loading="lazy"
                                                          width={500}
                                                          height={256}
                                                          onError={(e) => {
                                                            console.error(
                                                              'Error cargando imagen:',
                                                              e.currentTarget
                                                                .src
                                                            );
                                                          }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-300">
                                                          <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        </div>
                                                      </button>
                                                    )}
                                                    {/* Video */}
                                                    {post.videoKey && (
                                                      <div className="overflow-hidden rounded-lg border border-cyan-700/35 bg-black shadow-lg shadow-black/50 transition-all duration-300 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30">
                                                        <video
                                                          controls
                                                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.videoKey}`}
                                                          className="h-64 w-full object-cover"
                                                          onError={() =>
                                                            console.error(
                                                              'Error cargando video:',
                                                              post.videoKey
                                                            )
                                                          }
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                                {/* Audio - Ancho completo debajo */}
                                                {post.audioKey && (
                                                  <div className="flex items-center gap-3 rounded-lg border border-cyan-700/35 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60 p-4 shadow-md shadow-black/30 transition-all duration-300 hover:border-cyan-400/60 hover:from-slate-900/80 hover:to-slate-900/80">
                                                    <Music className="h-5 w-5 flex-shrink-0 text-cyan-400/80" />
                                                    <audio
                                                      controls
                                                      className="flex-1 h-8"
                                                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.audioKey}`}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {/* Acciones */}
                                            <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                                              <div className="flex items-center gap-2">
                                                <button
                                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                                  title="Me gusta"
                                                >
                                                  <ThumbsUp className="h-5 w-5" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    const isExpanded =
                                                      expandedPosts.has(
                                                        post.id
                                                      );
                                                    if (isExpanded) {
                                                      expandedPosts.delete(
                                                        post.id
                                                      );
                                                    } else {
                                                      expandedPosts.add(
                                                        post.id
                                                      );
                                                    }
                                                    setExpandedPosts(
                                                      new Set(expandedPosts)
                                                    );
                                                  }}
                                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white relative"
                                                  title="Comentarios"
                                                >
                                                  <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-400">
                                                    {postReplies[post.id]
                                                      ?.length || 0}
                                                  </span>
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setReplyingToPostId(
                                                      (prev) => {
                                                        const newSet = new Set(
                                                          prev
                                                        );
                                                        if (
                                                          newSet.has(post.id)
                                                        ) {
                                                          newSet.delete(
                                                            post.id
                                                          );
                                                        } else {
                                                          newSet.add(post.id);
                                                          setReplyMessage('');
                                                        }
                                                        return newSet;
                                                      }
                                                    );
                                                  }}
                                                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                                  title="Responder"
                                                >
                                                  <CornerDownLeft className="h-5 w-5" />
                                                </button>
                                              </div>

                                              {/* Respuestas colapsables - Diseño profesional */}
                                              <div className="mt-3 border-t border-gray-800 pt-3">
                                                {!expandedPosts.has(post.id) ? (
                                                  <button
                                                    onClick={() => {
                                                      expandedPosts.add(
                                                        post.id
                                                      );
                                                      setExpandedPosts(
                                                        new Set(expandedPosts)
                                                      );
                                                    }}
                                                    className="text-sm text-gray-400 hover:text-cyan-300 transition-colors"
                                                  >
                                                    Ver{' '}
                                                    {postReplies[post.id]
                                                      ?.length || 0}{' '}
                                                    respuesta
                                                    {(postReplies[post.id]
                                                      ?.length || 0) > 1
                                                      ? 's'
                                                      : ''}
                                                  </button>
                                                ) : (
                                                  <div className="space-y-3">
                                                    <button
                                                      onClick={() => {
                                                        expandedPosts.delete(
                                                          post.id
                                                        );
                                                        setExpandedPosts(
                                                          new Set(expandedPosts)
                                                        );
                                                      }}
                                                      className="text-sm text-gray-400 hover:text-cyan-300 transition-colors"
                                                    >
                                                      Ocultar respuestas
                                                    </button>
                                                    {postReplies[post.id]?.map(
                                                      (reply) => {
                                                        const replyUserName =
                                                          typeof reply.userId ===
                                                          'object'
                                                            ? reply.userId?.name
                                                            : 'Usuario';
                                                        const replyUserInitial =
                                                          replyUserName?.[0]?.toUpperCase() ||
                                                          '?';
                                                        return (
                                                          <div
                                                            key={reply.id}
                                                            className="ml-6 rounded-xl bg-gray-800/50 p-4"
                                                          >
                                                            <div className="flex items-start gap-3">
                                                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-700 to-cyan-400 text-xs font-bold text-white">
                                                                {
                                                                  replyUserInitial
                                                                }
                                                              </div>
                                                              <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                  <span className="text-sm font-semibold text-white">
                                                                    {
                                                                      replyUserName
                                                                    }
                                                                  </span>
                                                                  <span className="text-xs text-gray-500">
                                                                    {reply.createdAt
                                                                      ? new Date(
                                                                          reply.createdAt
                                                                        ).toLocaleString(
                                                                          'es-ES',
                                                                          {
                                                                            day: '2-digit',
                                                                            month:
                                                                              'short',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute:
                                                                              '2-digit',
                                                                          }
                                                                        )
                                                                      : ''}
                                                                  </span>
                                                                </div>
                                                                {reply.content && (
                                                                  <p className="mt-2 text-sm text-gray-300">
                                                                    {
                                                                      reply.content
                                                                    }
                                                                  </p>
                                                                )}
                                                                {(reply.imageKey ||
                                                                  reply.videoKey ||
                                                                  reply.audioKey) && (
                                                                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                                    {(reply.imageKey ||
                                                                      reply.videoKey) && (
                                                                      <>
                                                                        {reply.imageKey && (
                                                                          <button
                                                                            className="relative h-40 w-full rounded-lg border border-cyan-700/40 overflow-hidden bg-gray-900 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer group"
                                                                            onClick={() =>
                                                                              setLightboxImage(
                                                                                `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.imageKey}`
                                                                              )
                                                                            }
                                                                          >
                                                                            <Image
                                                                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.imageKey}`}
                                                                              alt="Respuesta"
                                                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                              width={
                                                                                500
                                                                              }
                                                                              height={
                                                                                160
                                                                              }
                                                                            />
                                                                          </button>
                                                                        )}
                                                                        {reply.videoKey && (
                                                                          <div className="relative h-40 w-full rounded-lg border border-cyan-700/40 overflow-hidden bg-gray-900 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
                                                                            <video
                                                                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.videoKey}`}
                                                                              className="w-full h-full object-cover"
                                                                              controls
                                                                            />
                                                                          </div>
                                                                        )}
                                                                      </>
                                                                    )}
                                                                    {reply.audioKey && (
                                                                      <div className="col-span-1 sm:col-span-2">
                                                                        <audio
                                                                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.audioKey}`}
                                                                          className="w-full rounded-lg border border-cyan-700/40 bg-gray-900"
                                                                          controls
                                                                        />
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        );
                                                      }
                                                    )}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Formulario para responder */}
                                              {replyingToPostId.has(
                                                post.id
                                              ) && (
                                                <div className="mt-4 space-y-3 pl-4 border-l-2 border-cyan-700/30">
                                                  <textarea
                                                    className="w-full rounded-xl border border-cyan-700/30 bg-slate-900 p-3 text-sm text-white placeholder:text-gray-500 resize-none focus:border-primary focus:outline-none"
                                                    placeholder="Escribe tu respuesta..."
                                                    value={
                                                      replyMessage[post.id] ||
                                                      ''
                                                    }
                                                    onChange={(e) =>
                                                      setReplyMessage(
                                                        (prev) => ({
                                                          ...prev,
                                                          [post.id]:
                                                            e.target.value,
                                                        })
                                                      )
                                                    }
                                                    rows={2}
                                                    autoFocus
                                                  />

                                                  {/* Audio Recorder para replies */}
                                                  {showReplyAudioRecorder.has(
                                                    post.id
                                                  ) && (
                                                    <div className="mb-2">
                                                      <AudioRecorder
                                                        onAudioSelect={(
                                                          file
                                                        ) => {
                                                          setReplyAudio(
                                                            (prev) => ({
                                                              ...prev,
                                                              [post.id]: file,
                                                            })
                                                          );
                                                          setShowReplyAudioRecorder(
                                                            (prev) =>
                                                              new Set(
                                                                [
                                                                  ...prev,
                                                                ].filter(
                                                                  (id) =>
                                                                    id !==
                                                                    post.id
                                                                )
                                                              )
                                                          );
                                                        }}
                                                        onClose={() =>
                                                          setShowReplyAudioRecorder(
                                                            (prev) =>
                                                              new Set(
                                                                [
                                                                  ...prev,
                                                                ].filter(
                                                                  (id) =>
                                                                    id !==
                                                                    post.id
                                                                )
                                                              )
                                                          )
                                                        }
                                                      />
                                                    </div>
                                                  )}

                                                  {/* Media previews */}
                                                  {(replyImage[post.id] ||
                                                    replyVideo[post.id] ||
                                                    replyAudio[post.id]) && (
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                      {replyImage[post.id] && (
                                                        <div className="relative overflow-hidden rounded-lg border border-cyan-700/40">
                                                          <Image
                                                            src={URL.createObjectURL(
                                                              replyImage[
                                                                post.id
                                                              ]
                                                            )}
                                                            alt="Preview"
                                                            className="h-40 w-full object-cover"
                                                            width={500}
                                                            height={160}
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setReplyImage(
                                                                (prev) => {
                                                                  const updated =
                                                                    { ...prev };
                                                                  delete updated[
                                                                    post.id
                                                                  ];
                                                                  return updated;
                                                                }
                                                              )
                                                            }
                                                            className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                                          >
                                                            <X className="h-4 w-4" />
                                                          </button>
                                                          <span className="absolute bottom-1 left-1 text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded">
                                                            {
                                                              replyImage[
                                                                post.id
                                                              ].name
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                      {replyVideo[post.id] && (
                                                        <div className="relative overflow-hidden rounded-lg border border-cyan-700/40 bg-black">
                                                          <video
                                                            src={URL.createObjectURL(
                                                              replyVideo[
                                                                post.id
                                                              ]
                                                            )}
                                                            className="h-40 w-full object-cover"
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setReplyVideo(
                                                                (prev) => {
                                                                  const updated =
                                                                    { ...prev };
                                                                  delete updated[
                                                                    post.id
                                                                  ];
                                                                  return updated;
                                                                }
                                                              )
                                                            }
                                                            className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                                          >
                                                            <X className="h-4 w-4" />
                                                          </button>
                                                          <span className="absolute bottom-1 left-1 text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded">
                                                            {
                                                              replyVideo[
                                                                post.id
                                                              ].name
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                      {replyAudio[post.id] && (
                                                        <div className="relative flex items-center gap-2 rounded-lg border border-cyan-700/40 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60 p-2">
                                                          <Music className="h-4 w-4 flex-shrink-0 text-cyan-400/80" />
                                                          <span className="flex-1 truncate text-xs font-semibold text-white">
                                                            {
                                                              replyAudio[
                                                                post.id
                                                              ].name
                                                            }
                                                          </span>
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setReplyAudio(
                                                                (prev) => {
                                                                  const updated =
                                                                    { ...prev };
                                                                  delete updated[
                                                                    post.id
                                                                  ];
                                                                  return updated;
                                                                }
                                                              )
                                                            }
                                                            className="rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                                          >
                                                            <X className="h-3 w-3" />
                                                          </button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}

                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const input =
                                                          document.createElement(
                                                            'input'
                                                          );
                                                        input.type = 'file';
                                                        input.accept =
                                                          'audio/*';
                                                        input.onchange = (
                                                          e
                                                        ) => {
                                                          const file = (
                                                            e.target as HTMLInputElement
                                                          ).files?.[0];
                                                          if (file)
                                                            setReplyAudio(
                                                              (prev) => ({
                                                                ...prev,
                                                                [post.id]: file,
                                                              })
                                                            );
                                                        };
                                                        input.click();
                                                      }}
                                                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                                      title="Subir audio"
                                                    >
                                                      <Mic className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        setShowReplyAudioRecorder(
                                                          (prev) =>
                                                            prev.has(post.id)
                                                              ? new Set(
                                                                  [
                                                                    ...prev,
                                                                  ].filter(
                                                                    (id) =>
                                                                      id !==
                                                                      post.id
                                                                  )
                                                                )
                                                              : new Set([
                                                                  ...prev,
                                                                  post.id,
                                                                ])
                                                        )
                                                      }
                                                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                                      title="Grabar audio"
                                                    >
                                                      <Music className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const input =
                                                          document.createElement(
                                                            'input'
                                                          );
                                                        input.type = 'file';
                                                        input.accept =
                                                          'image/*';
                                                        input.onchange = (
                                                          e
                                                        ) => {
                                                          const file = (
                                                            e.target as HTMLInputElement
                                                          ).files?.[0];
                                                          if (file)
                                                            setReplyImage(
                                                              (prev) => ({
                                                                ...prev,
                                                                [post.id]: file,
                                                              })
                                                            );
                                                        };
                                                        input.click();
                                                      }}
                                                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                                      title="Adjuntar imagen"
                                                    >
                                                      <ImageIcon className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const input =
                                                          document.createElement(
                                                            'input'
                                                          );
                                                        input.type = 'file';
                                                        input.accept =
                                                          'video/*';
                                                        input.onchange = (
                                                          e
                                                        ) => {
                                                          const file = (
                                                            e.target as HTMLInputElement
                                                          ).files?.[0];
                                                          if (file)
                                                            setReplyVideo(
                                                              (prev) => ({
                                                                ...prev,
                                                                [post.id]: file,
                                                              })
                                                            );
                                                        };
                                                        input.click();
                                                      }}
                                                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                                      title="Adjuntar video"
                                                    >
                                                      <Video className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                      onClick={() =>
                                                        handleCreateReply(
                                                          post.id
                                                        )
                                                      }
                                                      disabled={
                                                        (!(
                                                          replyMessage[
                                                            post.id
                                                          ] || ''
                                                        ).trim() &&
                                                          !replyAudio[
                                                            post.id
                                                          ] &&
                                                          !replyImage[
                                                            post.id
                                                          ] &&
                                                          !replyVideo[
                                                            post.id
                                                          ]) ||
                                                        isSubmittingReply
                                                      }
                                                      className="ml-auto rounded bg-cyan-700 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
                                                    >
                                                      {isSubmittingReply ? (
                                                        <>
                                                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent inline-block mr-1" />
                                                          Enviando...
                                                        </>
                                                      ) : (
                                                        'Responder'
                                                      )}
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setReplyingToPostId(
                                                          (prev) => {
                                                            const newSet =
                                                              new Set(prev);
                                                            newSet.delete(
                                                              post.id
                                                            );
                                                            return newSet;
                                                          }
                                                        );
                                                        setReplyMessage('');
                                                      }}
                                                      className="rounded border border-white/20 px-3 py-1 text-xs text-white/60 transition-colors hover:text-white"
                                                    >
                                                      Cancelar
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modal para crear foro */}
                    {/* El modal de crear foro ha sido eliminado, ahora el formulario es siempre visible arriba */}
                  </div>
                )}
                {/* Proyectos Tab */}
                {activeTab === 'proyectos' && (
                  <div className="animate-in fade-in duration-500">
                    <h2 className="mb-6 text-2xl font-bold text-white">
                      Proyectos de Estudiantes
                    </h2>
                    {loadingProjects ? (
                      <div className="text-white/60">Cargando proyectos...</div>
                    ) : (
                      <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {Array.isArray(studentProjects) &&
                          studentProjects.length > 0 ? (
                            studentProjects.map((project) => (
                              <div
                                key={project.id}
                                className="group rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-cyan-900/30 to-cyan-950/30 p-6 shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-cyan-400 hover:shadow-2xl"
                              >
                                <div className="mb-4 flex items-center gap-4">
                                  {project.cover_image_key && (
                                    <Image
                                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.cover_image_key}`}
                                      alt={project.name}
                                      width={64}
                                      height={64}
                                      className="h-16 w-16 rounded-xl border border-cyan-500/30 object-cover shadow"
                                      quality={60}
                                    />
                                  )}
                                  <div>
                                    <h3 className="mb-1 text-xl font-bold text-cyan-300">
                                      {project.name}
                                    </h3>
                                    <span className="inline-block rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                                      {project.type_project}
                                    </span>
                                  </div>
                                </div>
                                <div className="mb-2 flex flex-col gap-1">
                                  <span className="text-xs text-cyan-400">
                                    Estudiante:
                                  </span>
                                  <span className="text-xs font-semibold text-white/80">
                                    {project.studentName ||
                                      project.users_name ||
                                      project.user?.name ||
                                      project.userId}
                                  </span>
                                  {(project.studentEmail ||
                                    project.users_email ||
                                    project.user?.email) && (
                                    <span className="text-xs text-cyan-300">
                                      {project.studentEmail ||
                                        project.users_email ||
                                        project.user?.email}
                                    </span>
                                  )}
                                </div>
                                <button
                                  className="mt-4 w-full rounded bg-cyan-500/20 px-4 py-2 font-semibold text-cyan-300 transition hover:bg-cyan-500/40 hover:text-white"
                                  onClick={() => setSelectedProject(project)}
                                >
                                  Ver más
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full text-white/60">
                              {loadingProjects
                                ? 'Cargando proyectos...'
                                : 'No hay proyectos de estudiantes para este curso o hubo un error al obtenerlos.'}
                            </div>
                          )}
                        </div>
                        {/* Modal de detalles del proyecto */}
                        {selectedProject && (
                          <Portal>
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                              <div
                                className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-slate-900 p-4 shadow-2xl sm:p-8"
                                style={{
                                  maxHeight: '90vh',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <button
                                  className="absolute top-4 right-4 text-cyan-400 hover:text-white"
                                  onClick={() => setSelectedProject(null)}
                                >
                                  ✕
                                </button>
                                <h3 className="mb-4 text-center text-2xl font-bold break-words text-cyan-300">
                                  {selectedProject.name}
                                </h3>
                                {/* Imagen y video juntos, una sola vez, lado a lado */}
                                {(selectedProject.cover_image_key ||
                                  selectedProject.cover_video_key) && (
                                  <div className="mb-6 flex w-full flex-row items-center justify-center gap-4">
                                    {selectedProject.cover_image_key && (
                                      <div className="flex flex-1 items-center justify-center">
                                        <Image
                                          src={
                                            selectedProject.cover_image_key.startsWith(
                                              'http'
                                            )
                                              ? selectedProject.cover_image_key
                                              : `https://s3.us-east-2.amazonaws.com/artiefy-upload/${selectedProject.cover_image_key}`
                                          }
                                          alt={selectedProject.name}
                                          width={400}
                                          height={240}
                                          className="max-h-60 w-full rounded-xl border border-cyan-500/20 object-contain shadow"
                                          style={{
                                            objectFit: 'contain',
                                            maxWidth: '100%',
                                          }}
                                          quality={70}
                                          unoptimized={selectedProject.cover_image_key.startsWith(
                                            'http'
                                          )}
                                        />
                                      </div>
                                    )}
                                    {selectedProject.cover_video_key && (
                                      <div className="flex flex-1 items-center justify-center">
                                        <video
                                          src={
                                            selectedProject.cover_video_key.startsWith(
                                              'http'
                                            )
                                              ? selectedProject.cover_video_key
                                              : `https://s3.us-east-2.amazonaws.com/artiefy-upload/${selectedProject.cover_video_key}`
                                          }
                                          controls
                                          className="max-h-60 w-full rounded-xl border border-cyan-500/20 object-contain shadow"
                                          style={{
                                            objectFit: 'contain',
                                            maxWidth: '100%',
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="font-semibold text-cyan-400">
                                    Tipo:
                                  </span>
                                  <span className="break-words text-cyan-200">
                                    {selectedProject.type_project}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <span className="font-semibold text-cyan-400">
                                    Estudiante:
                                  </span>
                                  <span className="ml-2 break-words text-cyan-200">
                                    {selectedProject.studentName ||
                                      selectedProject.users_name ||
                                      selectedProject.user?.name ||
                                      selectedProject.userId}
                                  </span>
                                  {(selectedProject.studentEmail ||
                                    selectedProject.users_email ||
                                    selectedProject.user?.email) && (
                                    <span className="ml-2 break-words text-cyan-300">
                                      {selectedProject.studentEmail ||
                                        selectedProject.users_email ||
                                        selectedProject.user?.email}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="flex-1 overflow-y-auto pr-1"
                                  style={{ minHeight: 0 }}
                                >
                                  <div className="mb-2">
                                    <span className="font-semibold text-cyan-400">
                                      Planteamiento:
                                    </span>
                                    <p
                                      className="break-words whitespace-pre-line text-white/80"
                                      style={{ wordBreak: 'break-word' }}
                                    >
                                      {selectedProject.planteamiento}
                                    </p>
                                  </div>
                                  <div className="mb-2">
                                    <span className="font-semibold text-cyan-400">
                                      Justificación:
                                    </span>
                                    <p
                                      className="break-words whitespace-pre-line text-white/80"
                                      style={{ wordBreak: 'break-word' }}
                                    >
                                      {selectedProject.justificacion}
                                    </p>
                                  </div>
                                  <div className="mb-2">
                                    <span className="font-semibold text-cyan-400">
                                      Objetivo general:
                                    </span>
                                    <p
                                      className="break-words whitespace-pre-line text-white/80"
                                      style={{ wordBreak: 'break-word' }}
                                    >
                                      {selectedProject.objetivo_general}
                                    </p>
                                  </div>
                                  <div className="mb-2 grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-xs text-cyan-400">
                                        Inicio:
                                      </span>
                                      <div className="text-xs break-words text-white/60">
                                        {selectedProject.fecha_inicio}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-xs text-cyan-400">
                                        Fin:
                                      </span>
                                      <div className="text-xs break-words text-white/60">
                                        {selectedProject.fecha_fin}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mb-2 flex flex-wrap gap-2">
                                    <span className="text-xs text-cyan-400">
                                      Horas/día:
                                    </span>
                                    <span className="text-xs break-words text-white/70">
                                      {selectedProject.horas_por_dia}
                                    </span>
                                    <span className="text-xs text-cyan-400">
                                      Total horas:
                                    </span>
                                    <span className="text-xs break-words text-white/70">
                                      {selectedProject.total_horas}
                                    </span>
                                    <span className="text-xs text-cyan-400">
                                      Días estimados:
                                    </span>
                                    <span className="text-xs break-words text-white/70">
                                      {selectedProject.dias_estimados}
                                    </span>
                                  </div>
                                  {selectedProject.public_comment && (
                                    <div className="mb-2">
                                      <span className="text-xs text-cyan-400">
                                        Comentario público:
                                      </span>
                                      <p
                                        className="text-xs break-words whitespace-pre-line text-white/60"
                                        style={{ wordBreak: 'break-word' }}
                                      >
                                        {selectedProject.public_comment}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Portal>
                        )}
                      </>
                    )}
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
                {/* ⬅️ VERIFICA QUE ESTE CIERRE ESTÉ AQUÍ */}
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

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <Image
            src={lightboxImage}
            alt="Imagen ampliada"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            width={1000}
            height={900}
          />
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
