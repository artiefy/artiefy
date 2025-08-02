'use client';
import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { IoMdClose } from 'react-icons/io';
import { MdSupportAgent } from 'react-icons/md';
import { toast } from 'sonner';

import { useExtras } from '~/app/estudiantes/StudentContext';
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
  const [messages, setMessages] = useState([
    { id: 1, text: '¡Hola! ¿En qué puedo ayudarte?', sender: 'support' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleChatOpen = (e: CustomEvent<ChatDetail>) => {
      const fetchMessages = async () => {
        const chats: {
          ticket: { id: number; content: string; sender: string }[];
        } = { ticket: [] };

        console.log(chats);
        try {
          if (e.detail !== null && user?.id) {
            const ticketData = await getTicketWithMessages(
              e.detail.id,
              user.id
            );

            if (ticketData?.ticket) {
              // Si tienes un array de mensajes, usa ese array aquí
              // Aquí se asume que los mensajes están en ticketData.ticket.messages
              console.log('Entro al ticketData.ticket');
              console.log('Mensajes del ticket:', ticketData);
              chats.ticket = ticketData.messages.map((msg: TicketMessage) => ({
                id: msg.id,
                content: msg.content ?? msg.description ?? '',
                sender: msg.sender ?? 'user',
              }));
            }
          }

          const botMessage = {
            id: 1,
            text: '¡Hola! ¿En qué puedo ayudarte?',
            sender: 'support',
          };

          // Mapear mensajes del ticket
          const loadedMessages = chats.ticket.map(
            (msg: { id: number; content: string; sender: string }) => ({
              id: msg.id,
              text: msg.content,
              sender: msg.sender,
            })
          );

          // Si el primer mensaje NO es el del bot, lo agregamos al inicio
          if (
            loadedMessages.length === 0 ||
            loadedMessages[0].sender !== 'bot'
          ) {
            setMessages([botMessage, ...loadedMessages]);
          } else {
            setMessages(loadedMessages);
          }

          console.log('Mensajes: ', messages);
        } catch (error) {
          console.error('Error al obtener los mensajes:', error);
        }
      };
      void fetchMessages();
      setIsOpen(true);
    };

    // 👇 Ojo con el tipo de evento
    window.addEventListener(
      'support-open-chat',
      handleChatOpen as EventListener
    );

    return () => {
      window.removeEventListener(
        'support-open-chat',
        handleChatOpen as EventListener
      );
    };
  }, [messages, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ya no es necesario controlar hideButton, la animación depende de showExtras

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveUserMessage = (trimmedInput: string, sender: string) => {
    if (isOpen && isSignedIn && user?.id) {
      console.log('Guardando mensaje del usuario:', trimmedInput);
      void SaveTicketMessage(user.id, trimmedInput, sender);
    } else {
      console.log(
        'No está entrando al chat para guardar el mensaje del usuario'
      );
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
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
    setInputText('');
    saveUserMessage(inputText.trim(), 'user');
    setIsLoading(true);

    try {
      // Aquí iría la lógica para enviar el ticket al backend
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: 'Gracias por reportar el problema. Un administrador revisará tu ticket pronto.',
            sender: 'support' as const,
          },
        ]);
        setIsLoading(false);
        saveUserMessage(
          'Gracias por reportar el problema. Un administrador revisará tu ticket pronto.',
          'support'
        );
      }, 1000);
    } catch (error) {
      console.error('Error al enviar el ticket:', error);
      toast.error('Error al enviar el ticket');
      setIsLoading(false);
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
      {isSignedIn && !hideButton && (isDesktop ? showAnim && !isOpen : !isOpen) && (
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
            <div className="support-chat-header">
              <div className="flex items-center space-x-2">
                <MdSupportAgent className="text-secondary text-2xl" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Soporte Técnico
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
              >
                <IoMdClose className="text-xl text-gray-500" />
              </button>
            </div>

            <SuportChat
              messages={messages}
              setMessages={setMessages}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isSignedIn={isSignedIn}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
              inputText={inputText}
              setInputText={setInputText}
              user={user}
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TicketSupportChatbot;
