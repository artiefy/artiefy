'use client';
// By Jean
import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowRightCircleIcon, TrashIcon } from '@heroicons/react/24/solid';
import * as Tooltip from '@radix-ui/react-tooltip';
import { MessageCircle, Zap } from 'lucide-react';
import { GoArrowLeft } from 'react-icons/go';
import { HiMiniCpuChip } from 'react-icons/hi2';
import { IoMdClose } from 'react-icons/io';
import { ResizableBox } from 'react-resizable';
import { toast } from 'sonner';

import { useExtras } from '~/app/estudiantes/StudentContext';
import { Badge } from '~/components/estudiantes/ui/badge';
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

interface Curso {
  id: number;
  title: string;
}

// Añadir una nueva interfaz para los datos del curso
interface CourseData {
  id: number;
  title: string;
  modalidad?: string;
  modalidadId?: number; // <-- Añade modalidadId para identificar la modalidad
}

// Tipos fuertes para la respuesta de n8n
interface N8nPayload {
  mensaje_inicial?: string;
  cursos?: Curso[];
  pregunta_final?: string;
}
interface N8nApiResponse {
  prompt: string;
  n8nData: N8nPayload;
}

// Añade la interfaz para los botones y actualiza el tipo de mensaje
interface ChatButton {
  label: string;
  action: string;
}
interface ChatMessage {
  id: number;
  text: string;
  sender: string;
  buttons?: ChatButton[];
  coursesData?: CourseData[];
}

