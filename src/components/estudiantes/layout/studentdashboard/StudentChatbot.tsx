'use client';
// By Jean
import { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { TrashIcon } from '@heroicons/react/24/solid';
import * as Tooltip from '@radix-ui/react-tooltip';
import { MessageCircle, Zap } from 'lucide-react';
import { GoArrowLeft } from 'react-icons/go';
import { HiMiniCpuChip } from 'react-icons/hi2';
import { IoMdClose } from 'react-icons/io';
import { ResizableBox } from 'react-resizable';
import { toast } from 'sonner';

import { useExtras } from '~/app/estudiantes/StudentContext';
import { Card } from '~/components/estudiantes/ui/card';
import { getOrCreateConversation } from '~/server/actions/estudiantes/chats/saveChat';
import { saveMessages } from '~/server/actions/estudiantes/chats/saveMessages';

import { ChatMessages } from './StudentChat';
import { ChatList } from './StudentChatList';

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
  isEnrolled, // Añadido para manejar el estado de inscripción
}) => {
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

  // Pruebas para varios chats
  const [chatMode, setChatMode] = useState<{
    idChat: number | null;
    status: boolean;
    curso_title: string;
  }>({ idChat: null, status: true, curso_title: '' });

  // Saber si el chatlist esta abierto
  const [showChatList, setShowChatList] = useState(false);

  const chatModeRef = useRef(chatMode);

  const [idea, setIdea] = useState<{ selected: boolean; idea: string }>({
    selected: false,
    idea: '',
  });

  const [isHovered, setIsHovered] = useState(false);

  const { show } = useExtras();

  const ideaRef = useRef(idea);

  // Añade los estados necesarios para el flujo n8n
  const [n8nCourses, setN8nCourses] = useState<CourseData[]>([]);
  const [pendingProjectDraft, setPendingProjectDraft] =
    useState<ProjectDraft | null>(null);

  // Añade una línea para "usar" los estados y evitar el warning de ESLint

  void [n8nCourses];

  useEffect(() => {
    // Solo se ejecuta en el cliente
    setIsDesktop(window.innerWidth > 768);

    // Si quieres que se actualice al redimensionar:
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    ideaRef.current = idea;
  }, [idea]);

  useEffect(() => {
    const handleNewIdea = () => {
      setIdea({ selected: true, idea: '' });
    };

    window.addEventListener('new-idea', handleNewIdea);

    return () => {
      window.removeEventListener('new-idea', handleNewIdea);
    };
  }, []);

  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  const pathname = usePathname();
  const safePathname = pathname ?? ''; // Usa safePathname en vez de pathname donde sea necesario
  const isChatPage = safePathname === '/';

  const newChatMessage = () => {
    setChatMode({ idChat: null, status: true, curso_title: '' });
    setShowChatList(false);
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
    setIsOpen(true);
    initialSearchDone.current = false;
    setProcessingQuery(false);
    onSearchComplete?.();
    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (ideaRef.current.selected) {
      setIdea({ selected: false, idea: '' });
    }

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }

    // Crear conversación en BD
    const timestamp = Date.now();
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const resultado = `${dia}-${mes}-${anio} ${hora}:${minuto}`;

    getOrCreateConversation({
      senderId: user?.id ?? '',
      cursoId: courseId ?? +Math.round(Math.random() * 100 + 1),
      title: courseTitle ?? 'Nuevo Chat ' + resultado,
    })
      .then((response) => {
        setChatMode({ idChat: response.id, status: true, curso_title: '' });
      })
      .catch((error) => {
        console.error('Error creando nuevo chat:', error);
      });
  };

  // --- ADICIÓN: colas para guardar mensajes si aún no hay conversation id persistido ---
  const pendingBotSaves = useRef<
    { text: string; coursesData?: CourseData[] }[]
  >([]);
  const pendingUserSaves = useRef<{ text: string; sender?: string }[]>([]);

  // Helper: intenta guardar mensaje bot ahora o encola. (memoizado)
  const queueOrSaveBotMessage = useCallback(
    (text: string, coursesData?: CourseData[]) => {
      const currentChatId = chatModeRef.current.idChat;
      if (currentChatId && currentChatId < 1000000000000) {
        void saveMessages('bot', currentChatId, [
          {
            text,
            sender: 'bot',
            sender_id: 'bot',
            coursesData:
              coursesData && coursesData.length > 0 ? coursesData : undefined,
          },
        ]);
        return;
      }
      pendingBotSaves.current.push({ text, coursesData });
    },
    [] // Quitar user?.id ya que no se usa dentro de la función
  );

  // Helper: intenta guardar mensaje usuario ahora o encola. (memoizado)
  const queueOrSaveUserMessage = useCallback(
    (text: string, sender = 'user') => {
      const currentChatId = chatModeRef.current.idChat;
      if (currentChatId && currentChatId < 1000000000000) {
        void saveMessages(user?.id ?? '', currentChatId, [
          { text, sender, sender_id: user?.id ?? '' },
        ]);
        return;
      }
      pendingUserSaves.current.push({ text, sender });
    },
    [user?.id] // Mantener user?.id aquí porque sí se usa
  );

  // Effect: cuando se obtiene un chatId persistido, vaciar colas
  useEffect(() => {
    const flush = async () => {
      const currentChatId = chatModeRef.current.idChat;
      if (!currentChatId || currentChatId >= 1000000000000) return;

      // Flush user saves
      if (pendingUserSaves.current.length > 0) {
        for (const item of pendingUserSaves.current) {
          try {
            await saveMessages(user?.id ?? '', currentChatId, [
              {
                text: item.text,
                sender: item.sender ?? 'user',
                sender_id: user?.id ?? '',
              },
            ]);
          } catch (err) {
            console.error('Error flushing pending user save', err);
          }
        }
        pendingUserSaves.current = [];
      }

      // Flush bot saves
      if (pendingBotSaves.current.length > 0) {
        for (const item of pendingBotSaves.current) {
          try {
            await saveMessages('bot', currentChatId, [
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
      }
    };

    flush().catch((e) => console.error('Error flushing queues:', e));
  }, [chatMode.idChat /* eslint-disable-line react-hooks/exhaustive-deps */]);

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

          const validationData = (await validationRes.json()) as {
            validIds: number[];
          };
          const validCourseIds = validationData.validIds || [];

          // Filtrar solo los cursos que existen en la BD
          const coursesData: CourseData[] = data.courses
            .filter(isCourseData)
            .filter((c) => validCourseIds.includes(c.id))
            .map((c) => ({
              id: c.id,
              title: c.title,
              modalidadId: c.modalidadId,
              modalidad: c.modalidad,
            }));

          if (coursesData.length > 0) {
            setN8nCourses(coursesData);
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

            const shouldOpenProject =
              Boolean(data.projectPrompt) ||
              (typeof data.intent === 'string' &&
                /idea|intenci[óo]n|proyecto/.test(data.intent)) ||
              /como ser|quiero|mi idea|proyecto/i.test(query);

            if (shouldOpenProject) {
              const intro =
                'Ahora, si quieres, definamos el planteamiento, objetivos y actividades de tu proyecto.';
              setMessages((prev) => [
                ...prev,
                { id: Date.now() + Math.random(), text: intro, sender: 'bot' },
              ]);
              queueOrSaveBotMessage(intro);
              window.dispatchEvent(
                new CustomEvent('open-modal-planteamiento', {
                  detail: { text: '' },
                })
              );
            }
          } else {
            // Si no hay cursos válidos, mostrar mensaje de búsqueda alternativa
            const fallbackMsg =
              'Lo siento, estoy teniendo dificultades técnicas. Puedes intentar reformular tu pregunta o contactar soporte si el problema persiste.';
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
          // Fallback: mostrar cursos sin validación (comportamiento anterior)
          const coursesData: CourseData[] = data.courses
            .filter(isCourseData)
            .map((c) => ({
              id: c.id,
              title: c.title,
              modalidadId: c.modalidadId,
              modalidad: c.modalidad,
            }));
          setN8nCourses(coursesData);
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

        setPendingProjectDraft(draft);

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
            buttons: [
              { label: '💾 Guardar proyecto', action: 'save_project_draft' },
            ],
          },
        ]);
        queueOrSaveBotMessage(resumen);
      }
    },
    [queueOrSaveBotMessage, setMessages, setN8nCourses]
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
          const messageHistory = messages.map((m) => ({
            sender: m.sender,
            text: m.text,
          }));

          let n8nSuccess = false;

          try {
            const result = await fetch('/api/ia-cursos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: query,
                conversationId,
                messageHistory,
              }),
            });

            if (result.ok) {
              // CAMBIO: usa result.json() en lugar de .text() + JSON.parse
              const parsed: unknown = await result.json();

              // DEBUG: Agregamos log para ver la respuesta completa
              console.log('Respuesta completa de /api/ia-cursos:', parsed);

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
                  const n8nData: N8nPayload = (api.n8nData ?? {}) as N8nPayload;

                  const maybePayload = extractN8nPayload({ n8nData });
                  if (maybePayload) {
                    await handleN8nData(maybePayload, query);
                    setIdea({ selected: false, idea: '' });
                    n8nSuccess = true;
                  } else {
                    // Fallback para respuestas de n8n sin estructura esperada
                    const initMsg = n8nData.mensaje_inicial;
                    const genericMsg = n8nData.mensaje;

                    if (typeof initMsg === 'string' && initMsg.trim() !== '') {
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
    ]
  );

  // useEffect para manejar búsquedas desde StudentDetails
  useEffect(() => {
    const handleCreateNewChatWithSearch = (
      event: CustomEvent<{ query: string }>
    ): void => {
      const query = event.detail.query;
      if (!query) return;

      const tempChatId = Date.now();

      setChatMode({ idChat: tempChatId, status: true, curso_title: '' });
      setShowChatList(false);

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
      setIsOpen(true);
      initialSearchDone.current = false;
      setProcessingQuery(false);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('force-open-chatbot'));
      }, 50);

      setTimeout(() => {
        const newUserMessage = {
          id: Date.now(),
          text: query,
          sender: 'user' as const,
        };
        setMessages((prev) => [...prev, newUserMessage]);

        void handleBotResponse(query, { useN8n: false });

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
            cursoId: courseId ?? +Math.round(Math.random() * 100 + 1),
            title: `Búsqueda: ${query.substring(0, 30)}... - ${resultado}`,
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
  }, [handleBotResponse, onSearchComplete, courseId, user?.id]);

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
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, initialSearchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleInitialSearch = async () => {
      if (
        !initialSearchQuery?.trim() ||
        !isSignedIn ||
        !showChat ||
        processingQuery ||
        searchRequestInProgress.current ||
        initialSearchDone.current
      )
        return;

      initialSearchDone.current = true;
      setIsOpen(true);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: initialSearchQuery.trim(),
          sender: 'user',
        },
      ]);

      await handleBotResponse(initialSearchQuery.trim(), { useN8n: false });
    };

    void handleInitialSearch();
  }, [
    initialSearchQuery,
    isSignedIn,
    showChat,
    handleBotResponse,
    processingQuery,
  ]);

  useEffect(() => {
    return () => {
      initialSearchDone.current = false;
    };
  }, []);

  useEffect(() => {
    if (!showChat) {
      initialSearchDone.current = false;
      setProcessingQuery(false);
    }
  }, [showChat, processingQuery]);

  useEffect(() => {
    setIsOpen(showChat);
  }, [showChat]);

  useEffect(() => {
    // Set initial dimensions based on window size
    const initialDimensions = {
      width:
        typeof window !== 'undefined' && window.innerWidth < 768
          ? window.innerWidth
          : 500,
      height: window.innerHeight,
    };
    setDimensions(initialDimensions);

    // Add resize handler
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: isMobile ? window.innerWidth : 500,
        height: window.innerHeight,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
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
      toast.info('Redirigiendo a soporte técnico');
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
        // Opcionales de cronograma; el backend los acepta opcionalmente:
        // fechaInicio, fechaFin, tipoVisualizacion, horasPorDia, totalHoras, tiempoEstimado, diasEstimados, diasNecesarios
      };

      setIsLoading(true);
      fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(
              (err as { error?: string })?.error ?? 'Error creando el proyecto'
            );
          }
          return res.json() as Promise<{ id?: number }>;
        })
        .then((data: { id?: number }) => {
          toast.success('Proyecto guardado correctamente.');
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              text: '✅ Tu proyecto fue creado. Puedes continuar desarrollándolo en la sección de proyectos.',
              sender: 'bot',
              buttons: data?.id
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
    // Mensaje del bot en formato JSON (bienvenida, cursos, etc)
    if (
      message.sender === 'bot' &&
      typeof message.text === 'string' &&
      message.text.trim().startsWith('{')
    ) {
      let json: N8nPayload | null = null;
      try {
        const parsed = JSON.parse(message.text) as unknown;
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'message' in parsed &&
          typeof (parsed as { message?: unknown }).message === 'object' &&
          (parsed as { message?: { text?: unknown } }).message &&
          typeof (parsed as { message: { text?: unknown } }).message.text ===
            'string' &&
          (parsed as { message: { text: string } }).message.text
            .trim()
            .startsWith('{')
        ) {
          json = JSON.parse(
            (parsed as { message: { text: string } }).message.text
          ) as N8nPayload;
        } else {
          json = parsed as N8nPayload;
        }
      } catch {
        json = null;
      }
      // Burbuja estilizada para bienvenida del agente IA y otros mensajes
      if (
        json &&
        typeof json.mensaje === 'string' &&
        typeof json.intent === 'string'
      ) {
        // Solo el div de fondo debajo de las letras, sin el div extra
        return (
          <div className="bg-background max-w-[90%] rounded-2xl px-4 py-3 shadow">
            <p className="font-semibold text-white">{json.mensaje}</p>
          </div>
        );
      }
      // Tarjetas para cursos de embedding del flujo n8n
      if (json && Array.isArray(json.courses) && json.courses.length > 0) {
        return (
          <>
            {typeof json.mensaje_inicial === 'string' && (
              <div className="bg-background max-w-[90%] rounded-2xl px-4 py-3 shadow">
                <p className="font-semibold text-white">
                  {json.mensaje_inicial}
                </p>
              </div>
            )}
            <CoursesCardsWithModalidad
              courses={json.courses}
              coursesData={message.coursesData}
            />
            {typeof json.pregunta_final === 'string' && (
              <div className="bg-background mt-2 max-w-[90%] rounded-2xl px-4 py-3 shadow">
                <p className="font-semibold text-white">
                  {json.pregunta_final}
                </p>
              </div>
            )}
          </>
        );
      }
    }

    // Mensajes del bot en texto plano (incluye bienvenida, idea, no encontrado, etc)
    if (message.sender === 'bot') {
      // Detecta el mensaje de error genérico y aplica fondo especial
      let msgText = message.text;
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
              className={`fixed ${isDesktop ? 'right-0 bottom-0' : 'inset-0 top-0 right-0 bottom-0 left-0'} z-[100001]`}
              ref={chatContainerRef}
              // style={{ zIndex: 110000 }} // Elimina style y usa la clase z-[100001]
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
                className="chat-resizable"
              >
                <div
                  className={`relative flex h-full w-full flex-col overflow-hidden ${isDesktop ? 'rounded-lg border border-gray-200' : ''} bg-white`}
                >
                  {/* Header */}
                  <div className="relative z-[5] flex flex-col border-b bg-white/95 p-3 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
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
                          className="ml-2 rounded-full p-1.5 transition-colors hover:bg-gray-100"
                          aria-label="Minimizar chatbot"
                        >
                          {!isChatPage &&
                            (chatMode.status ? (
                              <GoArrowLeft
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
                          className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
                          aria-label="Cerrar chatbot"
                        >
                          <IoMdClose className="text-xl text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Componente ChatMessages con tipos corregidos usando type assertion */}
                  {chatMode.status && !isSignedIn ? (
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
                      />
                    )
                  )}
                </div>

                {chatMode.status && isSignedIn && showChatList && (
                  <button
                    className="group fixed right-[4vh] bottom-32 z-50 h-12 w-12 cursor-pointer overflow-hidden rounded-full bg-[#0f172a] text-[20px] font-semibold text-[#3AF3EE] shadow-[0_0_0_2px_#3AF3EE] transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#164d4a] active:scale-[0.95] active:shadow-[0_0_0_4px_#3AF3EE] md:right-10 md:bottom-10 md:h-16 md:w-16 md:text-[24px]"
                    onClick={() => newChatMessage()}
                  >
                    <span className="relative z-[1] transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-black">
                      +
                    </span>

                    <span className="absolute top-1/2 left-1/2 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[#3AF4EF] opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:h-[120px] group-hover:w-[120px] group-hover:opacity-100" />
                  </button>
                )}
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
      try {
        return JSON.parse((nd as Record<string, string>).output) as N8nPayload;
      } catch {
        return null;
      }
    }
    if (nd && typeof nd === 'object') return nd as N8nPayload;
  }
  if ('output' in anyX && typeof anyX.output === 'string') {
    try {
      return JSON.parse(anyX.output) as N8nPayload;
    } catch {
      return null;
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

// Utilidad para obtener todas las modalidades de la BD (usando la API)
let modalidadesCache: Record<number, string> | null = null;
async function fetchModalidades(): Promise<Record<number, string>> {
  if (modalidadesCache) return modalidadesCache;
  try {
    const res = await fetch('/api/modalidades');
    if (!res.ok) return {};
    const arr = (await res.json()) as { id: number; name: string }[];
    const map: Record<number, string> = {};
    arr.forEach((m) => {
      if (typeof m.id === 'number' && typeof m.name === 'string') {
        map[m.id] = m.name;
      }
    });
    modalidadesCache = map;
    return map;
  } catch {
    return {};
  }
}

// Custom hook para obtener modalidades reales de la BD
function useModalidadesBD(modalidadIds: number[] | undefined) {
  const [modalidadesState, setModalidadesState] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    if (!modalidadIds || modalidadIds.length === 0) return;
    fetchModalidades().then((modalidadesMap: Record<number, string>) => {
      const newState: Record<number, string> = {};
      modalidadIds.forEach((id) => {
        if (id && typeof modalidadesMap[id] === 'string') {
          newState[id] = modalidadesMap[id];
        }
      });
      if (Object.keys(newState).length > 0) {
        setModalidadesState((prev) => ({ ...prev, ...newState }));
      }
    });
  }, [modalidadIds]);

  return modalidadesState;
}

// Nuevo componente para renderizar las tarjetas de cursos con modalidad real
function CoursesCardsWithModalidad({
  courses,
  coursesData,
}: {
  courses: CourseData[];
  coursesData?: CourseData[];
}) {
  // Modalidades correctas desde BD si existen en coursesData
  const bdModalidades = new Map<number, string>();
  if (Array.isArray(coursesData)) {
    coursesData.forEach((c) => {
      if (typeof c.id === 'number') {
        if (typeof c.modalidad === 'string') {
          bdModalidades.set(c.id, c.modalidad);
        } else if (
          c.modalidad &&
          typeof c.modalidad === 'object' &&
          'name' in c.modalidad &&
          typeof (c.modalidad as { name: unknown }).name === 'string'
        ) {
          bdModalidades.set(c.id, (c.modalidad as { name: string }).name);
        }
      }
    });
  }

  const modalidadIds = courses
    ?.map((course) => course.modalidadId)
    .filter((id): id is number => typeof id === 'number');
  const modalidadesState = useModalidadesBD(modalidadIds);

  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {courses.map((course) => {
        let modalidadReal = bdModalidades.get(course.id);
        if (!modalidadReal && typeof course.modalidadId === 'number') {
          modalidadReal ??= modalidadesState[course.modalidadId];
          modalidadReal ??= course.modalidad;
          modalidadReal ??= 'N/A';
        } else if (!modalidadReal) {
          modalidadReal ??= course.modalidad;
          modalidadReal ??= 'N/A';
        }
        return (
          // Usar Card como contenedor único (evita bordes dobles) y aplicar fondo
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
