'use client';
// By Jean
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { TrashIcon } from '@heroicons/react/24/solid';
import * as Tooltip from '@radix-ui/react-tooltip';
import { MessageCircle, Zap } from 'lucide-react';
import { HiMiniCpuChip } from 'react-icons/hi2';
import { IoClose } from 'react-icons/io5';
import { MdArrowBack } from 'react-icons/md';
import { ResizableBox } from 'react-resizable';
import { toast } from 'sonner';

import { useExtras } from '~/app/estudiantes/StudentContext';
import { Card } from '~/components/estudiantes/ui/card';
import { getOrCreateConversation } from '~/server/actions/estudiantes/chats/saveChat';
import { saveMessages } from '~/server/actions/estudiantes/chats/saveMessages';
import {
  createNewTicket,
  getOrCreateSuportChat,
  getUserOpenTicket,
  SaveTicketMessage,
} from '~/server/actions/estudiantes/chats/suportChatBot';

import { ChatList } from './ChatList';
import { ChatNavigation } from './ChatNavigation';
import { ChatMessages } from './StudentChat';

import '~/styles/chatmodal.css';
import 'react-resizable/css/styles.css';

interface StudentChatbotProps {
  className?: string;
  initialSearchQuery?: string;
  isAlwaysVisible?: boolean;
  showChat?: boolean;
  courseTitle?: string;
  onSearchComplete?: () => void;
  courseId?: number;
  isEnrolled?: boolean;
  initialSection?: 'tickets' | 'chatia' | 'projects';
}

interface ResizeData {
  size: {
    width: number;
    height: number;
  };
  handle: string;
}

// Define datos de curso recibidos desde IA/n8n (fuertemente tipado)
interface CourseData {
  id: number;
  title: string;
  modalidad?: string;
  modalidadId?: number;
}

// Tipos fuertes para la respuesta de n8n
interface N8nPayload {
  mensaje_inicial?: string;
  mensaje?: string;
  courses?: CourseData[];
  courseDescription?: string;
  courseId?: number;
  projectPrompt?: boolean;
  intent?: string;
  conversationId?: string | number;
  // NUEVO: posibles campos del borrador de proyecto
  projectName?: string;
  planteamiento?: string;
  justificacion?: string;
  objetivoGeneral?: string;
  objetivosEspecificos?: string[];
  actividades?: (string | { descripcion: string })[];
  categoryId?: number;
  typeProject?: string;
  pregunta_final?: string;
}

interface N8nApiResponse {
  n8nData?: N8nPayload;
  prompt?: string;
}

interface ProjectDraft {
  projectName: string;
  planteamiento: string;
  justificacion: string;
  objetivoGeneral: string;
  objetivosEspecificos: string[];
  actividades: { descripcion: string }[];
  categoryId?: number;
  typeProject?: string;
  projectStep?: string; // optional: paso actual del asistente (evita uso de `any`)
}

interface ProjectEnvelope {
  version?: string;
  mode?: string;
  step?: number;
  domain?: string;
  course?: { id?: number | string | null; title?: string | null };
  data?: Record<string, unknown>;
  next_step?: number | null;
  ask_user?: string;
  intent?: string;
  notes?: string;
}

// Tipos
export interface ChatMessage {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  buttons?: { label: string; action: string }[];
  coursesData?: CourseData[];
}