// Hook para obtener descripciones de modalidades
function useModalidadDescriptions() {
  const [modalidadMap, setModalidadMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchModalidades() {
      try {
        const res = await fetch('/api/modalidades');
        const data: { name: string; description: string | null }[] =
          await res.json();
        const map: Record<string, string> = {};
        for (const m of data) {
          map[m.name] = m.description ?? '';
        }
        setModalidadMap(map);
      } catch {
        setModalidadMap({});
      }
    }
    fetchModalidades();
  }, []);

  return modalidadMap;
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
  const inputRef = useRef<HTMLInputElement>(null); // <-- Soluciona el error inputRef
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

  // Usa el hook aquí para obtener el mapa de descripciones
  const modalidadDescriptions = useModalidadDescriptions();

  // Añade los estados necesarios para el flujo n8n
  const [n8nCourses, setN8nCourses] = useState<CourseData[]>([]);
  const [showFinalQuestion, setShowFinalQuestion] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [selectedCourseDescription, setSelectedCourseDescription] =
    useState<string>('');
  const [showCreateProjectButtons, setShowCreateProjectButtons] =
    useState(false);

  // Añade una línea para "usar" los estados y evitar el warning de ESLint

  void [
    showFinalQuestion,
    showCourseList,
    selectedCourse,
    selectedCourseDescription,
    showCreateProjectButtons,
  ];

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

  // Helper: intenta guardar mensaje bot ahora o encola.
  const queueOrSaveBotMessage = (text: string, coursesData?: CourseData[]) => {
    const currentChatId = chatModeRef.current.idChat;
    if (currentChatId && currentChatId < 1000000000000) {
      // Save immediately
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
    // Encolar
    pendingBotSaves.current.push({ text, coursesData });
  };

  // Helper: intenta guardar mensaje usuario ahora o encola.
  const queueOrSaveUserMessage = (text: string, sender = 'user') => {
    const currentChatId = chatModeRef.current.idChat;
    if (currentChatId && currentChatId < 1000000000000) {
      void saveMessages(user?.id ?? '', currentChatId, [
        { text, sender, sender_id: user?.id ?? '' },
      ]);
      return;
    }
    // Encolar
    pendingUserSaves.current.push({ text, sender });
  };

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

  // Type guards
  const isN8nApiResponse = (x: unknown): x is N8nApiResponse =>
    typeof x === 'object' && x !== null && 'n8nData' in x;

  // ----------------------- ADDED: Type guards for external data -----------------------
  /**
   * Valida un objeto de curso que proviene de n8n / iahome
   */
  function isCourseRaw(x: unknown): x is {
    id: number;
    title: string;
    modalidad?: string;
    modalidadId?: number;
  } {
    // basic shape check
    if (typeof x !== 'object' || x === null) return false;
    const anyX = x as Record<string, unknown>;
    return typeof anyX.id === 'number' && typeof anyX.title === 'string';
  }

  /**
   * Valida una posible respuesta de /api/iahome
   */
  function isIahomeResponse(
    x: unknown
  ): x is { response?: string; courses?: unknown[] } {
    if (typeof x !== 'object' || x === null) return false;
    const anyX = x as Record<string, unknown>;
    return 'response' in anyX || 'courses' in anyX;
  }

  // Modificado: handleBotResponse ahora acepta opciones y solo usa n8n si useN8n === true
  const handleBotResponse = useCallback(
    async (query: string, options?: { useN8n?: boolean }) => {
      const useN8n = options?.useN8n === true;
      if (processingQuery || searchRequestInProgress.current) return;

      searchRequestInProgress.current = true;
      setProcessingQuery(true);
      setIsLoading(true);

      try {
        if (useN8n) {
          const result = await fetch('/api/ia-cursos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: query }),
          });
          if (!result.ok) throw new Error(`HTTP ${result.status}`);
          const text = await result.text();
          if (!text) throw new Error('Respuesta vacía del servidor');

          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch (_err) {
            // Cambia err a _err
            console.error('JSON parse error n8n:', _err);
            throw new Error('Respuesta inválida de n8n');
          }

          if (isN8nApiResponse(parsed)) {
            const n8nResponse = parsed.n8nData;

            // Guardar cursos para el flujo de botones
            if (
              Array.isArray(n8nResponse.cursos) &&
              n8nResponse.cursos.length
            ) {
              const coursesData: CourseData[] = n8nResponse.cursos
                .filter(isCourseRaw)
                .map((c: Curso) => ({
                  id: c.id,
                  title: c.title,
                  modalidad: (c as CourseData).modalidad,
                  modalidadId: (c as CourseData).modalidadId,
                }));
              setN8nCourses(coursesData);

              // --- ADICIÓN: insertar mensaje que contiene coursesData para renderizar las tarjetas ---
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  text: 'Cursos encontrados:',
                  sender: 'bot',
                  coursesData,
                },
              ]);
              // Guardar en BD junto con los datos de cursos
              queueOrSaveBotMessage('Cursos encontrados:', coursesData);
              // -------------------------------------------------------------------------------
            } else {
              setN8nCourses([]);
            }

            // Mostrar intro y pregunta final
            const introText =
              n8nResponse.mensaje_inicial ??
              'He encontrado estos cursos que podrían interesarte:';
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                text: introText,
                sender: 'bot',
              },
            ]);
            queueOrSaveBotMessage(introText);

            // Pregunta final con botones Sí/No
            if (typeof n8nResponse.pregunta_final === 'string') {
              setShowFinalQuestion(true);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  text: n8nResponse.pregunta_final ?? '',
                  sender: 'bot',
                  buttons: [
                    { label: 'Sí', action: 'final_yes' },
                    { label: 'No', action: 'final_no' },
                  ],
                },
              ]);
              queueOrSaveBotMessage(n8nResponse.pregunta_final ?? '');
            }
            setIdea({ selected: false, idea: '' });
            return;
          }

          // fallback n8n
          const fallbackText =
            typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              text: fallbackText,
              sender: 'bot',
            },
          ]);
          queueOrSaveBotMessage(fallbackText);
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
              .filter(isCourseRaw)
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
          'Lo siento, ocurrió un error al procesar tu solicitud.';
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), text: errorMessage, sender: 'bot' },
        ]);
        queueOrSaveBotMessage(errorMessage);
      } finally {
        setIsLoading(false);
        setProcessingQuery(false);
        searchRequestInProgress.current = false;
        onSearchComplete?.();
      }
    },
    [processingQuery, onSearchComplete]
  );

  // useEffect para manejar búsquedas desde StudentDetails
  useEffect(() => {
    const handleCreateNewChatWithSearch = (
      event: CustomEvent<{ query: string }>
    ) => {
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

    queueOrSaveUserMessage(trimmedInput, 'user');
    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');

    if (ideaRef.current.selected) {
      setIdea({ selected: false, idea: trimmedInput });
      await handleBotResponse(trimmedInput, { useN8n: true });
    } else {
      await handleBotResponse(trimmedInput, { useN8n: false });
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
  const handleBotButtonClick = async (action: string) => {
    // Guardar la acción del usuario siempre que sea una acción "usuario"
    // (ej: new_project, new_idea, final_yes, final_no, select_course_X, create_project_X)
    // Guardar label representativa:
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
      // Solo activa n8n cuando el usuario envía la idea (ver handleSendMessage)
      return;
    }

    if (action === 'contact_support') {
      queueOrSaveUserMessage('🛠 Soporte Técnico');
      toast.info('Redirigiendo a soporte técnico');
      return;
    }

    if (action === 'final_yes') {
      queueOrSaveUserMessage('Sí');
      setShowFinalQuestion(false);
      setShowCourseList(true);
      // Mostrar lista de cursos como botones (persistir este mensaje)
      const messagePayload = {
        id: Date.now() + Math.random(),
        text: 'Selecciona un curso para ver la descripción:',
        sender: 'bot',
        buttons: n8nCourses.map((c: CourseData) => ({
          label: c.title,
          action: `select_course_${c.id}`,
        })),
      };
      setMessages((prev) => [...prev, messagePayload]);
      // Guardar cursos también si quieres (podemos adjuntar coursesData vacío aquí,
      // la lista principal ya fue guardada como "Cursos encontrados:")
      queueOrSaveBotMessage('Selecciona un curso para ver la descripción:');
      return;
    }

    if (action === 'final_no') {
      queueOrSaveUserMessage('No');
      setShowFinalQuestion(false);
      setShowCourseList(false);
      setSelectedCourse(null);
      setSelectedCourseDescription('');
      setShowCreateProjectButtons(false);
      // Volver a los botones iniciales (persistir bot reset)
      const resetBot = {
        id: Date.now(),
        text: '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
        sender: 'bot',
        buttons: [
          { label: '📚 Crear Proyecto', action: 'new_project' },
          { label: '💬 Nueva Idea', action: 'new_idea' },
          { label: '🛠 Soporte Técnico', action: 'contact_support' },
        ],
      };
      setMessages([resetBot]);
      queueOrSaveBotMessage(resetBot.text);
      setIdea({ selected: false, idea: '' });
      return;
    }

    if (action.startsWith('select_course_')) {
      const idStr = action.replace('select_course_', '');
      const courseIdNum = parseInt(idStr, 10);
      if (Number.isNaN(courseIdNum)) return;

      // Guardar la selección del usuario (si tenemos título, guardarlo)
      const selected = n8nCourses.find((c) => c.id === courseIdNum);
      queueOrSaveUserMessage(
        selected
          ? `Seleccionó curso: ${selected.title}`
          : `Seleccionó curso id ${courseIdNum}`
      );

      setSelectedCourse(selected ?? null);
      setShowCourseList(false);
      setShowCreateProjectButtons(false);

      try {
        const res = await fetch(`/api/courses/${courseIdNum}`);
        if (!res.ok) throw new Error('No se pudo obtener el curso');
        const courseUnknown = (await res.json()) as unknown;
        let description = 'Sin descripción disponible.';
        if (typeof courseUnknown === 'object' && courseUnknown !== null) {
          const anyCourse = courseUnknown as Record<string, unknown>;
          if (typeof anyCourse.description === 'string') {
            description = anyCourse.description;
          }
        }
        setSelectedCourseDescription(description);
        setShowCreateProjectButtons(true);
        // mostrar y persistir descripción y pregunta siguiente
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: `Descripción del curso: ${description}`,
            sender: 'bot',
          },
          {
            id: Date.now() + 1,
            text: '¿Quieres crear un proyecto de este curso?',
            sender: 'bot',
            buttons: [
              { label: 'Sí', action: `create_project_${courseIdNum}` },
              { label: 'No', action: 'final_no' },
            ],
          },
        ]);
        // Persistir descripción y pregunta en BD
        queueOrSaveBotMessage(`Descripción del curso: ${description}`);
        queueOrSaveBotMessage('¿Quieres crear un proyecto de este curso?');
      } catch (_err) {
        setSelectedCourseDescription('Sin descripción disponible.');
        setShowCreateProjectButtons(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: 'No se pudo cargar la descripción del curso',
            sender: 'bot',
          },
        ]);
        queueOrSaveBotMessage('No se pudo cargar la descripción del curso');
      }
      return;
    }

    if (action.startsWith('create_project_')) {
      const idStr = action.replace('create_project_', '');
      const courseIdNum = parseInt(idStr, 10);
      if (Number.isNaN(courseIdNum)) return;
      // Guardar la decisión del usuario
      queueOrSaveUserMessage(`Crear proyecto para curso ${courseIdNum}`);
      // Abrir modal / navegar
      router.push(`/proyectos?courseId=${courseIdNum}`);
      return;
    }

    console.log('Acción de botón no gestionada:', action);
  };

  // Modifica renderMessage para mostrar el flujo especial
  const renderMessage = (message: ChatMessage, _idx?: number) => {
    if (
      message.sender === 'bot' &&
      'coursesData' in message &&
      message.coursesData
    ) {
      return (
        <div className="flex flex-col space-y-4">
          <p className="font-medium text-gray-800">{message.text}</p>
          <div className="grid gap-4">
            {message.coursesData.map((course) => {
              const modalidad =
                typeof course.modalidad === 'string' ? course.modalidad : '';
              const modalidadDesc =
                modalidad &&
                Object.prototype.hasOwnProperty.call(
                  modalidadDescriptions,
                  modalidad
                )
                  ? modalidadDescriptions[modalidad]
                  : '';

              return (
                <Card
                  key={course.id}
                  className="text-primary overflow-hidden rounded-lg bg-gray-800 transition-all hover:scale-[1.02]"
                >
                  <div className="flex flex-col px-4 py-3">
                    <h4 className="mb-2 text-base font-bold tracking-wide text-white">
                      {course.title}
                    </h4>
                    <Link
                      href={`/estudiantes/cursos/${course.id}`}
                      className="group/button inline-flex h-10 items-center justify-center rounded-md border border-cyan-400 bg-cyan-500/10 px-4 text-cyan-300 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-cyan-400/20 active:scale-95"
                    >
                      <span className="font-semibold tracking-wide">
                        Ir al curso
                      </span>
                      <ArrowRightCircleIcon className="animate-bounce-right ml-2 h-5 w-5 text-cyan-300" />
                    </Link>
                    {modalidad && (
                      <div className="mt-2">
                        {modalidadDesc ? (
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <span>
                                <Badge
                                  variant="destructive"
                                  className="cursor-pointer border-none bg-red-600 text-white"
                                >
                                  {modalidad}
                                </Badge>
                              </span>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                side="bottom"
                                align="center"
                                sideOffset={8}
                                className="z-[99999] rounded border border-gray-200 bg-white px-3 py-2 text-xs text-black shadow-lg"
                              >
                                {modalidadDesc}
                                <Tooltip.Arrow className="fill-white" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="border-none bg-red-600 text-white"
                          >
                            {modalidad}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    // El resto del renderMessage existente (mantiene compatibilidad original)
    if (message.sender === 'bot') {
      const parts = message.text.split('\n\n');
      const introText = parts[0];
      const courseTexts = parts.slice(1);

      const courses = courseTexts
        .map((text) => {
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
        return (
          <div className="flex flex-col space-y-4">
            <div className="space-y-3">
              {message.text.split('\n').map((line, index) => {
                if (
                  /^(Carreras|Diplomados|Cursos|Financiación)/i.test(
                    line.trim()
                  )
                ) {
                  return (
                    <h4
                      key={index}
                      className="text-base font-semibold text-cyan-700"
                    >
                      {line}
                    </h4>
                  );
                }

                if (/\$\d[\d.]*\s?COP/.test(line)) {
                  return (
                    <p key={index} className="text-gray-800">
                      <span className="font-medium text-cyan-600">{line}</span>
                    </p>
                  );
                }

                if (line.trim() === '') {
                  return <div key={index} className="h-2" />;
                }

                return (
                  <p key={index} className="leading-relaxed text-gray-700">
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
          <p className="font-medium text-gray-800">{introText}</p>
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="text-primary overflow-hidden rounded-lg bg-gray-800 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <h4 className="text-base font-bold tracking-wide text-white">
                    {course.number}. {course.title}
                  </h4>
                  <Link
                    href={`/estudiantes/cursos/${course.id}`}
                    className="group/button inline-flex h-12 items-center rounded-md border border-cyan-400 bg-cyan-500/10 px-4 text-cyan-300 shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-cyan-400/20"
                  >
                    <span className="font-semibold tracking-wide">
                      Ver Curso
                    </span>
                    <ArrowRightCircleIcon className="ml-2 h-5 w-5 text-cyan-300 transition-transform duration-300 ease-in-out group-hover/button:translate-x-1" />
                  </Link>
                </div>
              </Card>
            ))}
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

    return (
      <div className="flex flex-col space-y-4">
        <p className="font-medium whitespace-pre-line text-gray-800">
          {message.text}
        </p>
        {message.buttons && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.buttons
              .filter(
                (btn) => !(btn.action === 'contact_support' && !isSignedIn)
              )
              .map((btn) => (
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
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    event.preventDefault();
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
    <Tooltip.Provider>
      <div className={`${className} fixed`} style={{ zIndex: 99999 }}>
        {isAlwaysVisible && (
          <div className="fixed right-6 bottom-6 z-50">
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
            className={`fixed ${isDesktop ? 'right-0 bottom-0' : 'inset-0 top-0 right-0 bottom-0 left-0'}`}
            ref={chatContainerRef}
            style={{ zIndex: 110000 }}
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
                <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-5">
                  <Image
                    src="/artiefy-logo2.svg"
                    alt="Artiefy Logo Background"
                    width={300}
                    height={100}
                    className="w-4/5"
                    priority
                  />
                </div>

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

                {chatMode.status && !isSignedIn ? (
                  <ChatMessages
                    idea={idea}
                    setIdea={setIdea}
                    setShowChatList={setShowChatList}
                    courseId={courseId}
                    isEnrolled={isEnrolled}
                    courseTitle={courseTitle}
                    messages={messages}
                    setMessages={setMessages}
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
                    renderMessage={renderMessage}
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
                    messages={messages}
                    setMessages={setMessages}
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
                    renderMessage={renderMessage}
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

                  <span className="absolute top-1/2 left-1/2 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[#3AF3EE] opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:h-[120px] group-hover:w-[120px] group-hover:opacity-100" />
                </button>
              )}
            </ResizableBox>
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
};

export default StudentChatbot;
