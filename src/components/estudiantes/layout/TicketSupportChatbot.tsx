'use client';
import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { IoClose } from 'react-icons/io5';
import { MdArrowBack, MdSupportAgent } from 'react-icons/md';
import { toast } from 'sonner';

import { useExtras } from '~/app/estudiantes/StudentContext';
import { useTicketMessages } from '~/hooks/useTicketMessages';
import {
  getTicketWithMessages,
  SaveTicketMessage,
} from '~/server/actions/estudiantes/chats/suportChatBot';

import { SuportChat } from './SuportChat';

import '~/styles/ticketSupportButton.css';

interface TicketMessage {
  id: number;
  content: string;
  description?: string;
  sender: string;
}

interface ChatDetail {
  id: number;
}

const TicketSupportChatbot = () => {
  const { showExtras } = useExtras();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    {
      id: number;
      text: string;
      sender: string;
      buttons?: { label: string; action: string }[];
    }[]
  >([
    {
      id: 1,
      text: '🎫 ¡Perfecto! Vamos a crear un nuevo ticket de soporte. ¿En qué puedo ayudarte?',
      sender: 'support',
      buttons: [
        { label: '🐛 Reportar Error', action: 'report_bug' },
        { label: '❓ Pregunta General', action: 'general_question' },
        { label: '🔧 Problema Técnico', action: 'technical_issue' },
        { label: '💰 Consulta de Pagos', action: 'payment_inquiry' },
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [prevMessageCount, setPrevMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook SWR para obtener mensajes en tiempo real
  const { messages: swrMessages, mutate: mutateMessages } = useTicketMessages(
    currentTicketId,
    3000
  ); // Polling cada 3 segundos
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const ANIMATION_DURATION = 350; // ms
  const [showAnim, setShowAnim] = useState(false);

  useEffect(() => {
    // Solo se ejecuta en el cliente
    setIsDesktop(window.innerWidth > 768);

    // Si quieres que se actualice al redimensionar:
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [hideButton, setHideButton] = useState(false);

  useEffect(() => {
    const handleHideButton = () => setHideButton(true);
    const handleShowButton = () => setHideButton(false);
    window.addEventListener('student-chat-open', handleHideButton);
    window.addEventListener('student-chat-close', handleShowButton);
    return () => {
      window.removeEventListener('student-chat-open', handleHideButton);
      window.removeEventListener('student-chat-close', handleShowButton);
    };
  }, []);

  useEffect(() => {
    if (showExtras && !hideButton) {
      setShowAnim(true);
    } else if (hideButton) {
      setShowAnim(false); // Oculta inmediatamente al abrir el chat
    } else if (showAnim) {
      const timeout = setTimeout(() => setShowAnim(false), ANIMATION_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [showExtras, hideButton, showAnim]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Sincronizar mensajes de SWR con estado local y controlar loader
  useEffect(() => {
    if (!swrMessages || !currentTicketId) return;

    // Si hay nuevos mensajes, ocultar loader y mostrar mensajes
    if (swrMessages.length > prevMessageCount) {
      setIsLoading(false);
      setIsTyping(false);
      const formattedMessages = swrMessages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender,
        createdAt: msg.createdAt,
      }));
      // Solo agregar mensaje de bienvenida si no existe
      const needsWelcomeMessage = !formattedMessages.some(
        (m) => m.sender === 'support' && m.text.includes('🎫 ¡Perfecto!')
      );
      if (needsWelcomeMessage) {
        const welcomeMessage = {
          id: Date.now(),
          text: '🎫 ¡Perfecto! Vamos a crear un nuevo ticket de soporte. ¿En qué puedo ayudarte?',
          sender: 'support' as const,
          buttons: [
            { label: '🐛 Reportar Error', action: 'report_bug' },
            { label: '❓ Pregunta General', action: 'general_question' },
            { label: '🔧 Problema Técnico', action: 'technical_issue' },
            { label: '💰 Consulta de Pagos', action: 'payment_inquiry' },
          ],
        };
        setMessages([welcomeMessage, ...formattedMessages]);
      } else {
        setMessages(formattedMessages);
      }
      setPrevMessageCount(swrMessages.length);
    } else if (prevMessageCount === 0) {
      // Primera carga
      const formattedMessages = swrMessages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender,
        createdAt: msg.createdAt,
      }));
      const needsWelcomeMessage = !formattedMessages.some(
        (m) => m.sender === 'support' && m.text.includes('🎫 ¡Perfecto!')
      );
      if (needsWelcomeMessage) {
        const welcomeMessage = {
          id: Date.now(),
          text: '🎫 ¡Perfecto! Vamos a crear un nuevo ticket de soporte. ¿En qué puedo ayudarte?',
          sender: 'support' as const,
          buttons: [
            { label: '🐛 Reportar Error', action: 'report_bug' },
            { label: '❓ Pregunta General', action: 'general_question' },
            { label: '🔧 Problema Técnico', action: 'technical_issue' },
            { label: '💰 Consulta de Pagos', action: 'payment_inquiry' },
          ],
        };
        setMessages([welcomeMessage, ...formattedMessages]);
      } else if (formattedMessages.length > 0) {
        setMessages(formattedMessages);
      }
      setPrevMessageCount(swrMessages.length);
    }
  }, [swrMessages, currentTicketId, prevMessageCount]);

  // Actualizar el contador cuando cambian los mensajes
  useEffect(() => {
    if (swrMessages && swrMessages.length > 0) {
      setPrevMessageCount(swrMessages.length);
    }
  }, [swrMessages]);

  useEffect(() => {
    const handleChatOpen = (e: CustomEvent<ChatDetail>) => {
      const fetchMessages = async () => {
        try {
          if (e.detail !== null && user?.id) {
            setCurrentTicketId(e.detail.id); // Establecer el ID del ticket actual

            const ticketData = await getTicketWithMessages(
              e.detail.id
              // No pasar user.id para obtener solo mensajes del ticket específico
            );

            if (ticketData?.ticket && ticketData.messages) {
              console.log(
                'Mensajes del ticket cargados:',
                ticketData.messages.length
              );

              // Mapear mensajes del ticket desde la BD
              const loadedMessages = ticketData.messages.map(
                (msg: TicketMessage) => ({
                  id: msg.id,
                  text: msg.content ?? msg.description ?? '',
                  sender: msg.sender ?? 'user',
                })
              );

              // Verificar si necesitamos agregar el mensaje de bienvenida
              const needsWelcomeMessage = !loadedMessages.some(
                (m) =>
                  m.sender === 'support' && m.text.includes('🎫 ¡Perfecto!')
              );

              if (needsWelcomeMessage) {
                const welcomeMessage = {
                  id: Date.now(),
                  text: '🎫 ¡Perfecto! Vamos a crear un nuevo ticket de soporte. ¿En qué puedo ayudarte?',
                  sender: 'support' as const,
                  buttons: [
                    { label: '🐛 Reportar Error', action: 'report_bug' },
                    {
                      label: '❓ Pregunta General',
                      action: 'general_question',
                    },
                    { label: '🔧 Problema Técnico', action: 'technical_issue' },
                    {
                      label: '💰 Consulta de Pagos',
                      action: 'payment_inquiry',
                    },
                  ],
                };
                setMessages([welcomeMessage, ...loadedMessages]);
              } else {
                setMessages(loadedMessages);
              }
            }
          } else {
            // Si no hay detail o es null, estamos creando un nuevo ticket (menú principal)
            setCurrentTicketId(null);
          }
        } catch (error) {
          console.error('Error al obtener los mensajes:', error);
        }
      };
      void fetchMessages();
      setIsOpen(true);
    };

    window.addEventListener(
      'support-open-chat',
      handleChatOpen as EventListener
    );

    const handleChatClose = () => {
      setCurrentTicketId(null);
    };

    window.addEventListener('support-chat-close', handleChatClose);

    return () => {
      window.removeEventListener(
        'support-open-chat',
        handleChatOpen as EventListener
      );
      window.removeEventListener('support-chat-close', handleChatClose);
    };
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ya no es necesario controlar hideButton, la animación depende de showExtras

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveUserMessage = (trimmedInput: string, sender: string) => {
    if (isOpen && isSignedIn && user?.id) {
      console.log('📤 Guardando mensaje del usuario:', {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        message: trimmedInput,
        sender,
      });
      void SaveTicketMessage(
        user.id,
        trimmedInput,
        sender,
        user.primaryEmailAddress?.emailAddress
      );
    } else {
      console.error('❌ Falta alguno de estos:', {
        isOpen,
        isSignedIn,
        userId: user?.id,
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error('Debes iniciar sesión para enviar tickets');
      return;
    }

    if (!inputText.trim()) return;

    const newUserMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user' as const,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Guardar el mensaje en el backend
      saveUserMessage(messageText, 'user');

      // Forzar revalidación de SWR para obtener mensajes actualizados
      if (currentTicketId) {
        await mutateMessages();
      }

      setIsLoading(false);

      // Ya no necesitamos agregar mensaje automático del soporte
      // porque SWR se encargará de traer actualizaciones
    } catch (error) {
      console.error('Error al enviar el ticket:', error);
      toast.error('Error al enviar el ticket');
      setIsLoading(false);
    }
  };

  const handleBotButtonClick = (action: string) => {
    if (action === 'report_bug') {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: '🐛 Reportar Error', sender: 'user' },
        {
          id: Date.now() + 1,
          text: 'Por favor, describe el error que encontraste. Incluye todos los detalles posibles como qué estabas haciendo cuando ocurrió el problema.',
          sender: 'support',
        },
      ]);
    } else if (action === 'general_question') {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: '❓ Pregunta General', sender: 'user' },
        {
          id: Date.now() + 1,
          text: '¡Perfecto! Hazme tu pregunta y te ayudaré con la información que necesites sobre Artiefy.',
          sender: 'support',
        },
      ]);
    } else if (action === 'technical_issue') {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: '🔧 Problema Técnico', sender: 'user' },
        {
          id: Date.now() + 1,
          text: 'Entiendo que tienes un problema técnico. Describe detalladamente qué está pasando y qué dispositivo/navegador estás usando.',
          sender: 'support',
        },
      ]);
    } else if (action === 'payment_inquiry') {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: '💰 Consulta de Pagos', sender: 'user' },
        {
          id: Date.now() + 1,
          text: 'Te ayudo con tu consulta de pagos. ¿Tienes algún problema con una transacción, facturación o necesitas información sobre los planes?',
          sender: 'support',
        },
      ]);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClick = () => {
    if (!isSignedIn) {
      const currentUrl = encodeURIComponent(window.location.href);
      toast.error('Acceso restringido', {
        description: 'Debes iniciar sesión para enviar tickets de soporte.',
        action: {
          label: 'Iniciar sesión',
          onClick: () => router.push(`/sign-in?redirect_url=${currentUrl}`),
        },
        duration: 5000,
      });
      return;
    }
    const button = document.querySelector('.ticket-button');
    button?.classList.add('clicked');
    setTimeout(() => {
      button?.classList.remove('clicked');
      setIsOpen(!isOpen);
    }, 300);
  };

  // if (!isDesktop) return null; // Solo se muestra si showExtras es true

  console.log('Datos: ' + isOpen, showExtras, isSignedIn, isOpen, isDesktop);

  return (
    <>
      {isSignedIn &&
        !hideButton &&
        (isDesktop ? showAnim && !isOpen : !isOpen) && (
          <div
            className="fixed right-25 bottom-24 z-50 translate-x-1/2 sm:right-10 sm:bottom-40 sm:translate-x-0"
            style={{
              animationName: isDesktop
                ? showExtras
                  ? 'fadeInUp'
                  : 'fadeOutDown'
                : undefined,
              animationDuration: isDesktop
                ? `${ANIMATION_DURATION}ms`
                : undefined,
              animationTimingFunction: isDesktop ? 'ease' : undefined,
              animationFillMode: isDesktop ? 'forwards' : undefined,
            }}
          >
            <button
              onClick={handleClick}
              className={`relative flex items-center gap-2 rounded-full border border-blue-400 bg-gradient-to-r from-blue-500 to-cyan-600 px-5 py-2 text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:from-cyan-500 hover:to-blue-600 hover:shadow-[0_0_20px_#38bdf8]`}
            >
              <MdSupportAgent className="text-xl text-white opacity-90" />
              <span className="hidden font-medium tracking-wide sm:inline">
                Soporte técnico
              </span>
              <span className="absolute bottom-[-9px] left-1/2 hidden h-0 w-0 translate-x-15 transform border-t-[8px] border-r-[6px] border-l-[6px] border-t-blue-500 border-r-transparent border-l-transparent sm:inline" />
            </button>
          </div>
        )}
      {/* Chatbot */}
      {isOpen && isSignedIn && (
        <div className="fixed top-1/2 left-1/2 z-50 h-[100%] w-[100%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg sm:top-auto sm:right-0 sm:bottom-0 sm:left-auto sm:h-[100vh] sm:w-[400px] sm:translate-x-0 sm:translate-y-0 md:w-[500px]">
          <div className="support-chat">
            {/* Header */}
            <div className="relative z-[5] flex flex-col bg-white/95 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b p-4">
                <MdSupportAgent className="text-4xl text-blue-500" />
                <div className="flex flex-1 flex-col items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Soporte Técnico
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
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
                  {/* Solo mostrar botón de flecha hacia atrás si NO estamos en el menú principal */}
                  {currentTicketId !== null && (
                    <button
                      className="rounded-full p-1.5 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200"
                      aria-label="Volver atrás"
                      onClick={() => setIsOpen(false)}
                    >
                      <MdArrowBack className="text-xl text-gray-500" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      // Cerrar completamente el chatbot
                      const event = new CustomEvent('chatbot-close');
                      window.dispatchEvent(event);
                    }}
                    className={`${currentTicketId !== null ? 'ml-2' : ''} rounded-full p-1.5 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200`}
                    aria-label="Cerrar chatbot"
                  >
                    <IoClose className="text-xl text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <SuportChat
              messages={messages}
              setMessages={setMessages}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isSignedIn={isSignedIn}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
              isTyping={isTyping}
              messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
              inputText={inputText}
              setInputText={setInputText}
              user={user}
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
              skipInitialLoad={true}
              onBotButtonClick={handleBotButtonClick}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TicketSupportChatbot;