const StudentChatbot: React.FC<StudentChatbotProps> = ({
  className,
  initialSearchQuery = '',
  isAlwaysVisible = false,
  showChat = false,
  onSearchComplete,
  courseTitle,
  courseId,
  isEnrolled,
  initialSection = 'chatia',
}) => {
  const [activeSection, setActiveSection] = useState<
    'tickets' | 'chatia' | 'projects'
  >(initialSection);
  const [isOpen, setIsOpen] = useState(showChat);
  const [isDesktop, setIsDesktop] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: Date.now(),
      text: '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
      sender: 'bot',
      buttons: [
        { label: '📚 Crear Proyecto', action: 'new_project' },
        { label: '💬 Nueva Idea', action: 'new_idea' },
        { label: '🛠 Soporte Técnico', action: 'contact_support' },
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingQuery, setProcessingQuery] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: 400,
    height: 500,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchRequestInProgress = useRef(false);

  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const initialSearchDone = useRef(false);

  // El estado activeSection ya está definido arriba

  const [chatMode, setChatMode] = useState<{
    idChat: number | null;
    status: boolean;
    curso_title: string;
    type?: 'ticket' | 'chat' | 'project';
  }>({ idChat: null, status: true, curso_title: '', type: 'chat' });
  const conversationOwnerRef = useRef<string>('');

  // Saber si el chatlist esta abierto
  const [_showChatList, setShowChatList] = useState(false);

  const chatModeRef = useRef(chatMode);
  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  const [idea, setIdea] = useState<{ selected: boolean; idea: string }>({
    selected: false,
    idea: '',
  });

  const [isHovered, setIsHovered] = useState(false);

  const { show } = useExtras();

  const ideaRef = useRef(idea);
  useEffect(() => {
    conversationOwnerRef.current = user?.id ?? '';
  }, [user?.id]);
  useEffect(() => {
    ideaRef.current = idea;
  }, [idea]);

  // Añade los estados necesarios para el flujo n8n
  const [_n8nCourses, setN8nCourses] = useState<CourseData[]>([]);
  const [pendingProjectDraft, setPendingProjectDraft] =
    useState<ProjectDraft | null>(null);

  // Añade estado para id del borrador guardado en servidor
  const [draftId, setDraftId] = useState<number | null>(null);

  // NUEVO: guardar último payload de n8n que contiene campos de borrador
  // prefijo "_" para evitar warning de variable asignada pero no usada
  const [_lastN8nProjectPayload, setLastN8nProjectPayload] =
    useState<N8nPayload | null>(null);
  const [_projectEnvelopes, setProjectEnvelopes] = useState<
    Record<number, ProjectEnvelope>
  >({});
  const [_projectPayload, setProjectPayload] = useState<Record<
    string,
    unknown
  > | null>(null);

  // NUEVO: helper para guardar un campo específico (acción por botón)
  const saveDraftField = useCallback(
    async (fieldAction: string) => {
      if (!pendingProjectDraft && !_lastN8nProjectPayload) {
        toast.error('No hay borrador disponible para guardar.');
        return;
      }

      const source = pendingProjectDraft ?? {
        projectName: _lastN8nProjectPayload?.projectName ?? '',
        planteamiento: _lastN8nProjectPayload?.planteamiento ?? '',
        justificacion: _lastN8nProjectPayload?.justificacion ?? '',
        objetivoGeneral: _lastN8nProjectPayload?.objetivoGeneral ?? '',
        objetivosEspecificos:
          _lastN8nProjectPayload?.objetivosEspecificos ?? [],
        actividades: (_lastN8nProjectPayload?.actividades ?? [])
          .map((a) =>
            typeof a === 'string'
              ? { descripcion: a }
              : a && typeof a === 'object' && 'descripcion' in a
                ? { descripcion: (a as { descripcion: string }).descripcion }
                : null
          )
          .filter(Boolean) as { descripcion: string }[],
        categoryId: _lastN8nProjectPayload?.categoryId,
        typeProject: _lastN8nProjectPayload?.typeProject,
      };

      const newDraft: Record<string, unknown> = {
        projectName: source.projectName ?? '',
        planteamiento: source.planteamiento ?? '',
        justificacion: source.justificacion ?? '',
        objetivoGeneral: source.objetivoGeneral ?? '',
        objetivosEspecificos: Array.isArray(source.objetivosEspecificos)
          ? source.objetivosEspecificos
          : [],
        actividades: Array.isArray(source.actividades)
          ? source.actividades
          : [],
        categoryId: source.categoryId ?? undefined,
        typeProject: source.typeProject ?? 'AI-Assistant',
      };

      const projectStep = (() => {
        switch (fieldAction) {
          case 'save_field_projectName':
            return 'titulo';
          case 'save_field_planteamiento':
            return 'planteamiento';
          case 'save_field_justificacion':
            return 'justificacion';
          case 'save_field_objetivoGeneral':
            return 'objetivo_general';
          case 'save_field_objetivosEspecificos':
            return 'objetivos_especificos';
          case 'save_field_actividades':
            return 'actividades';
          default:
            return 'partial_from_agent';
        }
      })();

      setIsLoading(true);
      try {
        let res: Response;
        if (draftId) {
          res = await fetch('/api/projects/drafts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: draftId, data: newDraft, projectStep }),
          });
        } else {
          res = await fetch('/api/projects/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: newDraft, projectStep }),
          });
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          let errorMsg = 'Error creando/actualizando borrador';
          if (
            errBody &&
            typeof errBody === 'object' &&
            'error' in errBody &&
            typeof (errBody as Record<string, unknown>).error === 'string'
          ) {
            errorMsg = (errBody as Record<string, unknown>).error as string;
          }
          console.error(
            'Error guardando borrador (field):',
            res.status,
            errorMsg
          );
          toast.error(errorMsg);
          return;
        }

        const created = (await res.json()) as {
          id?: number;
          updated_at?: string;
        };
        if (created?.id) setDraftId(Number(created.id));

        setPendingProjectDraft((prev) => {
          const merged: ProjectDraft = {
            projectName:
              typeof prev?.projectName === 'string'
                ? prev.projectName
                : typeof newDraft.projectName === 'string'
                  ? newDraft.projectName
                  : '',
            planteamiento:
              typeof prev?.planteamiento === 'string'
                ? prev.planteamiento
                : typeof newDraft.planteamiento === 'string'
                  ? newDraft.planteamiento
                  : '',
            justificacion:
              typeof prev?.justificacion === 'string'
                ? prev.justificacion
                : typeof newDraft.justificacion === 'string'
                  ? newDraft.justificacion
                  : '',
            objetivoGeneral:
              typeof prev?.objetivoGeneral === 'string'
                ? prev.objetivoGeneral
                : typeof newDraft.objetivoGeneral === 'string'
                  ? newDraft.objetivoGeneral
                  : '',
            objetivosEspecificos: Array.isArray(prev?.objetivosEspecificos)
              ? prev.objetivosEspecificos.map((x) => String(x))
              : Array.isArray(newDraft.objetivosEspecificos)
                ? (newDraft.objetivosEspecificos as string[]).map((x) =>
                    String(x)
                  )
                : [],
            actividades: Array.isArray(prev?.actividades)
              ? prev.actividades
              : Array.isArray(newDraft.actividades)
                ? (newDraft.actividades as { descripcion: string }[])
                : [],
            categoryId:
              typeof prev?.categoryId === 'number'
                ? prev.categoryId
                : typeof newDraft.categoryId === 'number'
                  ? (newDraft.categoryId as number)
                  : undefined,
            typeProject:
              typeof prev?.typeProject === 'string'
                ? prev.typeProject
                : typeof newDraft.typeProject === 'string'
                  ? (newDraft.typeProject as string)
                  : undefined,
            projectStep:
              typeof prev?.projectStep === 'string'
                ? prev.projectStep
                : typeof newDraft.projectStep === 'string'
                  ? (newDraft.projectStep as string)
                  : undefined,
          };
          return merged;
        });

        toast.success('Borrador guardado');
      } catch (err) {
        console.error('Save draft field error:', err);
        toast.error('No se pudo guardar el borrador');
      } finally {
        setIsLoading(false);
      }
    },
    [draftId, _lastN8nProjectPayload, pendingProjectDraft]
  );

  // Autosave: cuando pendingProjectDraft cambie, crea/actualiza draft en backend (debounce)
  useEffect(() => {
    if (!pendingProjectDraft) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const saveDraft = async () => {
      try {
        const payload = {
          data: pendingProjectDraft,
          projectStep: pendingProjectDraft.projectStep ?? 'partial_from_agent',
        };

        // Si ya existe draftId → PATCH, si no → POST
        if (draftId) {
          const res = await fetch('/api/projects/drafts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: draftId,
              data: payload.data,
              projectStep: payload.projectStep,
            }),
          });
          if (!res.ok) throw new Error('Error actualizando borrador');
          await res.json(); // no necesitamos el body aquí
          if (!cancelled) {
            toast.success('Borrador actualizado');
          }
        } else {
          const res = await fetch('/api/projects/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Error creando borrador');
          const created = (await res.json()) as { id?: number };
          if (!cancelled) {
            if (created?.id) setDraftId(Number(created.id));
            toast.success('Borrador guardado');
          }
        }
      } catch (err) {
        console.error('Autosave draft error:', err);
        if (!cancelled) toast.error('No se pudo guardar el borrador');
      }
    };

    // Debounce 1s para evitar muchas llamadas
    timer = setTimeout(() => {
      void saveDraft();
    }, 1000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pendingProjectDraft, draftId]);

  const pathname = usePathname();
  // Prefer nullish coalescing operator for safePathname
  const safePathname = pathname ?? '';
  const isChatPage = safePathname === '/';

  // Efecto para resetear el estado del chat cuando cambie la sección activa
  useEffect(() => {
    // Solo resetear si no hay un chat activo (para no interrumpir conversaciones en curso)
    if (!chatMode.idChat) {
      setChatMode({
        idChat: null,
        status: true,
        curso_title: '',
        type:
          activeSection === 'tickets'
            ? 'ticket'
            : activeSection === 'projects'
              ? 'project'
              : 'chat',
      });
      setShowChatList(true);
    }
  }, [activeSection, chatMode.idChat]);

  // --- ADICIÓN: colas para guardar mensajes si aún no hay conversation id persistido ---
  const pendingBotSaves = useRef<
    { text: string; coursesData?: CourseData[] }[]
  >([]);
  const pendingUserSaves = useRef<{ text: string; sender?: string }[]>([]);

  // Helper: intenta guardar mensaje bot ahora o encola. (memoizado)
  const queueOrSaveBotMessage = useCallback(
    (text: string, coursesData?: CourseData[]) => {
      const currentChatId = chatModeRef.current.idChat;
      const ownerId = conversationOwnerRef.current;
      if (!ownerId) {
        return;
      }
      if (currentChatId && currentChatId < 1000000000000) {
        void saveMessages(ownerId, currentChatId, [
          {
            text,
            sender: 'bot',
            sender_id: 'bot',
            coursesData:
              coursesData && coursesData.length > 0 ? coursesData : undefined,
          },
        ]).then(() => {
          // Disparar evento para actualizar la lista de chats
          window.dispatchEvent(new CustomEvent('chat-updated'));
        });
        return;
      }
      pendingBotSaves.current.push({ text, coursesData });
    },
    [] // sin dependencias: usa refs para owner y chatId
  );

  // Helper: intenta guardar mensaje usuario ahora o encola. (memoizado)
  const queueOrSaveUserMessage = useCallback(
    (text: string, sender = 'user') => {
      const currentChatId = chatModeRef.current.idChat;
      const ownerId = conversationOwnerRef.current;
      const currentChatType = chatModeRef.current.type;

      if (!ownerId) {
        return;
      }

      // Si es un ticket, usar SaveTicketMessage
      if (currentChatType === 'ticket') {
        void SaveTicketMessage(
          ownerId,
          text,
          sender,
          user?.emailAddresses?.[0]?.emailAddress
        );
        return;
      }

      // Para chats normales, usar la lógica existente
      if (currentChatId && currentChatId < 1000000000000) {
        void saveMessages(ownerId, currentChatId, [
          { text, sender, sender_id: ownerId },
        ]).then(() => {
          // Disparar evento para actualizar la lista de chats
          window.dispatchEvent(new CustomEvent('chat-updated'));
        });
        return;
      }
      pendingUserSaves.current.push({ text, sender });
    },
    [user?.emailAddresses] // agregar user como dependencia
  );

  // Effect: cuando se obtiene un chatId persistido, vaciar colas
  useEffect(() => {
    const flush = async () => {
      const currentChatId = chatModeRef.current.idChat;
      if (!currentChatId || currentChatId >= 1000000000000) return;
      const ownerId = conversationOwnerRef.current;
      if (!ownerId) return;

      // Flush user saves
      if (pendingUserSaves.current.length > 0) {
        for (const item of pendingUserSaves.current) {
          try {
            await saveMessages(ownerId, currentChatId, [
              {
                text: item.text,
                sender: item.sender ?? 'user',
                sender_id: ownerId,
              },
            ]);
          } catch (err) {
            console.error('Error flushing pending user save', err);
          }
        }
        pendingUserSaves.current = [];
        // Disparar evento para actualizar la lista de chats
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }

      // Flush bot saves
      if (pendingBotSaves.current.length > 0) {
        for (const item of pendingBotSaves.current) {
          try {
            await saveMessages(ownerId, currentChatId, [
              {
                text: item.text,
                sender: 'bot',
                sender_id: 'bot',
                coursesData: item.coursesData,
              },
            ]);
          } catch (err) {
            console.error('Error flushing pending bot save', err);
          }
        }
        pendingBotSaves.current = [];
        // Disparar evento para actualizar la lista de chats
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    };

    flush().catch((e) => console.error('Error flushing queues:', e));
  }, [chatMode.idChat]);

  // Type guards - Corregir unsafe member access
  const isN8nApiResponse = (x: unknown): x is N8nApiResponse => {
    if (typeof x !== 'object' || x === null) return false;
    const obj = x as Record<string, unknown>;
    return 'n8nData' in obj || 'prompt' in obj;
  };

  // Valida un curso con forma CourseData
  function isCourseData(x: unknown): x is CourseData {
    if (typeof x !== 'object' || x === null) return false;
    const anyX = x as Record<string, unknown>;
    return typeof anyX.id === 'number' && typeof anyX.title === 'string';
  }

  // NUEVO: Valida respuesta de /api/iahome
  function isIahomeResponse(
    x: unknown
  ): x is { response?: string; courses?: unknown[] } {
    if (typeof x !== 'object' || x === null) return false;
    const anyX = x as Record<string, unknown>;
    const hasResponse =
      !('response' in anyX) ||
      typeof anyX.response === 'string' ||
      typeof anyX.response === 'undefined';
    const hasCourses =
      !('courses' in anyX) ||
      Array.isArray(anyX.courses) ||
      typeof anyX.courses === 'undefined';
    return hasResponse && hasCourses;
  }

  // MOVER AQUÍ: función local para manejar el payload normalizado de n8n (antes de handleBotResponse)
  const handleN8nData = useCallback(
    async (data: N8nPayload, query: string) => {
      const initMsg = data.mensaje_inicial;
      const genericMsg = data.mensaje;

      // Si la respuesta incluye cursos, NO añadimos mensaje_inicial aquí
      // porque se enviará dentro del payload JSON unificado (evita duplicados en UI).
      if (!(Array.isArray(data.courses) && data.courses.length)) {
        if (typeof initMsg === 'string' && initMsg.trim() !== '') {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), text: initMsg, sender: 'bot' },
          ]);
          queueOrSaveBotMessage(initMsg);
        } else if (typeof genericMsg === 'string' && genericMsg.trim() !== '') {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), text: genericMsg, sender: 'bot' },
          ]);
          queueOrSaveBotMessage(genericMsg);
        }
      }

      if (Array.isArray(data.courses) && data.courses.length) {
        // NUEVO: Validar que los cursos existan en la BD
        try {
          const courseIds = data.courses
            .filter(isCourseData)
            .map((c) => c.id)
            .join(',');

          const validationRes = await fetch('/api/courses/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseIds: courseIds }),
          });

          // Obtener listado de modalidades del backend para usar el nombre oficial
          const modalidadMap = new Map<number, string>();
          try {
            const modRes = await fetch('/api/modalidades');
            if (modRes.ok) {
              const modList = (await modRes.json()) as {
                id: number;
                name: string;
              }[];
              modList.forEach((m) => {
                if (typeof m.id === 'number' && typeof m.name === 'string') {
                  modalidadMap.set(m.id, m.name);
                }
              });
            } else {
              console.warn(
                'No se pudo cargar /api/modalidades, seguir sin nombres desde BD'
              );
            }
          } catch (modErr) {
            console.warn('Error al obtener modalidades:', modErr);
          }

          // Si la validación responde OK, extraer validIds; si no, fallback a usar data.courses
          let validCourseIds: number[] = [];
          if (validationRes.ok) {
            const validationData = (await validationRes.json()) as {
              validIds?: number[];
            };
            validCourseIds = validationData.validIds ?? [];
          } else {
            console.warn(
              'Course validation endpoint returned non-ok, will use agent courses as fallback'
            );
            validCourseIds = [];
          }

          // Filtrar solo los cursos que existen en la BD si tenemos valid ids,
          // si la validación no devolvió ids, usamos directamente los cursos del agente.
          let coursesData: CourseData[] = [];
          if (validCourseIds.length > 0) {
            coursesData = data.courses
              .filter(isCourseData)
              .filter((c) => validCourseIds.includes(c.id))
              .map((c) => ({
                id: c.id,
                title: c.title,
                modalidadId: c.modalidadId,
                // PRIORIDAD: nombre desde BD si existe modalidadId y está en el mapa;
                // fallback a la modalidad que traiga el agente solo si no hay valor en BD.
                modalidad:
                  typeof c.modalidadId === 'number' &&
                  modalidadMap.has(c.modalidadId)
                    ? modalidadMap.get(c.modalidadId)
                    : typeof c.modalidad === 'string' &&
                        c.modalidad.trim() !== ''
                      ? c.modalidad
                      : undefined,
              }));
          } else {
            // Fallback: usa los cursos del agente enriquecidos si es posible con modalidadMap
            coursesData = data.courses.filter(isCourseData).map((c) => ({
              id: c.id,
              title: c.title,
              modalidadId: c.modalidadId,
              modalidad:
                typeof c.modalidadId === 'number' &&
                modalidadMap.has(c.modalidadId)
                  ? modalidadMap.get(c.modalidadId)
                  : typeof c.modalidad === 'string' && c.modalidad.trim() !== ''
                    ? c.modalidad
                    : undefined,
            }));
          }

          // Limita el array a máximo 5 cursos (ajustar si quieres otro límite)
          if (coursesData.length > 5) {
            coursesData = coursesData.slice(0, 5);
          }

          if (coursesData.length > 0) {
            // UNIFICAR: crear payload igual al del Agent IA para que el frontend muestre exactamente lo mismo
            const payloadForFront: Partial<N8nPayload> = {
              mensaje_inicial:
                data.mensaje_inicial ??
                'Aquí tienes algunos cursos que podrían ser útiles en tu formación.',
              courses: coursesData,
              // Garantizar pregunta_final siempre presente con fallback significativo
              pregunta_final:
                data.pregunta_final ??
                '¿Quieres saber más acerca de alguno de estos cursos para ayudarte a crear un proyecto sobre él?',
              intent: data.intent ?? 'course_search',
            };

            const textPayload = JSON.stringify(payloadForFront, null, 2);

            // Añadir un único mensaje que contiene el JSON string (igual al Agent IA)
            setN8nCourses(coursesData);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                text: textPayload,
                sender: 'bot',
                coursesData,
              },
            ]);
            // Guardar en cola/BD: textPayload + coursesData (saveMessages insertará courses_data)
            queueOrSaveBotMessage(textPayload, coursesData);

            // NO insertar mensaje adicional "Cursos encontrados:" ni intro automático.
            // Si el agent indica explícitamente projectPrompt, abrir modal sin alterar la conversación mostrada:
            const shouldOpenProject =
              Boolean(data.projectPrompt) ||
              (typeof data.intent === 'string' &&
                /idea|intenci[óo]n|proyecto/.test(data.intent)) ||
              /como ser|quiero|mi idea|proyecto/i.test(query);

            if (shouldOpenProject && data.projectPrompt) {
              // solo disparar evento para abrir el modal, no añadir texto extra al chat
              window.dispatchEvent(
                new CustomEvent('open-modal-planteamiento', {
                  detail: { text: data.mensaje ?? '' },
                })
              );
            }
          } else {
            // Si realmente no hay cursos válidos, mostrar fallback amigable sin mensaje técnico
            const fallbackMsg =
              'No encontré cursos relacionados en nuestra plataforma. Intenta con otros términos o puedo ayudarte a crear un proyecto desde tu idea.';
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                text: fallbackMsg,
                sender: 'bot',
              },
            ]);
            queueOrSaveBotMessage(fallbackMsg);
          }
        } catch (validationError) {
          console.error('Error validating courses:', validationError);
          // Fallback: usar los cursos del agente sin validación y enviarlos como único mensaje JSON
          // Obtener modalidades para enriquecimiento (intentar, pero no bloquear)
          const modalidadMap = new Map<number, string>();
          try {
            const modRes = await fetch('/api/modalidades');
            if (modRes.ok) {
              const modList = (await modRes.json()) as {
                id: number;
                name: string;
              }[];
              modList.forEach((m) => {
                if (typeof m.id === 'number' && typeof m.name === 'string') {
                  modalidadMap.set(m.id, m.name);
                }
              });
            }
          } catch (modErr) {
            console.warn('Error al obtener modalidades en fallback:', modErr);
          }

          const coursesData: CourseData[] = data.courses
            .filter(isCourseData)
            .map((c) => ({
              id: c.id,
              title: c.title,
              modalidadId: c.modalidadId,
              modalidad:
                typeof c.modalidadId === 'number' &&
                modalidadMap.has(c.modalidadId)
                  ? modalidadMap.get(c.modalidadId)
                  : typeof c.modalidad === 'string' && c.modalidad.trim() !== ''
                    ? c.modalidad
                    : undefined,
            }));

          const payloadForFront: Partial<N8nPayload> = {
            mensaje_inicial:
              data.mensaje_inicial ??
              'Aquí tienes algunos cursos que podrían ser útiles en tu formación.',
            courses: coursesData,
            pregunta_final:
              data.pregunta_final ??
              '¿Quieres saber más acerca de alguno de estos cursos para ayudarte a crear un proyecto sobre él?',
            intent: data.intent ?? 'course_search',
          };

          const textPayload = JSON.stringify(payloadForFront, null, 2);

          setN8nCourses(coursesData);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              text: textPayload,
              sender: 'bot',
              coursesData,
            },
          ]);
          queueOrSaveBotMessage(textPayload, coursesData);
        }
      }

      const courseDesc = data.courseDescription;
      if (typeof courseDesc === 'string' && courseDesc.trim() !== '') {
        const descMsg = data.mensaje ?? 'Aquí tienes la información del curso:';
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), text: descMsg, sender: 'bot' },
          { id: Date.now() + Math.random(), text: courseDesc, sender: 'bot' },
        ]);
        queueOrSaveBotMessage(descMsg);
        queueOrSaveBotMessage(courseDesc);
      }

      if (data.projectPrompt) {
        const intro =
          data.mensaje ??
          'Perfecto, vamos a crear tu proyecto. Abriré el asistente de Planteamiento.';
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), text: intro, sender: 'bot' },
        ]);
        queueOrSaveBotMessage(intro);
        window.dispatchEvent(
          new CustomEvent('open-modal-planteamiento', {
            detail: { text: data.mensaje ?? '' },
          })
        );
      }

      // NUEVO: detectar borrador de proyecto y ofrecer guardar
      const hasDraftFields =
        Boolean(data.projectName) ||
        Boolean(data.planteamiento) ||
        Boolean(data.justificacion) ||
        Boolean(data.objetivoGeneral) ||
        (Array.isArray(data.objetivosEspecificos) &&
          data.objetivosEspecificos.length > 0) ||
        (Array.isArray(data.actividades) && data.actividades.length > 0);

      if (data.projectPrompt || hasDraftFields) {
        // Guardar payload original para acciones de guardado manual
        setLastN8nProjectPayload(data);

        // Normalizar actividades
        const acts =
          (data.actividades ?? [])
            .map((a) =>
              typeof a === 'string'
                ? { descripcion: a }
                : a &&
                    typeof a === 'object' &&
                    'descripcion' in a &&
                    typeof (a as { descripcion?: unknown }).descripcion ===
                      'string'
                  ? { descripcion: (a as { descripcion: string }).descripcion }
                  : null
            )
            .filter((x): x is { descripcion: string } => Boolean(x)) ?? [];

        const draft: ProjectDraft = {
          projectName: data.projectName?.trim() ?? `Proyecto basado en tu idea`,
          planteamiento: data.planteamiento?.trim() ?? '',
          justificacion: data.justificacion?.trim() ?? '',
          objetivoGeneral: data.objetivoGeneral?.trim() ?? '',
          objetivosEspecificos: (data.objetivosEspecificos ?? []).filter(
            (t) => typeof t === 'string' && t.trim() !== ''
          ),
          actividades: acts,
          categoryId: data.categoryId,
          typeProject: data.typeProject ?? 'AI-Assistant',
        };

        // Guardar en estado para autosave y acciones manuales
        setPendingProjectDraft(draft);

        // Construir botones por campo detectado
        const fieldButtons: { label: string; action: string }[] = [];

        if (draft.projectName && draft.projectName.trim() !== '') {
          fieldButtons.push({
            label: '💾 Guardar título',
            action: 'save_field_projectName',
          });
        }
        if (draft.planteamiento && draft.planteamiento.trim() !== '') {
          fieldButtons.push({
            label: '💾 Guardar planteamiento',
            action: 'save_field_planteamiento',
          });
        }
        if (draft.justificacion && draft.justificacion.trim() !== '') {
          fieldButtons.push({
            label: '💾 Guardar justificación',
            action: 'save_field_justificacion',
          });
        }
        if (draft.objetivoGeneral && draft.objetivoGeneral.trim() !== '') {
          fieldButtons.push({
            label: '💾 Guardar objetivo',
            action: 'save_field_objetivoGeneral',
          });
        }
        if (draft.objetivosEspecificos?.length) {
          fieldButtons.push({
            label: '💾 Guardar objetivos específicos',
            action: 'save_field_objetivosEspecificos',
          });
        }
        if (draft.actividades?.length) {
          fieldButtons.push({
            label: '💾 Guardar actividades',
            action: 'save_field_actividades',
          });
        }

        // Siempre añadir opción de guardar todo (como antes)
        fieldButtons.push({
          label: '💾 Guardar todo',
          action: 'save_project_draft',
        });

        const resumen =
          `Propuesta de proyecto:\n` +
          `• Título: ${draft.projectName}\n` +
          (draft.planteamiento
            ? `• Planteamiento: ${draft.planteamiento}\n`
            : '') +
          (draft.justificacion
            ? `• Justificación: ${draft.justificacion}\n`
            : '') +
          (draft.objetivoGeneral
            ? `• Objetivo general: ${draft.objetivoGeneral}\n`
            : '') +
          (draft.objetivosEspecificos.length
            ? `• Objetivos específicos:\n  - ${draft.objetivosEspecificos.join('\n  - ')}\n`
            : '') +
          (draft.actividades.length
            ? `• Actividades:\n  - ${draft.actividades.map((a) => a.descripcion).join('\n  - ')}`
            : '');

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            text: resumen,
            sender: 'bot',
            buttons: fieldButtons,
          },
        ]);
        queueOrSaveBotMessage(resumen);
      }
    },
    [queueOrSaveBotMessage, setMessages, setN8nCourses]
  );

  const handleProjectEnvelopeData = useCallback(
    (envelope: ProjectEnvelope | null | undefined) => {
      if (envelope?.mode !== 'project') return;

      const stepKey =
        typeof envelope.step === 'number' && envelope.step > 0
          ? envelope.step
          : -1;
      setProjectEnvelopes((prev) => ({
        ...prev,
        [stepKey]: envelope,
      }));

      const dataSection = envelope.data;
      if (
        dataSection &&
        typeof dataSection === 'object' &&
        'project_payload' in dataSection
      ) {
        const payload = (
          dataSection as {
            project_payload?: unknown;
          }
        ).project_payload;
        if (payload && typeof payload === 'object') {
          setProjectPayload(payload as Record<string, unknown>);
        }
      }
    },
    []
  );

  // Modificado: handleBotResponse ahora consume Agent IA (sin botones sí/no)
  const handleBotResponse = useCallback(
    async (query: string, options?: { useN8n?: boolean }): Promise<void> => {
      const useN8n = options?.useN8n === true;
      if (processingQuery || searchRequestInProgress.current) return;

      searchRequestInProgress.current = true;
      setProcessingQuery(true);
      setIsLoading(true);

      // NUEVO: mensaje temporal para feedback visual
      const loadingMessageId = Date.now() + Math.random();
      // marcamos un mensaje de carga usando texto vacío -> renderMessage lo mostrará como loader
      setMessages((prev) => [
        ...prev,
        { id: loadingMessageId, text: '', sender: 'bot' },
      ]);

      try {
        if (useN8n) {
          const conversationId = chatModeRef.current.idChat ?? undefined;

          // Construir messageHistory limpio para el agente n8n:
          // - eliminar saludo inicial estándar para evitar que el agent vuelva a saludar
          // - mapear roles: 'bot' -> 'assistant', 'user' -> 'user'
          // - limitar a últimas 12 entradas (ajustable)
          const RAW_WELCOME =
            '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎';
          const MAX_HISTORY = 12;
          const messageHistory = messages
            .filter(Boolean)
            .map((m) => {
              let text = '';
              if (typeof m.text === 'string') {
                text = m.text;
              } else if (
                typeof m.text === 'object' &&
                m.text !== null &&
                'text' in (m.text as Record<string, unknown>) &&
                typeof (m.text as Record<string, unknown>).text === 'string'
              ) {
                text = (m.text as Record<string, string>).text;
              }
              return { role: m.sender === 'bot' ? 'assistant' : 'user', text };
            })
            .filter(
              (x) => x && typeof x.text === 'string' && x.text.trim() !== ''
            )
            // eliminar las entradas que son exactamente el saludo inicial
            .filter((x) => x.text.trim() !== RAW_WELCOME)
            // mantener solo últimas MAX_HISTORY entradas
            .slice(Math.max(0, messages.length - MAX_HISTORY));

          let n8nSuccess = false;

          try {
            const result = await fetch('/api/ia-cursos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: query,
                conversationId,
                // enviar el arreglo mapeado (role/text) que espera el agente
                messageHistory,
              }),
            });

            if (result.ok) {
              // CAMBIO: usa result.json() en lugar de .text() + JSON.parse
              const parsed: unknown = await result.json();

              // DEBUG: Agregamos log para ver la respuesta completa
              console.log('Respuesta completa de /api/ia-cursos:', parsed);

              if (
                parsed &&
                typeof parsed === 'object' &&
                (typeof (parsed as { output?: unknown }).output === 'string' ||
                  ((parsed as { project_envelope?: unknown })
                    .project_envelope &&
                    typeof (parsed as { project_envelope?: unknown })
                      .project_envelope === 'object'))
              ) {
                const maybeOutput = (parsed as { output?: unknown }).output;
                const displayOutput = (() => {
                  if (typeof maybeOutput === 'string') return maybeOutput;
                  try {
                    return JSON.stringify(maybeOutput);
                  } catch {
                    return String(maybeOutput);
                  }
                })();

                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now() + Math.random(),
                    text: displayOutput,
                    sender: 'bot',
                  },
                ]);
                queueOrSaveBotMessage(displayOutput);

                const maybeEnvelope = (
                  parsed as {
                    project_envelope?: unknown;
                  }
                ).project_envelope;
                if (
                  maybeEnvelope &&
                  typeof maybeEnvelope === 'object' &&
                  maybeEnvelope !== null
                ) {
                  handleProjectEnvelopeData(maybeEnvelope as ProjectEnvelope);
                }

                setIdea({ selected: false, idea: '' });
                n8nSuccess = true;
              }

              if (!n8nSuccess) {
                // SOLUCIÓN: Manejar correctamente el formato { prompt, n8nData }
                if (
                  typeof parsed === 'object' &&
                  parsed !== null &&
                  'n8nData' in parsed
                ) {
                  const apiResponse = parsed as {
                    prompt?: string;
                    n8nData?: N8nPayload;
                  };

                  if (apiResponse.n8nData) {
                    // Usar directamente n8nData que ya viene normalizado de la API
                    await handleN8nData(apiResponse.n8nData, query);
                    setIdea({ selected: false, idea: '' });
                    n8nSuccess = true;
                  } else {
                    console.warn(
                      'La respuesta contiene n8nData pero está vacío:',
                      apiResponse
                    );
                  }
                } else {
                  // Intentar el proceso anterior como fallback
                  const extracted = extractN8nPayload(parsed);
                  if (extracted) {
                    await handleN8nData(extracted, query);
                    setIdea({ selected: false, idea: '' });
                    n8nSuccess = true;
                  } else if (isN8nApiResponse(parsed)) {
                    const api: N8nApiResponse = parsed;
                    const n8nData: N8nPayload = (api.n8nData ??
                      {}) as N8nPayload;

                    const maybePayload = extractN8nPayload({ n8nData });
                    if (maybePayload) {
                      await handleN8nData(maybePayload, query);
                      setIdea({ selected: false, idea: '' });
                      n8nSuccess = true;
                    } else {
                      // Fallback para respuestas de n8n sin estructura esperada
                      const initMsg = n8nData.mensaje_inicial;
                      const genericMsg = n8nData.mensaje;

                      if (
                        typeof initMsg === 'string' &&
                        initMsg.trim() !== ''
                      ) {
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: Date.now() + Math.random(),
                            text: initMsg,
                            sender: 'bot',
                          },
                        ]);
                        queueOrSaveBotMessage(initMsg);
                        n8nSuccess = true;
                      } else if (
                        typeof genericMsg === 'string' &&
                        genericMsg.trim() !== ''
                      ) {
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: Date.now() + Math.random(),
                            text: genericMsg,
                            sender: 'bot',
                          },
                        ]);
                        queueOrSaveBotMessage(genericMsg);
                        n8nSuccess = true;
                      }
                    }
                  }
                }
              }
            }
          } catch (n8nError) {
            console.warn('N8N no disponible, usando fallback local:', n8nError);
          }

          // Si n8n falla, usar búsqueda local como fallback
          if (!n8nSuccess) {
            console.log('🔄 N8N falló, usando búsqueda local como fallback');
            const res = await fetch('/api/iahome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: query }),
            });

            if (res.ok) {
              const dataUnknown: unknown = await res.json();

              if (isIahomeResponse(dataUnknown)) {
                const dataObj = dataUnknown as {
                  response?: unknown;
                  courses?: unknown[];
                };
                const responseText =
                  typeof dataObj.response === 'string'
                    ? dataObj.response
                    : 'No encontré resultados específicos, pero puedo ayudarte con información general.';

                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now() + Math.random(),
                    text: responseText,
                    sender: 'bot',
                  },
                ]);
                queueOrSaveBotMessage(responseText);

                // si hay courses retornados por iahome, filtramos y mostramos
                if (
                  Array.isArray(dataObj.courses) &&
                  dataObj.courses.length > 0
                ) {
                  const coursesData: CourseData[] = dataObj.courses
                    .filter(isCourseData)
                    .map((c) => ({
                      id: c.id,
                      title: c.title,
                    }));
                  if (coursesData.length) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: Date.now() + Math.random(),
                        text: 'Cursos encontrados:',
                        sender: 'bot',
                        coursesData,
                      },
                    ]);
                    queueOrSaveBotMessage('Cursos encontrados:', coursesData);
                  }
                }
              }
            } else {
              throw new Error('Tanto n8n como búsqueda local fallaron');
            }
          }

          setIdea({ selected: false, idea: '' });
          return;
        } else {
          // flujo local (iahome) para búsquedas normales
          const res = await fetch('/api/iahome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: query }),
          });

          // Si el backend responde con error (500) pero incluye JSON con "response",
          // preferimos usar ese texto en vez de lanzar excepción y cortar el flujo.
          let dataUnknown: unknown = null;
          if (!res.ok) {
            try {
              dataUnknown = await res.json();
              console.warn(
                'iahome returned non-ok but with JSON:',
                dataUnknown
              );
            } catch (_e) {
              // Cambia e a _e
              const errText = await res.text().catch(() => '');
              throw new Error(errText || `HTTP ${res.status}`);
            }
          } else {
            dataUnknown = await res.json();
          }

          // Validamos la estructura esperada y mostramos el texto que venga en "response"
          if (!isIahomeResponse(dataUnknown)) {
            const responseText = 'No encontré resultados.';
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                text: responseText,
                sender: 'bot',
              },
            ]);
            queueOrSaveBotMessage(responseText);
            return;
          }

          const dataObj = dataUnknown as {
            response?: unknown;
            courses?: unknown[];
          };
          const responseText =
            typeof dataObj.response === 'string'
              ? dataObj.response
              : 'No encontré resultados.';
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              text: responseText,
              sender: 'bot',
            },
          ]);
          queueOrSaveBotMessage(responseText);

          // si hay courses retornados por iahome, filtramos y mostramos
          if (Array.isArray(dataObj.courses) && dataObj.courses.length > 0) {
            const coursesData: CourseData[] = dataObj.courses
              .filter(isCourseData)
              .map((c) => ({
                id: c.id,
                title: c.title,
              }));
            if (coursesData.length) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  text: 'Cursos encontrados:',
                  sender: 'bot',
                  coursesData,
                },
              ]);
              queueOrSaveBotMessage('Cursos encontrados:', coursesData);
            }
          }
          return;
        }
      } catch (error) {
        console.error('Error getting bot response:', error);
        const errorMessage =
          'Lo siento, estoy teniendo dificultades técnicas. Puedes intentar reformular tu pregunta o contactar soporte si el problema persiste.';
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), text: errorMessage, sender: 'bot' },
        ]);
        queueOrSaveBotMessage(errorMessage);
      } finally {
        // NUEVO: eliminar el mensaje "Pensando..."
        setMessages((prev) => prev.filter((m) => m.id !== loadingMessageId));
        setIsLoading(false);
        setProcessingQuery(false);
        searchRequestInProgress.current = false;
        onSearchComplete?.();
      }
    },
    [
      processingQuery,
      onSearchComplete,
      messages,
      queueOrSaveBotMessage,
      handleN8nData,
      handleProjectEnvelopeData,
    ]
  );

  // useEffect para manejar búsquedas desde StudentDetails
  // Guardar el último prompt procesado para evitar bucles infinitos
  const lastProcessedPromptRef = useRef<string>('');

  useEffect(() => {
    const handleCreateNewChatWithSearch = (
      event: CustomEvent<{ query: string }>
    ): void => {
      const rawQuery = event.detail.query ?? '';
      const trimmedQuery = rawQuery.trim();
      if (!trimmedQuery) return;

      // Si el prompt es igual al último procesado y el chatbot está abierto, no lo proceses de nuevo
      if (lastProcessedPromptRef.current === trimmedQuery && isOpen) {
        return;
      }
      lastProcessedPromptRef.current = trimmedQuery;

      const tempChatId = Date.now();

      setChatMode({ idChat: tempChatId, status: true, curso_title: '' });
      setShowChatList(false);
      pendingBotSaves.current = [];
      pendingUserSaves.current = [];
      setPendingProjectDraft(null);
      setLastN8nProjectPayload(null);
      setProjectEnvelopes({});
      setProjectPayload(null);

      const now = Date.now();
      setMessages([
        {
          id: now,
          text: '¡Hola! soy Artie 🤖 tu chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 🤔',
          sender: 'bot',
          buttons: [
            { label: '🤖 Crear Proyecto', action: 'new_project' },
            { label: '💡 Nueva Idea', action: 'new_idea' },
            { label: '🛠️ Soporte Técnico', action: 'contact_support' },
          ],
        },
        {
          id: now + 1,
          text: '¡Cuéntame tu nueva idea!',
          sender: 'bot',
        },
      ]);
      setIdea({ selected: true, idea: '' });

      setInputText('');
      setIsOpen(true);
      initialSearchDone.current = false;
      setProcessingQuery(false);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('force-open-chatbot'));
        setTimeout(() => inputRef.current?.focus(), 0);
      }, 50);

      setTimeout(() => {
        const newUserMessage = {
          id: Date.now(),
          text: trimmedQuery,
          sender: 'user' as const,
        };
        queueOrSaveUserMessage(trimmedQuery, 'user');
        setMessages((prev) => [...prev, newUserMessage]);
        setIdea({ selected: false, idea: trimmedQuery });
        void handleBotResponse(trimmedQuery, { useN8n: true });

        const timestamp = Date.now();
        const fecha = new Date(timestamp);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        const hora = String(fecha.getHours()).padStart(2, '0');
        const minuto = String(fecha.getMinutes()).padStart(2, '0');
        const resultado = `${dia}-${mes}-${anio} ${hora}:${minuto}`;

        if (user?.id) {
          getOrCreateConversation({
            senderId: user.id,
            cursoId: courseId ?? Math.round(Math.random() * 100 + 1),
            title: `Búsqueda: ${trimmedQuery.substring(0, 30)}... - ${resultado}`,
          })
            .then((response) => {
              setChatMode({
                idChat: response.id,
                status: true,
                curso_title: '',
              });
            })
            .catch((error) => {
              console.error('Error creando chat:', error);
            });
        }
      }, 200);
    };

    window.addEventListener(
      'create-new-chat-with-search',
      handleCreateNewChatWithSearch as EventListener
    );

    return () => {
      window.removeEventListener(
        'create-new-chat-with-search',
        handleCreateNewChatWithSearch as EventListener
      );
    };
  }, [
    handleBotResponse,
    onSearchComplete,
    courseId,
    user?.id,
    queueOrSaveUserMessage,
    isOpen,
  ]);

  useEffect(() => {
    const handleEnrollmentMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{
        message: string;
        courseTitle?: string;
      }>;
      setIsOpen(true);
      setMessages([
        {
          id: Date.now(),
          text: customEvent.detail.message,
          sender: 'bot',
        },
      ]);
      setInputText('');
      setChatMode((prev) => ({
        ...prev,
        idChat: Date.now(),
        status: true,
        curso_title: customEvent.detail.courseTitle ?? '',
      }));
      setShowChatList(false);
    };

    window.addEventListener(
      'open-chatbot-with-enrollment-message',
      handleEnrollmentMessage
    );

    return () => {
      window.removeEventListener(
        'open-chatbot-with-enrollment-message',
        handleEnrollmentMessage
      );
    };
  }, [user?.emailAddresses]);

  // Event listener para crear nuevo ticket
  useEffect(() => {
    const handleCreateNewTicket = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId: string;
        email?: string;
      }>;

      if (!customEvent.detail.userId) return;

      // En lugar de abrir el chatbot de IA, simplemente cerrar el chat principal y activar el TicketSupportChatbot
      setIsOpen(false);

      // Preparar para crear un nuevo ticket desde cero en el TicketSupportChatbot
      window.dispatchEvent(new Event('support-chat-close'));
      window.dispatchEvent(
        new CustomEvent('support-open-chat', { detail: { id: null } })
      );

      // Validar si ya existe un ticket abierto, si sí: avisar y abrir ese
      const creatorId = customEvent.detail.userId;
      const email =
        customEvent.detail.email ?? user?.emailAddresses?.[0]?.emailAddress;

      getUserOpenTicket(creatorId)
        .then((open) => {
          if (
            open &&
            (open.estado ?? '').toLowerCase() !== 'cerrado' &&
            (open.estado ?? '').toLowerCase() !== 'solucionado'
          ) {
            toast.error(
              'Tienes un ticket abierto. No puedes crear uno nuevo hasta cerrarlo.'
            );
            window.dispatchEvent(
              new CustomEvent('support-open-chat', { detail: { id: open.id } })
            );
            return;
          }

          // Crear el ticket en BD inmediatamente con descripción mínima para evitar historial anterior
          const timestamp = Date.now();
          const fecha = new Date(timestamp);
          const dia = String(fecha.getDate()).padStart(2, '0');
          const mes = String(fecha.getMonth() + 1).padStart(2, '0');
          const anio = fecha.getFullYear();
          const hora = String(fecha.getHours()).padStart(2, '0');
          const minuto = String(fecha.getMinutes()).padStart(2, '0');
          const resultado = `${dia}-${mes}-${anio} ${hora}:${minuto}`;

          // Usar la función directa de creación sin getOrCreate para evitar reutilizar tickets
          createNewTicket({
            creatorId,
            email,
            description: `Nuevo ticket creado desde estudiante el ${resultado}`,
          })
            .then((response) => {
              // Avisar a las listas para que se refresquen
              window.dispatchEvent(
                new CustomEvent('ticket-created', {
                  detail: { id: response.id },
                })
              );
              window.dispatchEvent(new CustomEvent('chat-updated'));
              // Abrir el ticket en el TicketSupportChatbot
              window.dispatchEvent(
                new CustomEvent('support-open-chat', {
                  detail: { id: response.id },
                })
              );
            })
            .catch((err) => {
              console.error(
                'Error creando el ticket desde el botón principal:',
                err
              );
              toast.error('No se pudo crear el ticket. Intenta nuevamente.');
            });
        })
        .catch((err) => {
          console.error('Error validando ticket abierto:', err);
          // Fallback a intentar crear
          const timestamp = Date.now();
          const fecha = new Date(timestamp);
          const dia = String(fecha.getDate()).padStart(2, '0');
          const mes = String(fecha.getMonth() + 1).padStart(2, '0');
          const anio = fecha.getFullYear();
          const hora = String(fecha.getHours()).padStart(2, '0');
          const minuto = String(fecha.getMinutes()).padStart(2, '0');
          const resultado = `${dia}-${mes}-${anio} ${hora}:${minuto}`;
          getOrCreateSuportChat({
            creatorId,
            email,
            description: `Nuevo ticket de soporte creado el ${resultado}`,
          })
            .then((response) => {
              window.dispatchEvent(
                new CustomEvent('ticket-created', {
                  detail: { id: response.id },
                })
              );
              window.dispatchEvent(new CustomEvent('chat-updated'));
              // Abrir el ticket en el TicketSupportChatbot
              window.dispatchEvent(
                new CustomEvent('support-open-chat', {
                  detail: { id: response.id },
                })
              );
            })
            .catch((e) => {
              console.error('Error creando el ticket (fallback):', e);
              toast.error('No se pudo crear el ticket. Intenta nuevamente.');
            });
        });
    };

    window.addEventListener('create-new-ticket', handleCreateNewTicket);

    return () => {
      window.removeEventListener('create-new-ticket', handleCreateNewTicket);
    };
  }, [user?.emailAddresses]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, initialSearchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleInitialSearch = () => {
      if (
        !initialSearchQuery?.trim() ||
        !showChat ||
        processingQuery ||
        searchRequestInProgress.current ||
        initialSearchDone.current
      ) {
        return;
      }

      // Si no está autenticado: abrir chat y mostrar aviso para iniciar sesión
      if (!isSignedIn) {
        setIsOpen(true);
        setShowLoginNotice(true);
        return;
      }

      // Usuario autenticado: disparar creación de chat con la búsqueda
      initialSearchDone.current = true;
      setIsOpen(true);
      window.dispatchEvent(
        new CustomEvent('create-new-chat-with-search', {
          detail: { query: initialSearchQuery.trim() },
        })
      );
    };

    handleInitialSearch();
  }, [initialSearchQuery, isSignedIn, showChat, processingQuery]);

  useEffect(() => {
    return () => {
      initialSearchDone.current = false;
    };
  }, []);

  // Event listener para cerrar completamente el chatbot
  useEffect(() => {
    const handleChatbotClose = () => {
      setIsOpen(false);
      setShowChatList(false);
    };

    window.addEventListener('chatbot-close', handleChatbotClose);

    return () => {
      window.removeEventListener('chatbot-close', handleChatbotClose);
    };
  }, []);

  useEffect(() => {
    if (!showChat) {
      initialSearchDone.current = false;
      setProcessingQuery(false);
      setShowLoginNotice(false);
    }
  }, [showChat, processingQuery]);

  // Si el usuario inicia sesión, ocultar el aviso
  useEffect(() => {
    if (isSignedIn && showLoginNotice) setShowLoginNotice(false);
  }, [isSignedIn, showLoginNotice]);

  useEffect(() => {
    setIsOpen(showChat);
  }, [showChat]);

  useEffect(() => {
    let isMounted = true;
    // Set initial dimensions based on window size
    const initialDimensions = {
      width:
        typeof window !== 'undefined' && window.innerWidth < 768
          ? window.innerWidth
          : 500,
      height: window.innerHeight,
    };
    if (isMounted) setDimensions(initialDimensions);

    // Add resize handler
    const handleResize = () => {
      if (!isMounted) return;
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: isMobile ? window.innerWidth : 500,
        height: window.innerHeight,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Detectar si estamos en desktop y actualizar al redimensionar
  useEffect(() => {
    const checkDesktop = () => {
      // breakpoint >= 768 (md)
      const desktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      setIsDesktop(desktop);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const scrollToBottom = () => {
    void messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Manejo de envío de mensajes
  // Nota: este handle usa ideaRef para decidir si invocar n8n
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedInput = inputText.trim();
    if (!trimmedInput || searchRequestInProgress.current) return;

    const newUserMessage = {
      id: Date.now(),
      text: trimmedInput,
      sender: 'user' as const,
    };

    // NUEVO: abrir el chat por seguridad antes de agregar mensajes
    setIsOpen(true);

    queueOrSaveUserMessage(trimmedInput, 'user');
    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');

    // CAMBIO: Siempre usar n8n para consultas de chat, solo usar iahome para búsquedas específicas
    if (ideaRef.current.selected) {
      setIdea({ selected: false, idea: trimmedInput });
      await handleBotResponse(trimmedInput, { useN8n: true });
    } else {
      // CAMBIO: Para consultas generales también usar n8n
      await handleBotResponse(trimmedInput, { useN8n: true });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessages([
      {
        id: Date.now(),
        text: '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
        sender: 'bot',
        buttons: [
          { label: '📚 Crear Proyecto', action: 'new_project' },
          { label: '💬 Nueva Idea', action: 'new_idea' },
          { label: '🛠 Soporte Técnico', action: 'contact_support' },
        ],
      },
    ]);
    setInputText('');
    initialSearchDone.current = false;
    setProcessingQuery(false);
    onSearchComplete?.();
  };

  const handleClick = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  const handleResize = useCallback(
    (_e: React.SyntheticEvent, data: ResizeData) => {
      setDimensions(data.size);
    },
    []
  );

  // Manejo de botones (creación, idea, soporte, flujo final_yes/no, selección/creación de proyecto)
  const handleBotButtonClick = (action: string) => {
    if (action === 'new_project') {
      queueOrSaveUserMessage('📚 Crear Proyecto');
      if (!isSignedIn) {
        router.push(`/planes`);
      } else {
        router.push('/proyectos');
      }
      return;
    }
    if (action === 'new_idea') {
      queueOrSaveUserMessage('💬 Nueva Idea');
      setIdea({ selected: true, idea: '' });
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: '¡Cuéntame tu nueva idea!', sender: 'bot' },
      ]);
      // NUEVO: enfocar de inmediato el input para escribir la idea
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    if (action === 'contact_support') {
      queueOrSaveUserMessage('🛠 Soporte Técnico');
      // Cerrar el chat de IA y activar el botón de crear nuevo ticket
      setIsOpen(false);
      // Disparar el evento para crear un nuevo ticket
      if (user?.id) {
        window.dispatchEvent(
          new CustomEvent('create-new-ticket', {
            detail: {
              userId: user.id,
              email: user.emailAddresses?.[0]?.emailAddress,
            },
          })
        );
      }
      return;
    }

    // Nuevas acciones para tickets de soporte
    if (action === 'report_bug') {
      queueOrSaveUserMessage('🐛 Reportar Error');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: 'Por favor, describe el error que encontraste. Incluye todos los detalles posibles como qué estabas haciendo cuando ocurrió el problema.',
          sender: 'bot',
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (action === 'general_question') {
      queueOrSaveUserMessage('❓ Pregunta General');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: '¡Perfecto! Hazme tu pregunta y te ayudaré con la información que necesites sobre Artiefy.',
          sender: 'bot',
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (action === 'technical_issue') {
      queueOrSaveUserMessage('🔧 Problema Técnico');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: 'Entiendo que tienes un problema técnico. Describe detalladamente qué está pasando y qué dispositivo/navegador estás usando.',
          sender: 'bot',
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (action === 'payment_inquiry') {
      queueOrSaveUserMessage('💰 Consulta de Pagos');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: 'Te ayudo con tu consulta de pagos. ¿Tienes algún problema con una transacción, facturación o necesitas información sobre los planes?',
          sender: 'bot',
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // Nuevas acciones para proyectos
    if (action === 'view_projects') {
      queueOrSaveUserMessage('📊 Ver Mis Proyectos');
      if (!isSignedIn) {
        router.push('/sign-in');
      } else {
        router.push('/proyectos');
      }
      return;
    }

    if (action === 'project_ideas') {
      queueOrSaveUserMessage('💡 Ideas de Proyectos');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: '¡Excelente! Puedo ayudarte a generar ideas de proyectos basadas en tus intereses. ¿En qué área te gustaría enfocar tu proyecto?',
          sender: 'bot',
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (action === 'project_tracking') {
      queueOrSaveUserMessage('🎯 Seguimiento');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: 'Te ayudo con el seguimiento de tus proyectos. ¿Qué aspecto específico quieres revisar o mejorar en tu proyecto?',
          sender: 'bot',
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (action.startsWith('select_course_')) {
      const idStr = action.replace('select_course_', '');
      const courseIdNum = parseInt(idStr, 10);
      if (Number.isNaN(courseIdNum)) return;
      queueOrSaveUserMessage(`Seleccionó curso id ${courseIdNum}`);
      router.push(`/estudiantes/cursos/${courseIdNum}`);
      return;
    }

    if (action.startsWith('create_project_')) {
      const idStr = action.replace('create_project_', '');
      const courseIdNum = parseInt(idStr, 10);
      if (Number.isNaN(courseIdNum)) return;
      queueOrSaveUserMessage(`Crear proyecto para curso ${courseIdNum}`);
      router.push(`/proyectos?courseId=${courseIdNum}`);
      return;
    }

    if (action === 'save_project_draft') {
      if (!pendingProjectDraft) {
        toast.error('No hay borrador disponible para guardar.');
        return;
      }
      if (!isSignedIn) {
        toast.info('Inicia sesión para guardar tu proyecto.');
        router.push('/sign-in');
        return;
      }

      const draft = pendingProjectDraft;
      // Mapear a la forma que espera /api/projects (ProjectData)
      const payload = {
        name: draft.projectName || 'Proyecto sin título',
        planteamiento: draft.planteamiento || '',
        justificacion: draft.justificacion || '',
        objetivo_general: draft.objetivoGeneral || '',
        objetivos_especificos: draft.objetivosEspecificos.map((t, i) => ({
          id: `obj_${i + 1}`,
          title: t,
        })),
        actividades: draft.actividades.map((a) => ({
          descripcion: a.descripcion,
          meses: [],
        })),
        type_project: draft.typeProject ?? 'AI-Assistant',
        categoryId: Number.isFinite(draft.categoryId) ? draft.categoryId! : 1,
        isPublic: false,
        // Indicar que es un borrador parcial y desde qué paso viene
        projectStep: 'partial_from_agent',
        draft: true,
        // Opcionales de cronograma; el backend los acepta opcionalmente:
        // fechaInicio, fechaFin, tipoVisualizacion, horasPorDia, totalHoras, tiempoEstimado, diasEstimados, diasNecesarios
      };

      setIsLoading(true);
      fetch('/api/projects?draft=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            let errorMsg = 'Error creando el proyecto';
            if (
              err &&
              typeof err === 'object' &&
              'error' in err &&
              typeof (err as Record<string, unknown>).error === 'string'
            ) {
              errorMsg = (err as Record<string, unknown>).error as string;
            }
            console.error(errorMsg);
            toast.error(errorMsg);
            return;
          }
          return res.json() as Promise<{ id?: number }>;
        })
        .then((data) => {
          if (!data) return;
          toast.success('Proyecto guardado correctamente.');
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              text: '✅ Tu proyecto fue creado. Puedes continuar desarrollándolo en la sección de proyectos.',
              sender: 'bot',
              buttons: data.id
                ? [
                    {
                      label: '🔎 Ver proyecto',
                      action: `open_project_${data.id}`,
                    },
                  ]
                : undefined,
            },
          ]);
          setPendingProjectDraft(null);
        })
        .catch((e) => {
          console.error(e);
          toast.error('No se pudo guardar el proyecto.');
        })
        .finally(() => setIsLoading(false));

      return;
    }

    if (action.startsWith('open_project_')) {
      const idStr = action.replace('open_project_', '');
      const pid = parseInt(idStr, 10);
      if (!Number.isNaN(pid)) {
        router.push(`/proyectos/DetallesProyectos/${pid}`);
      }
      return;
    }

    if (action.startsWith('save_field_')) {
      void saveDraftField(action);
      return;
    }

    console.log('Acción de botón no gestionada:', action);
  };

  // Modifica la función parseN8nCoursesMessage para aceptar el formato { message: { text: ... } }
  // function parseN8nCoursesMessage(message: string | { text?: string }): {
  //   mensaje_inicial?: string;
  //   mensaje?: string;
  //   courses?: { id: number; title: string; modalidad?: string; modalidadId?: number }[];
  //   pregunta_final?: string;
  //   intent?: string;
  // } | null {
  //   let text = '';
  //   if (typeof message === 'string') {
  //     text = message;
  //   } else if (message && typeof message === 'object' && typeof message.text === 'string') {
  //     text = message.text;
  //   }
  //   try {
  //     const obj = JSON.parse(text) as {
  //       mensaje_inicial?: string;
  //       mensaje?: string;
  //       courses?: { id: number; title: string; modalidad?: string; modalidadId?: number }[];
  //       pregunta_final?: string;
  //       intent?: string;
  //     };
  //     // Solo retorna si es un objeto y tiene al menos mensaje o courses
  //     if (
  //       obj &&
  //       (typeof obj.mensaje_inicial === 'string' ||
  //         typeof obj.mensaje === 'string' ||
  //         (Array.isArray(obj.courses) && obj.courses.length > 0))
  //     ) {
  //       return obj;
  //     }
  //   } catch {
  //     // No es JSON válido
  //   }
  //   return null;
  // }

  // Modifica renderMessage para mostrar la modalidad real desde la BD (relación cursos-modalidades)
  const renderMessage = (message: ChatMessage, _idx?: number) => {
    let textToShow: string = message.text;

    // Si message.text es un objeto con campo text, úsalo
    if (
      typeof message.text === 'object' &&
      message.text !== null &&
      'text' in (message.text as Record<string, unknown>) &&
      typeof (message.text as Record<string, unknown>).text === 'string'
    ) {
      textToShow = (message.text as Record<string, string>).text;
    }

    // Si message.text es un objeto con campo message.text, úsalo (caso doble anidado)
    if (
      typeof message.text === 'object' &&
      message.text !== null &&
      'message' in (message.text as Record<string, unknown>) &&
      typeof (message.text as Record<string, unknown>).message === 'object' &&
      (message.text as { message: unknown }).message !== null &&
      'text' in
        ((message.text as { message: unknown }).message as Record<
          string,
          unknown
        >) &&
      typeof (
        (message.text as { message: unknown }).message as Record<
          string,
          unknown
        >
      ).text === 'string'
    ) {
      const nested = (
        (message.text as { message: unknown }).message as Record<
          string,
          unknown
        >
      ).text;
      if (typeof nested === 'string') {
        textToShow = nested;
      }
    }

    // NUEVO: Detectar bloque de "Aquí tienes la descripción del curso que solicitaste:" o títulos en **bold**
    if (
      typeof textToShow === 'string' &&
      (textToShow.includes(
        'Aquí tienes la descripción del curso que solicitaste'
      ) ||
        /\*\*.+?\*\*/.test(textToShow))
    ) {
      try {
        // 1) Caso explícito con "**Título:**" / "**Descripción:**" (compatibilidad previa)
        const titleMatch = /\*\*\s*Título\s*:\s*\*\*\s*(.+)/i.exec(textToShow);
        const descMatch = /\*\*\s*Descripción\s*:\s*\*\*\s*([\s\S]+)/i.exec(
          textToShow
        );

        let title = titleMatch ? titleMatch[1].trim() : undefined;
        let description = descMatch ? descMatch[1].trim() : undefined;

        // 2) Fallback: detectar primer bloque en negrita inline: "El curso **Título** ..."
        if (!title) {
          const boldInline = /\*\*(.+?)\*\*/.exec(textToShow);
          if (boldInline) {
            title = boldInline[1].trim();
            // Extraer la descripción: quitar el bloque **title** y cualquier encabezado inicial
            // quitar frases como "El curso", "El módulo", y el encabezado "Aquí tienes..."
            description = textToShow
              .replace(boldInline[0], '') // quitar **Title**
              .replace(
                /Aquí tienes la descripción del curso que solicitaste[:\s]*/i,
                ''
              )
              .replace(/^(El curso|El módulo|Curso)\s*[:,-]?\s*/i, '')
              .trim();
            // Si la descripción empieza con ":" o "-" quitarlo
            description = description.replace(/^[:\-\s]+/, '').trim();
          }
        }

        // 3) Si aún no hay descripción pero el texto contiene la frase completa,
        //    intentar extraer después de la frase "Aquí tienes la descripción..."
        if (!description && textToShow.includes('Aquí tienes la descripción')) {
          const afterPhrase = textToShow.split(
            'Aquí tienes la descripción del curso que solicitaste:'
          )[1];
          if (afterPhrase) description = afterPhrase.trim();
        }

        // 4) Otros fallback: buscar primera línea larga como descripción
        if (!description) {
          const lines = textToShow
            .split(/\n{1,}/)
            .map((l) => l.trim())
            .filter(Boolean);
          // si bold encontrado, quitar la línea que contiene el título
          if (title) {
            const filtered = lines.filter((l) => !l.includes(title));
            if (filtered.length > 0) description = filtered.join('\n\n');
          } else if (lines.length > 1) {
            description = lines.slice(1).join('\n\n');
          } else {
            description = lines[0] ?? '';
          }
        }

        // Render estilizado conservando los colores actuales
        if (title || description) {
          return (
            <div className="bg-background max-w-[90%] rounded-2xl px-4 py-4 shadow">
              {title && (
                <h3 className="mb-2 text-xl leading-tight font-extrabold text-white">
                  {title}
                </h3>
              )}
              {description && (
                <p className="leading-relaxed text-white">{description}</p>
              )}
              {/* Mantener posible pregunta final si viene después del bloque */}
              {/\?$/m.test(textToShow) && (
                <p className="mt-3 font-semibold text-white">
                  {(() => {
                    const qMatch = /([^\n?]+\?.*)$/m.exec(textToShow);
                    return qMatch ? qMatch[0].trim() : '';
                  })()}
                </p>
              )}
            </div>
          );
        }
      } catch {
        // Si falla el parsing, continuar el flujo normal sin romper la UI
      }
    }

    // NUEVO: Si el texto es un JSON con mensaje_inicial, courses y pregunta_final, renderiza como texto plano
    if (
      typeof textToShow === 'string' &&
      textToShow.trim().startsWith('{') &&
      (textToShow.includes('"mensaje_inicial"') ||
        textToShow.includes('"courses"'))
    ) {
      try {
        // Define un tipo seguro para el objeto parseado
        interface ParsedAgentResponse {
          mensaje_inicial?: string;
          courses?: {
            id: number;
            title: string;
            modalidad?: string;
            modalidadId?: number;
          }[];
          pregunta_final?: string;
        }
        const parsed: unknown = JSON.parse(textToShow);

        // Type guard para validar el objeto
        function isParsedAgentResponse(
          obj: unknown
        ): obj is ParsedAgentResponse {
          return (
            typeof obj === 'object' &&
            obj !== null &&
            ('mensaje_inicial' in obj ||
              'courses' in obj ||
              'pregunta_final' in obj)
          );
        }

        if (isParsedAgentResponse(parsed)) {
          // Usa CoursesCardsWithModalidad para renderizar las tarjetas con botón "Ir al Curso"
          const coursesForCards = Array.isArray(parsed.courses)
            ? (parsed.courses as CourseData[])
            : [];

          // Evita mostrar mensaje_inicial dos veces: solo lo mostramos si hay cursos, y nunca repetido
          // Solo mostramos mensaje_inicial una vez por bloque de cursos
          return (
            <div className="bg-background max-w-[90%] rounded-2xl px-4 py-3 shadow">
              {/* Solo mostrar mensaje_inicial si hay cursos y no es igual al mensaje anterior */}
              {typeof parsed.mensaje_inicial === 'string' && (
                <p className="mb-2 font-semibold text-white">
                  {parsed.mensaje_inicial}
                </p>
              )}

              {coursesForCards.length > 0 && (
                <div className="mb-2">
                  <CoursesCardsWithModalidad
                    courses={coursesForCards}
                    // Siempre pasar coursesData (enriquecido con modalidad real de BD)
                    coursesData={
                      (message.coursesData?.length ?? 0) > 0
                        ? message.coursesData
                        : coursesForCards
                    }
                  />
                </div>
              )}

              {typeof parsed.pregunta_final === 'string' && (
                <p className="font-semibold text-white">
                  {parsed.pregunta_final}
                </p>
              )}
            </div>
          );
        }
      } catch {
        // Si no es JSON válido, sigue el flujo normal
      }
    }

    // Solo intenta parsear JSON si parece JSON y contiene "mensaje"
    if (
      typeof textToShow === 'string' &&
      textToShow.trim().startsWith('{') &&
      textToShow.includes('"mensaje"')
    ) {
      try {
        const parsed: unknown = JSON.parse(textToShow);
        if (
          parsed &&
          typeof parsed === 'object' &&
          'mensaje' in parsed &&
          typeof (parsed as { mensaje?: unknown }).mensaje === 'string'
        ) {
          return (
            <div className="bg-background max-w-[90%] rounded-2xl px-4 py-3 shadow">
              <p className="font-semibold text-white">
                {(parsed as { mensaje: string }).mensaje}
              </p>
            </div>
          );
        }
      } catch {
        // Si no es JSON válido, sigue el flujo normal
      }
    }

    // Si es texto plano (como ahora), muestra la burbuja normal
    if (message.sender === 'bot') {
      // Detecta el mensaje de error genérico y aplica fondo especial
      let msgText = textToShow;
      if (
        typeof msgText === 'string' &&
        (msgText.startsWith('No encontré cursos relacionados con ') ||
          msgText ===
            'No encontramos cursos relacionados en nuestra plataforma. Por favor, intenta con otros términos o revisa la oferta actual de cursos.' ||
          msgText ===
            'Lo siento, hubo un problema al procesar tu búsqueda. Por favor, intenta de nuevo.')
      ) {
        msgText =
          'Lo siento, hubo un problema al procesar tu búsqueda. Por favor, intenta de nuevo.';
      }

      const isNoCursosMsg =
        typeof msgText === 'string' &&
        (msgText.startsWith('No encontré cursos relacionados') ||
          msgText.startsWith('No encontramos cursos relacionados') ||
          msgText ===
            'Lo siento, hubo un problema al procesar tu búsqueda. Por favor, intenta de nuevo.');

      // Detecta el mensaje de error técnico
      const isTechnicalError =
        msgText ===
        'Lo siento, estoy teniendo dificultades técnicas. Puedes intentar reformular tu pregunta o contactar soporte si el problema persiste.';

      // Detecta bienvenida e idea
      const isWelcome =
        msgText ===
        '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎';
      const isIdea = msgText === '¡Cuéntame tu nueva idea!';

      // Unifica todos los casos que deben tener fondo especial
      if (isWelcome || isIdea || isNoCursosMsg || isTechnicalError) {
        return (
          <div className="bg-background max-w-[90%] rounded-2xl px-4 py-3 shadow">
            <p className="font-semibold text-white">{msgText}</p>
          </div>
        );
      }

      const parts = message.text.split('\n\n');
      const introText = parts[0];
      const courseTexts = parts.slice(1);

      const courses = courseTexts
        .map((text: string) => {
          const regex = /^(\d+)\.\s+(.*?)\s+\|\s+(\d+)$/;
          const match = regex.exec(text);
          if (!match) return null;
          return {
            number: parseInt(match[1]),
            title: match[2].trim(),
            id: parseInt(match[3]),
          };
        })
        .filter(
          (course): course is { number: number; title: string; id: number } =>
            Boolean(course)
        );

      if (courses.length === 0) {
        // Para cualquier otro mensaje del bot, pon también el fondo
        return (
          <div className="agent-response flex flex-col space-y-4">
            <div className="">
              {message.text.split('\n').map((line: string, index: number) => {
                if (
                  /^(Carreras|Diplomados|Cursos|Financiación)/i.test(
                    line.trim()
                  )
                ) {
                  return (
                    <h4
                      key={index}
                      className="text-base font-semibold text-white"
                    >
                      {line}
                    </h4>
                  );
                }
                if (/\$\d[\d.]*\s?COP/.test(line)) {
                  return (
                    <p key={index} className="text-white">
                      <span className="font-medium text-cyan-300">{line}</span>
                    </p>
                  );
                }
                if (line.trim() === '') {
                  return <div key={index} className="h-2" />;
                }
                return (
                  <p key={index} className="leading-relaxed text-white">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col space-y-4">
          <div className="bg-background max-w-[90%] rounded-2xl px-4 py-3 shadow">
            <p className="font-medium text-white">{introText}</p>
          </div>
          <div className="grid gap-4">
            <CoursesCardsWithModalidad
              courses={courses.map((c) => ({ id: c.id, title: c.title }))}
              coursesData={message.coursesData}
            />
            <button
              className="group relative mt-3 w-full overflow-hidden rounded-lg border border-cyan-500 bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-400 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-cyan-500/50"
              onClick={() => {
                // lógica del proyecto
              }}
            >
              <span className="relative z-10">+ Agregar proyecto</span>
              <span className="absolute inset-0 bg-cyan-400/10 blur-md transition-all duration-500 ease-in-out group-hover:blur-lg" />
              <span className="absolute top-0 left-0 h-full w-1 animate-pulse bg-cyan-500" />
            </button>
          </div>
        </div>
      );
    }

    // Mensaje del usuario (sin fondo especial)
    return (
      <div className="flex flex-col space-y-4">
        <p className="font-medium whitespace-pre-line text-gray-800">
          {message.text}
        </p>
        {message.buttons && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.buttons
              .filter(
                (btn: { label: string; action: string }) =>
                  !(btn.action === 'contact_support' && !isSignedIn)
              )
              .map((btn: { label: string; action: string }) => (
                <button
                  key={btn.action}
                  className="rounded bg-cyan-600 px-3 py-1 font-semibold text-white transition hover:bg-cyan-700"
                  onClick={() => handleBotButtonClick(btn.action)}
                  type="button"
                >
                  {btn.label}
                </button>
              ))}
          </div>
        )}
      </div>
    );
  };

  // Emitir eventos globales para ocultar/mostrar el botón de soporte
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('student-chat-open'));
    } else {
      window.dispatchEvent(new CustomEvent('student-chat-close'));
    }
  }, [isOpen]);

  function handleDeleteHistory(
    event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    if (event) event.preventDefault();
    const conversationId = chatMode.idChat;

    // Si existe una conversación persistida en BD, pedir al servidor que la elimine
    if (conversationId && conversationId < 1000000000000) {
      void (async () => {
        try {
          setIsLoading(true);
          const res = await fetch('/api/chats/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId }),
          });

          // Tipar la respuesta como unknown y validar si tiene "error"
          const data: unknown = await res.json();

          const serverError =
            !res.ok ||
            (typeof data === 'object' &&
              data !== null &&
              'error' in data &&
              typeof (data as Record<string, unknown>).error === 'string');

          if (serverError) {
            console.error('Error deleting conversation:', data);
            toast.error('No se pudo eliminar el historial en el servidor');
          } else {
            // limpiar estado local
            setMessages([
              {
                id: Date.now(),
                text: '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
                sender: 'bot',
                buttons: [
                  { label: '📚 Crear Proyecto', action: 'new_project' },
                  { label: '💬 Nueva Idea', action: 'new_idea' },
                  { label: '🛠 Soporte Técnico', action: 'contact_support' },
                ],
              },
            ]);
            setInputText('');
            setIdea({ selected: false, idea: '' });
            setChatMode({ idChat: null, status: true, curso_title: '' });
            toast.success('Historial eliminado');
          }
        } catch (error) {
          console.error('Error deleting conversation:', error);
          toast.error('Error al eliminar historial');
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

    // Si no hay conversación persistida, solo limpiar localmente
    setMessages([
      {
        id: Date.now(),
        text: '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
        sender: 'bot',
        buttons: [
          { label: '📚 Crear Proyecto', action: 'new_project' },
          { label: '💬 Nueva Idea', action: 'new_idea' },
          { label: '🛠 Soporte Técnico', action: 'contact_support' },
        ],
      },
    ]);
    setInputText('');
    setIdea({ selected: false, idea: '' });
    toast.success('Historial de chat eliminado');
  }

  // Renderiza el TooltipProvider en el nivel superior del componente
  return (
    <>
      <Tooltip.Provider>
        <div className={`${className} fixed`} style={{ zIndex: 99999 }}>
          {isAlwaysVisible && (
            <div className="fixed right-6 bottom-6 z-[100001] md:z-50">
              <button
                className={`relative h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 shadow-lg shadow-cyan-500/25 transition-all duration-300 ease-out hover:scale-110 hover:shadow-xl hover:shadow-cyan-400/40 ${isOpen ? 'minimized' : ''} `}
                onMouseEnter={() => {
                  setIsHovered(true);
                  show();
                }}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20" />
                <div className="absolute inset-1 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="relative">
                    <MessageCircle
                      className={`h-6 w-6 text-cyan-300 transition-all duration-300 ${isHovered ? 'scale-110' : ''} `}
                    />
                    {isHovered && (
                      <Zap className="absolute -top-1 -right-1 h-3 w-3 animate-ping text-yellow-400" />
                    )}
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent, #22d3ee, transparent, #06b6d4, transparent)',
                  }}
                />
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-0 transition-opacity duration-300" />
              </button>

              {isDesktop && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 absolute right-0 bottom-full mb-2 duration-200">
                  <div className="relative">
                    <div className="relative z-10 rounded-lg border border-cyan-400/50 bg-slate-800/90 px-3 py-1 text-sm whitespace-nowrap text-cyan-300 shadow-lg backdrop-blur-sm">
                      Asistente IA
                    </div>
                    <div className="absolute inset-0 animate-pulse rounded-lg bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300 blur-sm">
                      Asistente IA
                    </div>
                    <div className="absolute inset-0 rounded-lg bg-cyan-400/5 px-3 py-1 text-sm text-cyan-300 blur-md">
                      Asistente IA
                    </div>
                    <div className="absolute inset-0 scale-110 rounded-lg bg-cyan-400/20 blur-lg" />
                    <div className="absolute top-full right-4 z-10 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent border-t-slate-800" />
                    <div className="absolute top-full right-4 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent border-t-cyan-400/50 blur-sm" />
                  </div>
                </div>
              )}
            </div>
          )}

          {isOpen && (
            <div
              className={`fixed ${isDesktop ? 'right-0 bottom-0 left-auto' : 'inset-0 top-0 right-0 bottom-0 left-0'} z-[100001]`}
              ref={chatContainerRef}
              style={
                isDesktop
                  ? { right: 0, bottom: 0, left: 'auto', top: 'auto' }
                  : undefined
              }
            >
              <ResizableBox
                width={dimensions.width}
                height={dimensions.height}
                onResize={handleResize}
                minConstraints={
                  isDesktop
                    ? [500, window.innerHeight]
                    : [window.innerWidth, window.innerHeight]
                }
                maxConstraints={[
                  isDesktop
                    ? Math.min(window.innerWidth, window.innerWidth - 20)
                    : window.innerWidth,
                  isDesktop ? window.innerHeight : window.innerHeight,
                ]}
                resizeHandles={isDesktop ? ['sw'] : []}
                className={`chat-resizable ${isDesktop ? 'ml-auto' : ''}`}
              >
                <div
                  className={`relative flex h-full w-full flex-col overflow-hidden ${isDesktop ? 'justify-end rounded-lg border border-gray-200' : ''} bg-white`}
                >
                  {/* Header */}
                  <div className="relative z-[5] flex flex-col bg-white/95 backdrop-blur-sm">
                    <div className="flex items-start justify-between border-b p-3">
                      <HiMiniCpuChip className="mt-1 text-4xl text-blue-500" />
                      <div className="-ml-6 flex flex-1 flex-col items-center">
                        <h2 className="mt-1 text-lg font-semibold text-gray-800">
                          Artie IA
                        </h2>
                        <div className="flex items-center gap-2">
                          <em className="text-sm font-semibold text-gray-600">
                            {user?.fullName}
                          </em>
                          <div className="relative inline-flex">
                            <div className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-green-500/30" />
                            <div className="relative h-2.5 w-2.5 rounded-full bg-green-500" />
                          </div>
                        </div>
                      </div>

                      <div className="flex">
                        <button
                          className="ml-2 rounded-full p-1.5 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200"
                          aria-label="Minimizar chatbot"
                        >
                          {!isChatPage &&
                            (chatMode.status ? (
                              <MdArrowBack
                                className="text-xl text-gray-500"
                                onClick={() => {
                                  setChatMode({
                                    idChat: null,
                                    status: true,
                                    curso_title: '',
                                  });
                                  setShowChatList(true);
                                }}
                              />
                            ) : null)}
                        </button>

                        <button
                          onClick={handleDeleteHistory}
                          className="ml-2 rounded-full p-1.5 transition-colors hover:bg-gray-100"
                          aria-label="Borrar historial"
                          title="Borrar historial"
                        >
                          <TrashIcon className="text-xl text-red-500" />
                        </button>

                        <button
                          onClick={() => setIsOpen(false)}
                          className="rounded-full p-1.5 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200"
                          aria-label="Cerrar chatbot"
                        >
                          <IoClose className="text-xl text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <ChatNavigation
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                  />

                  {/* Aviso de login requerido cuando la búsqueda abre el chat sin sesión */}
                  {activeSection === 'chatia' &&
                    showLoginNotice &&
                    !isSignedIn && (
                      <div className="border-foreground/10 bg-background/60 mx-3 mt-3 rounded-lg border p-4 text-center">
                        <p className="text-sm text-white">
                          Debes iniciar sesión para seguir la conversación
                        </p>
                        <button
                          onClick={() => {
                            const currentUrl = encodeURIComponent(
                              window.location.href
                            );
                            window.location.href = `/sign-in?redirect_url=${currentUrl}`;
                          }}
                          className="bg-background hover:bg-background/90 focus:ring-background mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                        >
                          Iniciar sesión
                        </button>
                      </div>
                    )}

                  {/* Contenido basado en la sección activa */}
                  {activeSection === 'tickets' ? (
                    chatMode.status && isSignedIn ? (
                      <ChatList
                        setChatMode={setChatMode}
                        setShowChatList={setShowChatList}
                        activeType="tickets"
                      />
                    ) : !isSignedIn ? (
                      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                        <div className="mb-6">
                          <div className="bg-background/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                            <svg
                              className="h-8 w-8 text-black"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <h3 className="mb-2 text-lg font-semibold text-black">
                            Acceso restringido
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            Debes iniciar sesión para crear y gestionar tickets
                            de soporte
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const currentUrl = encodeURIComponent(
                              window.location.href
                            );
                            window.location.href = `/sign-in?redirect_url=${currentUrl}`;
                          }}
                          className="bg-background hover:bg-background/90 focus:ring-background rounded-lg px-6 py-3 font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                        >
                          Iniciar sesión
                        </button>
                      </div>
                    ) : null
                  ) : activeSection === 'projects' ? (
                    chatMode.status && isSignedIn ? (
                      <ChatList
                        setChatMode={setChatMode}
                        setShowChatList={setShowChatList}
                        activeType="projects"
                      />
                    ) : null
                  ) : activeSection === 'chatia' ? (
                    chatMode.status && !isSignedIn ? (
                      <ChatMessages
                        idea={idea}
                        setIdea={setIdea}
                        setShowChatList={setShowChatList}
                        courseId={courseId}
                        isEnrolled={isEnrolled}
                        courseTitle={courseTitle}
                        messages={
                          messages as {
                            id: number;
                            text: string;
                            sender: string;
                            coursesData?: { id: number; title: string }[];
                          }[]
                        }
                        setMessages={
                          setMessages as React.Dispatch<
                            React.SetStateAction<
                              { id: number; text: string; sender: string }[]
                            >
                          >
                        }
                        chatMode={chatMode}
                        setChatMode={setChatMode}
                        inputText={inputText}
                        setInputText={setInputText}
                        handleSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        messagesEndRef={
                          messagesEndRef as React.RefObject<HTMLDivElement>
                        }
                        isSignedIn={isSignedIn}
                        inputRef={inputRef as React.RefObject<HTMLInputElement>}
                        renderMessage={
                          renderMessage as (
                            message: {
                              id: number;
                              text: string;
                              sender: string;
                              coursesData?: { id: number; title: string }[];
                            },
                            idx: number
                          ) => React.ReactNode
                        }
                        onDeleteHistory={handleDeleteHistory}
                        onBotButtonClick={handleBotButtonClick}
                      />
                    ) : chatMode.status && isSignedIn && chatMode.idChat ? (
                      <ChatMessages
                        idea={idea}
                        setIdea={setIdea}
                        setShowChatList={setShowChatList}
                        courseId={courseId}
                        isEnrolled={isEnrolled}
                        courseTitle={courseTitle}
                        messages={
                          messages as {
                            id: number;
                            text: string;
                            sender: string;
                            coursesData?: { id: number; title: string }[];
                          }[]
                        }
                        setMessages={
                          setMessages as React.Dispatch<
                            React.SetStateAction<
                              { id: number; text: string; sender: string }[]
                            >
                          >
                        }
                        chatMode={chatMode}
                        setChatMode={setChatMode}
                        inputText={inputText}
                        setInputText={setInputText}
                        handleSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        messagesEndRef={
                          messagesEndRef as React.RefObject<HTMLDivElement>
                        }
                        isSignedIn={isSignedIn}
                        inputRef={inputRef as React.RefObject<HTMLInputElement>}
                        renderMessage={
                          renderMessage as (
                            message: {
                              id: number;
                              text: string;
                              sender: string;
                              coursesData?: { id: number; title: string }[];
                            },
                            idx: number
                          ) => React.ReactNode
                        }
                        onDeleteHistory={handleDeleteHistory}
                        onBotButtonClick={handleBotButtonClick}
                      />
                    ) : (
                      chatMode.status &&
                      isSignedIn &&
                      !chatMode.idChat && (
                        <ChatList
                          setChatMode={setChatMode}
                          setShowChatList={setShowChatList}
                          activeType="chatia"
                        />
                      )
                    )
                  ) : null}
                </div>
              </ResizableBox>
            </div>
          )}
        </div>
      </Tooltip.Provider>
      <style jsx global>{`
        .chat-resizable input,
        .chat-resizable textarea {
          color: #111 !important;
        }
      `}</style>
    </>
  );
};

export default StudentChatbot;

// Mueve extractN8nPayload aquí para evitar error TS2304
function extractN8nPayload(x: unknown): N8nPayload | null {
  if (typeof x !== 'object' || x === null) return null;
  const anyX = x as Record<string, unknown>;
  if ('n8nData' in anyX) {
    const nd = anyX.n8nData;
    if (
      nd &&
      typeof nd === 'object' &&
      'output' in (nd as Record<string, unknown>) &&
      typeof (nd as Record<string, unknown>).output === 'string'
    ) {
      const output = (nd as Record<string, string>).output;
      try {
        // Si output es JSON, parsea normalmente
        return JSON.parse(output) as N8nPayload;
      } catch {
        // Si output es texto plano, devuélvelo como { mensaje: output }
        return { mensaje: output };
      }
    }
    if (nd && typeof nd === 'object') return nd as N8nPayload;
  }
  if ('output' in anyX && typeof anyX.output === 'string') {
    const output = anyX.output;
    try {
      return JSON.parse(output) as N8nPayload;
    } catch {
      return { mensaje: output };
    }
  }
  const keys = Object.keys(anyX);
  if (
    keys.some((k) =>
      [
        'mensaje',
        'mensaje_inicial',
        'courses',
        'courseDescription',
        'projectPrompt',
      ].includes(k)
    )
  ) {
    return anyX as unknown as N8nPayload;
  }
  return null;
}

// Nuevo componente para renderizar las tarjetas de cursos con modalidad real
const CoursesCardsWithModalidad = React.memo(
  ({
    courses,
    coursesData,
  }: {
    courses: CourseData[];
    coursesData?: CourseData[];
  }) => {
    // Modalidades correctas desde BD si existen en coursesData (n8n ya las incluye)
    const bdModalidades = new Map<number, string>();
    if (Array.isArray(coursesData)) {
      coursesData.forEach((c) => {
        if (typeof c.id === 'number') {
          // Usar modalidad como string (preferido, ya enriquecido en handleN8nData)
          if (typeof c.modalidad === 'string' && c.modalidad.trim() !== '') {
            bdModalidades.set(c.id, c.modalidad);
          }
        }
      });
    }

    return (
      <div className="mt-2 flex flex-wrap gap-3">
        {/* Mostrar hasta 5 cursos */}
        {courses.slice(0, 5).map((course) => {
          // Modalidad real: siempre la de BD si está en coursesData, si no la que traiga en course
          const modalidadReal =
            bdModalidades.get(course.id) ?? course.modalidad ?? 'N/A';
          return (
            <Card
              key={course.id}
              className="text-primary max-w-[260px] min-w-[300px] overflow-hidden rounded-lg bg-[#0b2433] transition-all hover:scale-[1.02]"
            >
              <div className="flex flex-col items-start px-4 py-3">
                <h4 className="mb-1 font-bold text-white">{course.title}</h4>
                <span className="mb-2 text-xs font-semibold text-[#2ecc71]">
                  Modalidad: {modalidadReal}
                </span>
                <Link
                  href={`/estudiantes/cursos/${course.id}`}
                  className="group/button relative mt-auto inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-md border border-white bg-[#01142B] p-2 text-sm font-semibold text-[#3AF4EF] transition hover:bg-gray-600 active:scale-95"
                >
                  <span className="font-bold">Ir al Curso</span>
                  <svg
                    className="animate-bounce-right ml-2 h-5 w-5 text-[#3AF4EF]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
);
