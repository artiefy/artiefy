'use client';

import { useCallback, useEffect, useRef } from 'react';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { BsPersonCircle } from 'react-icons/bs';
import { HiMiniCpuChip } from 'react-icons/hi2';

import { useKeyboardViewport } from '~/hooks/useKeyboardViewport';
import {
  getConversationById,
  getOrCreateConversation,
} from '~/server/actions/estudiantes/chats/saveChat';
import { getTicketWithMessages } from '~/server/actions/estudiantes/chats/suportChatBot';

import type { CSSProperties } from 'react';

// Props for the chat component
interface ChatProps {
  courseId?: number | null;
  courseTitle?: string;
  isEnrolled?: boolean;
  messages: {
    id: number;
    text: string;
    sender: string;
    buttons?: { label: string; action: string }[]; // <- Nuevo campo opcional
    coursesData?: { id: number; title: string }[]; // Añadir esta propiedad
  }[];
  setMessages: React.Dispatch<
    React.SetStateAction<{ id: number; text: string; sender: string }[]>
  >;
  chatMode: {
    idChat: number | null;
    status: boolean;
    type?: 'ticket' | 'chat' | 'project';
  };
  setChatMode: React.Dispatch<
    React.SetStateAction<{
      idChat: number | null;
      status: boolean;
      curso_title: string;
      type?: 'ticket' | 'chat' | 'project';
    }>
  >;
  setShowChatList: React.Dispatch<React.SetStateAction<boolean>>;
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isSignedIn?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  renderMessage: (
    message: {
      id: number;
      text: string;
      sender: string;
      coursesData?: { id: number; title: string }[];
    },
    idx: number
  ) => React.ReactNode;
  idea?: { selected: boolean; idea: string };
  setIdea?: React.Dispatch<
    React.SetStateAction<{ selected: boolean; idea: string }>
  >;
  onBotButtonClick?: (action: string) => void; // <-- nueva prop
  // Permitir que el handler reciba opcionalmente el MouseEvent (o se llame sin args)
  onDeleteHistory?: (
    event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  compactWelcome?: boolean;
  isDesktop?: boolean; // Nueva prop para detectar desktop
}

export const ChatMessages: React.FC<ChatProps> = ({
  setShowChatList,
  courseId,
  courseTitle,
  isEnrolled,
  messages,
  setMessages,
  chatMode,
  setChatMode,
  inputText,
  setInputText,
  handleSendMessage,
  isLoading,
  messagesEndRef,
  isSignedIn = false,
  inputRef,
  renderMessage = (message, idx) => (
    <div key={idx} className="text-sm">
      {message.text}
    </div>
  ),
  onBotButtonClick,
  onDeleteHistory,
  compactWelcome,
  isDesktop = false, // Nueva prop con valor por defecto
}) => {
  // Hook para detectar la altura real del teclado en móviles
  // Cuando el teclado está abierto ajustamos el padding inferior del área de mensajes
  const { keyboardHeight: _keyboardHeight, isKeyboardOpen } =
    useKeyboardViewport();
  const defaultInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef ?? defaultInputRef;
  interface BlurGestureState {
    id: number | null;
    startX: number;
    startY: number;
    moved: boolean;
    shouldBlur: boolean;
  }
  const blurGestureRef = useRef<BlurGestureState>({
    id: null,
    startX: 0,
    startY: 0,
    moved: false,
    shouldBlur: false,
  });
  const resetBlurGesture = useCallback(() => {
    blurGestureRef.current = {
      id: null,
      startX: 0,
      startY: 0,
      moved: false,
      shouldBlur: false,
    };
  }, []);
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'touch') {
        resetBlurGesture();
        return;
      }
      const inputEl = actualInputRef.current;
      if (!inputEl) {
        resetBlurGesture();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) {
        resetBlurGesture();
        return;
      }
      if (target === inputEl || inputEl.contains(target)) {
        resetBlurGesture();
        return;
      }
      blurGestureRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        shouldBlur: true,
      };
    },
    [actualInputRef, resetBlurGesture]
  );
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = blurGestureRef.current;
      if (state.id !== event.pointerId) return;
      if (
        Math.abs(event.clientX - state.startX) > 6 ||
        Math.abs(event.clientY - state.startY) > 6
      ) {
        state.moved = true;
      }
    },
    []
  );
  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = blurGestureRef.current;
      if (state.id !== event.pointerId) {
        resetBlurGesture();
        return;
      }
      if (!state.moved && state.shouldBlur) {
        actualInputRef.current?.blur();
      }
      resetBlurGesture();
    },
    [actualInputRef, resetBlurGesture]
  );
  const handlePointerCancel = useCallback(() => {
    resetBlurGesture();
  }, [resetBlurGesture]);

  const { user } = useUser();

  const conversationId = chatMode.idChat ?? courseId ?? 0;
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? '';

  useEffect(() => {
    setShowChatList(false);
  }, [setShowChatList]);

  // Manejo de botones: si el padre provee onBotButtonClick, delegamos en él.
  const handleLocalButton = (action: string) => {
    if (typeof onBotButtonClick === 'function') {
      void onBotButtonClick(action);
      return;
    }
    // Fallback local para compatibilidad si no vino la función del padre
    switch (action) {
      case 'new_idea':
        window.dispatchEvent(new CustomEvent('new-idea'));
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(),
            text: '¡Genial! ¿Cuál es tu idea? 📝',
            sender: 'bot',
          },
        ]);
        break;
      case 'contact_support':
        // Abrir menú de nuevo ticket (detail === null) para el handler
        window.dispatchEvent(
          new CustomEvent('support-open-chat', { detail: null })
        );
        break;
      case 'new_project':
        if (!isSignedIn) router.push(`/planes`);
        break;
      default:
        console.log('Acción no reconocida (fallback):', action);
    }
  };

  useEffect(() => {
    console.log('La conversación: ' + conversationId);

    if (!conversationId) return;

    // No hacer consulta SQL si es un chat temporal (ID muy grande)
    if (conversationId && conversationId > 1000000000000) {
      console.log('Chat temporal detectado, saltando consulta SQL');
      return;
    }

    let inCourse = false;

    if (safePathname.includes('cursos') || safePathname.includes('curso')) {
      console.log('Ingreso al if');
      if (isEnrolled) {
        console.log('Usuario está inscrito en el curso');
        inCourse = true;
      }
    }

    // Añade el flag isMounted para evitar actualizar estado si el componente se desmonta
    let isMounted = true;

    const fetchMessages = async () => {
      let chats: {
        messages: { id: number; message: string; sender: string }[];
      } = { messages: [] };
      try {
        // Limpiar mensajes previos inmediatamente al cambiar de conversación
        // para evitar que se vea el historial anterior mientras cargan los nuevos.
        setMessages([]);
        if (conversationId !== null && conversationId < 1000000000000) {
          // Si es un ticket, usar la función de tickets
          if (chatMode.type === 'ticket') {
            const ticketData = await getTicketWithMessages(conversationId);
            if (ticketData.ticket && ticketData.messages) {
              chats = {
                messages: ticketData.messages.map((msg) => ({
                  id: msg.id,
                  message: msg.content,
                  sender: msg.sender,
                })),
              };
            }
          } else {
            // Para chats normales (IA o curso) usar siempre getConversationById
            chats = await getConversationById(conversationId);
          }
        } else {
          console.log('ID temporal o null, no ejecutando consulta SQL');
        }

        console.log('Datos: ' + conversationId + ' ' + conversationId);
        console.log('Chats:', chats);

        if (chats && chats.messages.length > 0) {
          console.log('Cargando mensajes de la conversación existente');
          // Si ya hay mensajes, los cargamos
          if (inCourse) {
            setChatMode({
              idChat: conversationId,
              status: true,
              curso_title: courseTitle ?? '',
            });
          }

          const loadedMessages = chats.messages.map(
            (msg: {
              id: number;
              message: string;
              sender: string;
              courses_data?: { id: number; title: string }[];
            }) => ({
              id: msg.id,
              text: msg.message,
              sender: msg.sender,
              coursesData: msg.courses_data, // <-- mapea el campo de la BD
            })
          );

          const botMessage = {
            id: -1,
            text:
              chatMode.type === 'ticket'
                ? '¡Hola! Soy el asistente de soporte técnico de Artiefy 🛠️. Estoy aquí para ayudarte con cualquier problema o pregunta que tengas.'
                : isEnrolled == true
                  ? '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, Bienvenid@ al curso ' +
                  courseTitle +
                  ' , Si tienes alguna duda sobre el curso u otra, ¡Puedes hacermela! 😎'
                  : '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
            sender: 'bot',
            buttons:
              chatMode.type === 'ticket'
                ? [
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
                ]
                : [
                  { label: '📚 Crear Proyecto', action: 'new_project' },
                  { label: '💬 Nueva Idea', action: 'new_idea' },
                  { label: '🛠 Soporte Técnico', action: 'contact_support' },
                ],
          };

          const alreadyHasBot = loadedMessages.some(
            (msg) => msg.sender === 'bot' && msg.text === botMessage.text
          );

          if (isMounted) {
            setMessages(
              alreadyHasBot ? loadedMessages : [botMessage, ...loadedMessages]
            );
          }
        }
        // Creamos una conversación si no existe, luego de 2 mensajes enviados por el usuario
        else {
          console.log(
            'No hay mensajes en la conversación, creando una nueva conversación'
          );
          if (chats.messages.length === 0) {
            // Mostrar saludo inicial independiente para nueva conversación sin mensajes
            const emptyBotMessage = {
              id: -1,
              text:
                chatMode.type === 'ticket'
                  ? '¡Hola! Soy el asistente de soporte técnico de Artiefy 🛠️. Estoy aquí para ayudarte con cualquier problema o pregunta que tengas.'
                  : isEnrolled == true
                    ? '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, Bienvenid@ al curso ' +
                      courseTitle +
                      ' , Si tienes alguna duda sobre el curso u otra, ¡Puedes hacérmela! 😎'
                    : '¡Hola! soy Artie 🤖 tú chatbot para resolver tus dudas, ¿En qué puedo ayudarte hoy? 😎',
              sender: 'bot' as const,
              buttons:
                chatMode.type === 'ticket'
                  ? [
                      { label: '🐛 Reportar Error', action: 'report_bug' },
                      {
                        label: '❓ Pregunta General',
                        action: 'general_question',
                      },
                      {
                        label: '🔧 Problema Técnico',
                        action: 'technical_issue',
                      },
                      {
                        label: '💰 Consulta de Pagos',
                        action: 'payment_inquiry',
                      },
                    ]
                  : [
                      { label: '📚 Crear Proyecto', action: 'new_project' },
                      { label: '💬 Nueva Idea', action: 'new_idea' },
                      {
                        label: '🛠 Soporte Técnico',
                        action: 'contact_support',
                      },
                    ],
            };
            if (isMounted) {
              setMessages([emptyBotMessage]);
            }
            // Si es un chat de curso, crear conversación asociada al curso (persistir)
            if (courseId != null) {
              try {
                const resp = await getOrCreateConversation({
                  senderId: user?.id ?? '',
                  cursoId: courseId,
                  title:
                    'Curso - ' +
                    (courseTitle
                      ? courseTitle.length > 35
                        ? courseTitle.slice(0, 35) + '...'
                        : courseTitle
                      : 'Sin título'),
                });
                if (isMounted) {
                  setChatMode({
                    idChat: resp.id,
                    status: true,
                    curso_title: '',
                  });
                }
              } catch (err) {
                console.error('Error creando conversación de curso:', err);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener los mensajes:', error);
      }
    };

    void fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [
    conversationId,
    courseId,
    courseTitle,
    isEnrolled,
    safePathname,
    setChatMode,
    setMessages,
    user?.id,
    chatMode.type,
  ]);

  const baseBodyClasses =
    'flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-3 px-3 pb-4 scroll-pb-24';
  const bodyClasses = compactWelcome
    ? `${baseBodyClasses} pt-1`
    : `${baseBodyClasses} pt-4`;
  const INPUT_BAR_HEIGHT = 70; // altura aproximada del contenedor del input
  const dynamicBottomPadding = isKeyboardOpen
    ? _keyboardHeight + INPUT_BAR_HEIGHT + 24
    : INPUT_BAR_HEIGHT + 24;
  const messageAreaStyle: CSSProperties = {
    paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${dynamicBottomPadding}px)`,
  };
  const inputBarStyle: CSSProperties = {
    padding: '12px 16px',
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
    flexShrink: 0,
    // Crucial en móviles: empujar el input por encima del teclado
    bottom: isKeyboardOpen ? `${_keyboardHeight}px` : '0px',
  };

  const inputBarClass = isDesktop
    ? 'flex-shrink-0 border-t border-gray-700 bg-[#071024] backdrop-blur-sm'
    : 'fixed right-0 left-0 z-30 border-t border-gray-700 bg-[#071024] backdrop-blur-sm';

  const inputBarStyleDesktop: CSSProperties = {
    padding: '12px 16px',
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
    flexShrink: 0,
  };

  const actualInputBarStyle = isDesktop ? inputBarStyleDesktop : inputBarStyle;

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div
        className="sticky top-0 left-0 z-20 flex items-center justify-end gap-2 border-b border-gray-700 bg-[#071024] px-3 py-1.5"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <button
          type="button"
          onClick={() => {
            if (!onDeleteHistory) return;
            const ok = window.confirm(
              '¿Deseas eliminar todo el historial de esta conversación? Esta acción no se puede deshacer.'
            );
            if (ok) {
              onDeleteHistory();
            }
          }}
          className="rounded px-3 py-1 text-sm font-semibold text-red-400 transition hover:bg-red-900/30 hover:text-red-300"
          title="Borrar historial"
        >
          Borrar historial
        </button>
      </div>

      <div className={bodyClasses} style={messageAreaStyle}>
        {messages.map((message, idx) =>
          message.sender === 'bot' && message.text === '' ? null : (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${message.sender === 'bot' && message.buttons && compactWelcome ? 'mb-1' : 'mb-2'}`}
            >
              <div
                className={`flex max-w-[80%] items-start space-x-2 ${message.sender === 'user'
                  ? 'flex-row-reverse space-x-reverse'
                  : 'flex-row'
                  }`}
              >
                {message.sender === 'bot' ? (
                  <HiMiniCpuChip className="mt-2 text-3xl text-blue-500" />
                ) : user?.imageUrl ? (
                  <Image
                    src={user.imageUrl ?? '/default-avatar.png'}
                    alt={user.fullName ?? 'User'}
                    width={24}
                    height={24}
                    className="mt-2 rounded-full"
                    priority
                  />
                ) : (
                  <BsPersonCircle className="mt-2 text-xl text-gray-500" />
                )}
                <div
                  className={
                    message.sender === 'user'
                      ? 'rounded-2xl bg-gradient-to-r from-[#00bdd8] to-[#009fbf] px-4 py-3 text-white shadow-lg shadow-[#00bdd8]/30'
                      : 'rounded-2xl border border-white/40 bg-[#102843] px-4 py-3 text-white shadow-lg shadow-black/30'
                  }
                  style={{
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {renderMessage(message, idx)}
                  {message.buttons && message.sender === 'bot' && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {message.buttons.map((btn, bidx) => {
                        const isWhatsAppButton =
                          btn.action.startsWith('whatsapp:');

                        return (
                          <button
                            key={bidx}
                            type="button"
                            onClick={() => handleLocalButton(btn.action)}
                            className={`chatbot-menu-btn flex items-center justify-center gap-2 rounded px-4 py-2 font-semibold shadow-md transition ${
                              isWhatsAppButton
                                ? 'border-2 border-[#128C7E] bg-white text-[#128C7E] hover:bg-[#f0fdf4]'
                                : 'border border-[#00bdd8] bg-[#eaf7fa] text-[#00a5c0] hover:bg-[#00bdd8] hover:text-white'
                            }`}
                            style={
                              isWhatsAppButton
                                ? {
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    lineHeight: '1.4',
                                    padding: '10px 16px',
                                    fontSize: '15px',
                                    marginRight: '4px',
                                    marginBottom: '6px',
                                    borderRadius: '8px',
                                    maxWidth: '90vw',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }
                                : {
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    lineHeight: '1.1',
                                    padding: '2px 8px',
                                    fontSize: '12px',
                                    marginRight: '4px',
                                    marginBottom: '2px',
                                    borderRadius: '6px',
                                    maxWidth: '90vw',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }
                            }
                          >
                            <span
                              className={`flex items-center justify-center gap-2 whitespace-nowrap ${isWhatsAppButton ? 'text-[#128C7E]' : ''}`}
                            >
                              {isWhatsAppButton && (
                                <Image
                                  src="/WhatsApp.webp"
                                  alt="WhatsApp"
                                  width={28}
                                  height={28}
                                  className="h-7 w-7"
                                />
                              )}
                              {btn.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div>
              <div className="loader">
                <div className="circle">
                  <div className="dot" />
                  <div className="outline" />
                </div>
                <div className="circle">
                  <div className="dot" />
                  <div className="outline" />
                </div>
                <div className="circle">
                  <div className="dot" />
                  <div className="outline" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={inputBarClass} style={actualInputBarStyle}>
        <form onSubmit={handleSendMessage} className="w-full">
          <div className="flex w-full gap-2">
            <input
              ref={actualInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={'Escribe un mensaje...'}
              className="min-h-10 flex-1 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-base text-white placeholder-gray-400 focus:border-[#3AF4EF] focus:ring-2 focus:ring-[#3AF4EF] focus:outline-none"
              disabled={isLoading}
              style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-secondary group relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-all hover:bg-[#00A5C0] active:scale-90 disabled:bg-gray-300"
            >
              <Image
                src="/send-svgrepo-com.svg"
                alt="Send message"
                width={24}
                height={24}
                className="size-6 transition-all duration-200 group-hover:scale-110 group-hover:rotate-12"
                priority
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
