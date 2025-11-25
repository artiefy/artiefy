'use client';

import { useEffect, useRef } from 'react';

import Image from 'next/image';

import { BsPersonCircle } from 'react-icons/bs';
import { MdSupportAgent } from 'react-icons/md';

import { formatDateColombia } from '~/lib/formatDate';
import { getOrCreateSuportChat } from '~/server/actions/estudiantes/chats/suportChatBot';

import type { UserResource } from '@clerk/types';

interface SuportChatProps {
  messages: {
    id: number;
    text: string;
    sender: string;
    createdAt?: string | Date;
    buttons?: { label: string; action: string }[];
  }[];
  setMessages: React.Dispatch<
    React.SetStateAction<
      {
        id: number;
        text: string;
        sender: string;
        createdAt?: string | Date;
        buttons?: { label: string; action: string }[];
      }[]
    >
  >;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSignedIn?: boolean;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isTyping?: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputText: string;
  setInputText: (text: string) => void;
  user: UserResource | null | undefined;
  inputRef?: React.RefObject<HTMLInputElement>;
  skipInitialLoad?: boolean;
  onBotButtonClick?: (action: string) => void;
  ticketStatus?: string | null;
}

export const SuportChat: React.FC<SuportChatProps> = ({
  setMessages,
  messages,
  isLoading,
  messagesEndRef,
  inputText,
  setInputText,
  user,
  inputRef,
  handleSendMessage,
  skipInitialLoad = false,
  onBotButtonClick,
  ticketStatus,
}) => {
  const defaultInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef ?? defaultInputRef;

  const isTicketClosed = Boolean(
    ticketStatus &&
      ['cerrado', 'solucionado'].includes(ticketStatus.toLowerCase())
  );

  useEffect(() => {
    if (skipInitialLoad) return;

    const fetchInitialMessages = async () => {
      if (!user?.id) return;

      try {
        const ticket = await getOrCreateSuportChat({
          creatorId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress ?? '',
          description: '',
        });

        if (ticket) {
          console.log('Ticket fetched:', ticket);

          const botMessage = {
            id: Date.now(),
            text: '🎫 ¡Perfecto! Vamos a crear un nuevo ticket de soporte. ¿En qué puedo ayudarte?\n\n🐛 Reportar Error\n❓ Pregunta General\n🔧 Problema Técnico\n💰 Consulta de Pagos',
            sender: 'support',
          };

          const historyMessages = ticket.messages
            ? ticket.messages.map((msg) => ({
                id: msg.id,
                text: msg.content,
                sender: msg.sender === 'user' ? 'user' : 'support',
              }))
            : [];

          // Solo agregar mensaje inicial si no existe en el historial
          const needsInitialMessage = !historyMessages.some(
            (m) => m.sender === 'support' && m.text.includes('🎫 ¡Perfecto!')
          );

          const initialMessages = needsInitialMessage
            ? [botMessage, ...historyMessages]
            : historyMessages;

          const resolvedSource =
            ticket.continuationOfTicket ??
            (['solucionado', 'cerrado'].includes(ticket.estado ?? '')
              ? ticket
              : null);

          if (resolvedSource) {
            const resolvedAtRaw =
              resolvedSource.updatedAt ?? resolvedSource.createdAt;
            const resolvedAt = resolvedAtRaw
              ? new Date(resolvedAtRaw)
              : new Date();
            const resolvedStatus = resolvedSource.estado ?? 'solucionado';
            const resolvedTicketId = resolvedSource.id ?? 'N/D';

            initialMessages.push({
              id: Date.now() + 1,
              text: `Tu ticket anterior (#${resolvedTicketId}) fue marcado como ${resolvedStatus} el ${formatDateColombia(resolvedAt)}. Si necesitas más ayuda, envía un nuevo mensaje y abriremos otro ticket automáticamente.`,
              sender: 'support',
            });
          }

          setMessages(initialMessages);
        } else {
          console.warn(
            'No se pudo obtener el ticket o no hay mensajes iniciales.'
          );
        }
      } catch (error) {
        console.error('Error fetching initial messages:', error);
      }
    };

    void fetchInitialMessages();
  }, [setMessages, user, skipInitialLoad]);
  // Filtrar el mensaje de asignación automática
  const filteredMessages = messages.filter(
    (message) => message.text !== 'Ticket asignado a 1 usuario(s).'
  );

  return (
    <>
      {/* Banner de ticket cerrado */}
      {isTicketClosed && (
        <div className="mb-2 rounded-lg border border-yellow-500 bg-yellow-50 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-semibold text-yellow-800">
                Este ticket ha sido marcado como {ticketStatus?.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div className="support-chat-messages">
        {filteredMessages.map((message) => (
          <div key={message.id}>
            {/* Timestamp arriba de la burbuja */}
            {message.createdAt && (
              <div
                className={`mb-1 flex text-xs text-gray-400 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {formatDateColombia(message.createdAt)}
              </div>
            )}
            <div
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`flex max-w-[80%] items-start space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
              >
                {message.sender === 'support' ? (
                  <MdSupportAgent className="text-secondary mt-2 text-xl" />
                ) : user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName ?? 'User'}
                    width={24}
                    height={24}
                    className="mt-2 rounded-full"
                  />
                ) : (
                  <BsPersonCircle className="mt-2 text-xl text-gray-500" />
                )}
                <div
                  className={`rounded-lg p-3 ${message.sender === 'user' ? 'bg-secondary text-white' : 'bg-gray-800 text-white'}`}
                >
                  <div className="whitespace-pre-wrap">{message.text}</div>
                  {message.buttons && message.buttons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.buttons.map((button, index) => (
                        <button
                          key={index}
                          onClick={() => onBotButtonClick?.(button.action)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                        >
                          {button.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - compacto en móvil */}
      <form onSubmit={handleSendMessage} className="support-chat-input">
        <input
          ref={actualInputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isTicketClosed
              ? 'Este ticket está cerrado. Contacta a un administrador para reabrirlo.'
              : 'Describe el problema...'
          }
          disabled={isTicketClosed}
          className="focus:ring-secondary flex-1 rounded-lg border p-1 text-sm text-white focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:p-2 sm:text-base"
        />
        <button
          type="submit"
          disabled={isLoading || isTicketClosed}
          className="bg-secondary rounded-lg px-3 py-1 text-sm text-white transition-colors hover:bg-[#00A5C0] disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-4 sm:py-2 sm:text-base"
        >
          Enviar
        </button>
      </form>
    </>
  );
};

export default SuportChat;
