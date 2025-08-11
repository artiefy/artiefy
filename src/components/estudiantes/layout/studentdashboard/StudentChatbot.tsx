'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import { MessageCircle, Zap } from 'lucide-react';
import { GoArrowLeft } from 'react-icons/go';
import { HiMiniCpuChip } from 'react-icons/hi2';
import { IoMdClose } from 'react-icons/io';
import { ResizableBox } from 'react-resizable';
import { toast } from 'sonner';

// Importar StudentChat
import { useExtras } from '~/app/estudiantes/StudentContext';
import { Card } from '~/components/estudiantes/ui/card';
// Importar StudentChatList.tsx
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

interface BotResponse {
  result: string | Curso[];
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
  const isChatPage = pathname === '/';

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

    console.log('Nuevo mensaje de chat creado');
    if (ideaRef.current.selected) {
      // Si se está esperando una idea, se guarda el mensaje del usuario como idea
      setIdea({ selected: false, idea: '' });
    }

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0; // Resetea el scroll al inicio
    }

    console.log(
      'Nuevo mensaje de chat creado con ref',
      chatModeRef.current.idChat
    );
    console.log('Nuevo mensaje de chat creado chatId', chatMode.idChat);

    // Parseo fe fecha para el título del chat

    const timestamp = Date.now();
    const fecha = new Date(timestamp);

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // ¡Ojo! Los meses van de 0 a 11
    const anio = fecha.getFullYear();

    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');

    const resultado = `${dia}-${mes}-${anio} ${hora}:${minuto}`;

    // Función para crear el nuevo chat en la base de datos

    getOrCreateConversation({
      senderId: user?.id ?? '',
      cursoId: courseId ?? +Math.round(Math.random() * 100 + 1), // Genera un ID único si no hay cursoId
      title: courseTitle ?? 'Nuevo Chat ' + resultado,
    })
      .then((response) => {
        console.log('Nuevo chat creado con ID:', response.id);
        setChatMode({ idChat: response.id, status: true, curso_title: '' });
      })
      .catch((error) => {
        console.error('Error creando nuevo chat:', error);
      });
  };

  const saveBotMessage = (trimmedInput: string) => {
    const currentChatId = chatModeRef.current.idChat;

    if (currentChatId) {
      console.log(
        'Guardando mensaje del bot:',
        trimmedInput,
        'en chat ID:',
        currentChatId
      );
      void saveMessages(
        'bot', // senderId
        currentChatId, // cursoId
        [
          {
            text: trimmedInput,
            sender: 'bot',
            sender_id: 'bot',
          },
        ]
      );
    }
  };

  const handleBotResponse = useCallback(
    async (query: string) => {
      if (processingQuery || searchRequestInProgress.current) return;

      let booleanVar = false;
      let inCourse = false;

      searchRequestInProgress.current = true;
      setProcessingQuery(true);
      setIsLoading(true);

      const modoActual = chatModeRef.current;
      const courseTitle = modoActual.curso_title;

      console.log('Modo actual del chat:', modoActual);

      if (courseTitle.includes('Nuevo Chat')) {
        console.log('Ingreso al titlenewChat');
        booleanVar = true;
      }
      // Obtener url y ver si esta dentro de un curso

      if (pathname.includes('cursos') || pathname.includes('curso')) {
        console.log('Ingreso al if');
        if (isEnrolled) {
          console.log('Usuario está inscrito en el curso');
          inCourse = true;
        }
      }

      console.log(chatMode);
      // Url para la petición según si hay courseTitle
      const urlDefault = {
        url: '/api/chat/courses',
        body: { prompt: query },
      };
      const urlCourses = {
        url: '/api/chat/info/',
        body: {
          user_id: user?.id,
          curso: courseTitle ? courseTitle : chatMode.curso_title,
          prompt: query,
        },
      };
      const urlSales = {
        url: '/api/sales',
        body: {
          userMessage: query ? query : 'Precios generales de los programas',
        },
      };

      console.log('Titulo del chat de curso: ' + courseTitle);
      console.log('Var to fetching:', booleanVar, courseTitle, isSignedIn);
      console.log('InCourse:', inCourse);
      let fetchConfig;

      if (
        (!courseTitle.includes('Nuevo Chat') &&
          !courseTitle.includes('Sin título') &&
          courseTitle) ||
        inCourse
      ) {
        console.log('1');
        fetchConfig = urlCourses;
      } else if (
        isSignedIn ||
        courseTitle.includes('Nuevo Chat') ||
        courseTitle.includes('Sin título') ||
        booleanVar
      ) {
        console.log('2');
        fetchConfig = urlDefault;
      } else if (!isSignedIn && !courseTitle) {
        console.log('3');
        fetchConfig = urlSales;
      }

      if (fetchConfig) {
        console.log('Fetching URL:', fetchConfig.url);
        console.log('Fetching body:', fetchConfig.body);
      } else {
        console.error('fetchConfig is undefined. Cannot proceed with fetch.');
        setIsLoading(false);
        setProcessingQuery(false);
        searchRequestInProgress.current = false;
        onSearchComplete?.();
        return;
      }

      try {
        const result = await fetch(fetchConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fetchConfig.body),
        });

        // Verificar si la respuesta es exitosa
        if (!result.ok) {
          const errorText = await result.text();
          console.error(`HTTP error! status: ${result.status}, response: ${errorText}`);
          throw new Error(`HTTP error! status: ${result.status}`);
        }

        // Verificar si hay contenido antes de parsear JSON
        const contentType = result.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await result.text();
          console.error('Response is not JSON:', responseText);
          throw new Error('La respuesta no es JSON válido');
        }

        const text = await result.text();
        if (!text) {
          throw new Error('Respuesta vacía del servidor');
        }

        const data = JSON.parse(text) as BotResponse;

        console.log('Respuesta del servidor:', data);

        console.log('respuesta del bot:', data.result);

        if (
          Array.isArray(data.result) &&
          fetchConfig.url.includes('/api/chat/courses')
        ) {
          console.log('Ingreso a mapear cursos');
          const cursos: Curso[] = data.result;

          if (cursos.length > 0) {
            const cursosTexto = cursos
              .map(
                (curso, index) => `${index + 1}. ${curso.title} | ${curso.id}`
              )
              .join('\n\n');

            const introText =
              cursosTexto.length !== 0
                ? 'Aquí tienes algunos cursos recomendados:'
                : 'No se encontraron cursos recomendados. Intenta con otra consulta.';

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                text: `${introText}\n\n${cursosTexto}`,
                sender: 'bot' as const,
              },
            ]);
          } else {
            console.log('Ingreso a otros');
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                text: 'No se encontraron cursos.',
                sender: 'bot' as const,
              },
            ]);
          }
        } else {
          console.log('Ingreso afuera del mapeo de cursos');
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              text:
                typeof data.result === 'string'
                  ? data.result
                  : JSON.stringify(data.result),
              sender: 'bot' as const,
            },
          ]);
        }

        saveBotMessage(
          typeof data.result === 'string'
            ? data.result
            : JSON.stringify(data.result)
        );
      } catch (error) {
        console.error('Error getting bot response:', error);

        let errorMessage = 'Lo siento, ocurrió un error al procesar tu solicitud.';
        
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            errorMessage = 'El servicio de consultas del curso no está disponible temporalmente.';
          } else if (error.message.includes('503')) {
            errorMessage = 'Los servicios están temporalmente no disponibles. Intenta más tarde.';
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            text: errorMessage,
            sender: 'bot' as const,
          },
        ]);

        saveBotMessage(errorMessage);
      } finally {
        setIsLoading(false);
        setProcessingQuery(false);
        searchRequestInProgress.current = false;
        onSearchComplete?.();
      }
    },
    [
      processingQuery,
      onSearchComplete,
      chatMode,
      isEnrolled,
      isSignedIn,
      pathname,
      user?.id,
    ]
  );

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
        processingQuery || // This is used in the dependency check
        searchRequestInProgress.current ||
        initialSearchDone.current
      )
        return;

      initialSearchDone.current = true;
      setIsOpen(true);

      // Add user message first
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: initialSearchQuery.trim(),
          sender: 'user',
        },
      ]);

      // Then process the bot response
      await handleBotResponse(initialSearchQuery.trim());
    };

    void handleInitialSearch();
  }, [
    initialSearchQuery,
    isSignedIn,
    showChat,
    handleBotResponse,
    processingQuery,
  ]); // Added processingQuery

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

  const saveUserMessage = (trimmedInput: string, sender: string) => {
    const currentChatId = chatMode.idChat;
    console.log(
      'Guardando mensaje del usuario:',
      trimmedInput,
      'en chat ID:',
      currentChatId
    );
    if (currentChatId) {
      void saveMessages(
        user?.id ?? '', // senderId
        currentChatId, // cursoId
        [
          {
            text: trimmedInput,
            sender: sender,
            sender_id: user?.id ?? '',
          },
        ]
      );
    } else {
      console.log(
        'No está entrando al chat para guardar el mensaje del usuario'
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    /*
		if (!isSignedIn && pathname !== '/') {
			toast.error('Debes iniciar sesión para usar el chat');
			return;
		}
			*/

    const trimmedInput = inputText.trim();
    if (!trimmedInput || searchRequestInProgress.current) return;

    const newUserMessage = {
      id: Date.now(),
      text: trimmedInput,
      sender: 'user' as const,
    };

    // Lógica para almacenar el mensaje del usuario en la base de datos
    saveUserMessage(trimmedInput, 'user');

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');

    if (ideaRef.current.selected) {
      // Si se está esperando una idea, se guarda el mensaje del usuario como idea
      setIdea({ selected: false, idea: trimmedInput });
    }
    await handleBotResponse(trimmedInput);
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
    /*
		if (!isSignedIn && pathname !== '/') {
			const currentUrl = encodeURIComponent(window.location.href);
			toast.error('Acceso restringido', {
				description: 'Debes iniciar sesión para usar el chatbot.',
				action: {
					label: 'Iniciar sesión',
					onClick: () => router.push(`/sign-in?redirect_url=${currentUrl}`),
				},
				duration: 5000,
			});
			return;
		}
			*/
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

  // Añade el manejador para los botones del mensaje inicial
  const handleBotButtonClick = (action: string) => {
    if (action === 'new_project') {
      // Lógica para crear proyecto
      if (!isSignedIn) {
        // Redirigir a la página de planes

        router.push(`/planes`);
      }
    } else if (action === 'new_idea') {
      setIdea({ selected: true, idea: '' });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: '¡Cuéntame tu nueva idea!',
          sender: 'bot',
        },
      ]);
    } else if (action === 'contact_support') {
      toast.info('Redirigiendo a soporte técnico');
      // Aquí puedes redirigir o abrir modal de soporte
    }
  };

  const renderMessage = (message: ChatMessage) => {
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

      // ⚠️ Si no hay cursos, mostramos todo el texto directamente
      if (courses.length === 0) {
        return (
          <div className="flex flex-col space-y-4">
            <div className="space-y-3">
              {message.text.split('\n').map((line, index) => {
                // Si la línea parece un título (por ejemplo: "Carreras Técnicas")
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

                // Si contiene un monto
                if (/\$\d[\d.]*\s?COP/.test(line)) {
                  return (
                    <p key={index} className="text-gray-800">
                      <span className="font-medium text-cyan-600">{line}</span>
                    </p>
                  );
                }

                // Línea vacía = espacio
                if (line.trim() === '') {
                  return <div key={index} className="h-2" />;
                }

                // Texto normal
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

      // Si hay cursos, usamos intro + tarjetas
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

    // Para mensajes del usuario o genéricos
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

  return (
    <div className={`${className} fixed`} style={{ zIndex: 99999 }}>
      {isAlwaysVisible && (
        <div className="fixed right-6 bottom-6 z-50">
          <button
            className={`relative h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 shadow-lg shadow-cyan-500/25 transition-all duration-300 ease-out hover:scale-110 hover:shadow-xl hover:shadow-cyan-400/40 ${isOpen ? 'minimized' : ''} `}
            onMouseEnter={() => {
              setIsHovered(true);
              show(); // Muestra tour y soporte por 5s
            }}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20" />

            {/* Inner circle with darker gradient */}
            <div className="absolute inset-1 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900">
              {/* Icon container */}
              <div className="relative">
                <MessageCircle
                  className={`h-6 w-6 text-cyan-300 transition-all duration-300 ${isHovered ? 'scale-110' : ''} `}
                />

                {/* Animated spark effect */}
                {isHovered && (
                  <Zap className="absolute -top-1 -right-1 h-3 w-3 animate-ping text-yellow-400" />
                )}
              </div>
            </div>

            {/* Rotating border effect */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent, #22d3ee, transparent, #06b6d4, transparent)',
              }}
            />

            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-0 transition-opacity duration-300" />
          </button>

          {/* Tooltip with neon effect - always visible */}

          {isDesktop && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 absolute right-0 bottom-full mb-2 duration-200">
              <div className="relative">
                {/* Main tooltip box */}
                <div className="relative z-10 rounded-lg border border-cyan-400/50 bg-slate-800/90 px-3 py-1 text-sm whitespace-nowrap text-cyan-300 shadow-lg backdrop-blur-sm">
                  Asistente IA
                </div>

                {/* Neon glow effects */}
                <div className="absolute inset-0 animate-pulse rounded-lg bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300 blur-sm">
                  Asistente IA
                </div>
                <div className="absolute inset-0 rounded-lg bg-cyan-400/5 px-3 py-1 text-sm text-cyan-300 blur-md">
                  Asistente IA
                </div>

                {/* Outer glow */}
                <div className="absolute inset-0 scale-110 rounded-lg bg-cyan-400/20 blur-lg" />

                {/* Arrow with neon effect */}
                <div className="absolute top-full right-4 z-10 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent border-t-slate-800" />
                <div className="absolute top-full right-4 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent border-t-cyan-400/50 blur-sm" />
              </div>
            </div>
          )}
        </div>

        /*  Boton nuevo*/
      )}

      {/* Mostrar el chat solo cuando isOpen es true */}
      {isOpen && (
        <div
          className={`fixed ${
            isDesktop
              ? 'right-0 bottom-0'
              : 'inset-0 top-0 right-0 bottom-0 left-0'
          }`}
          ref={chatContainerRef}
          style={{ zIndex: 110000 }}
        >
          <ResizableBox
            width={dimensions.width}
            height={dimensions.height}
            onResize={handleResize}
            minConstraints={
              isDesktop ? [500, window.innerHeight] : [window.innerWidth, window.innerHeight]
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
              className={`relative flex h-full w-full flex-col overflow-hidden ${
                isDesktop ? 'rounded-lg border border-gray-200' : ''
              } bg-white`}
            >
              {/* Logo background */}

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
                            onClick={() =>
                              setChatMode({
                                idChat: null,
                                status: showChatList ? true : false,
                                curso_title: '',
                              })
                            }
                          />
                        ) : null)}
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

              {chatMode.status ? (
                
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
                  />
                
              ) : (
                <ChatList
                  setChatMode={setChatMode}
                  setShowChatList={setShowChatList}
                />
              )}
            </div>

            {!chatMode.status && (
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
  );
};

export default StudentChatbot;
