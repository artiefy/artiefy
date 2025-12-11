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
  // Filtrar la asignación automática y deduplicar mensajes de asignación
  const filteredMessages = (() => {
    const seenAssignments = new Set<string>();
    const assignmentCountRegex = /^Ticket asignado a \d+ usuario\(s\)\./;

    return messages.filter((message) => {
      const text = message.text ?? '';

      // Ocultar asignaciones automáticas y mensajes solo con conteo
      if (
        text === 'Ticket asignado a 1 usuario(s).' ||
        assignmentCountRegex.test(text)
      ) {
        return false;
      }

      // Mostrar una sola vez las asignaciones con nombres
      if (text.startsWith('Ticket asignado a ')) {
        if (seenAssignments.has(text)) return false;
        seenAssignments.add(text);
      }

      return true;
    });
  })();

  return (
    <>
      {/* Banner de ticket cerrado */}
      {isTicketClosed && (
        <div className="mb-3 rounded-lg border border-yellow-400/60 bg-yellow-400/10 p-3 text-sm text-yellow-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-semibold">
                Este ticket ha sido marcado como {ticketStatus?.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div className="bg-[#050c1b] text-white">
        {filteredMessages.map((message) => (
          <div key={message.id}>
            {/* Timestamp arriba de la burbuja */}
            {message.createdAt && (
              <div
                className={
                  `mb-1 flex text-xs text-white/40 ` +
                  (message.sender === 'user' ? 'justify-end' : 'justify-start')
                }
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
                  <MdSupportAgent className="mt-2 text-2xl text-[#3AF4EF]" />
                ) : user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName ?? 'User'}
                    width={24}
                    height={24}
                    className="mt-2 rounded-full"
                  />
                ) : (
                  <BsPersonCircle className="mt-2 text-xl text-white/60" />
                )}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-lg ${message.sender === 'user' ? 'bg-gradient-to-r from-[#00bdd8] to-[#009fbf] text-white shadow-[#00bdd8]/30' : 'border border-white/10 bg-[#08142a] text-white'}`}
                >
                  <div className="whitespace-pre-wrap">{message.text}</div>
                  {message.buttons && message.buttons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.buttons.map((button, index) => (
                        <button
                          key={index}
                          onClick={() => onBotButtonClick?.(button.action)}
                          className="rounded-lg border border-[#00bdd8]/70 px-3 py-2 text-xs font-semibold text-[#3AF4EF] transition-colors hover:bg-[#00bdd8] hover:text-[#041226] focus:outline-none"
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
      <form onSubmit={handleSendMessage} className="mt-2 flex w-full gap-2">
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
          className="flex-1 rounded-lg border border-[#1f2c44] bg-[#0b1d36] p-2 text-sm text-white placeholder-white/40 focus:border-[#3AF4EF] focus:ring-2 focus:ring-[#3AF4EF] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#1a2a44] disabled:text-white/30 sm:p-3 sm:text-base"
        />
        <button
          type="submit"
          disabled={isLoading || isTicketClosed}
          className="rounded-lg bg-gradient-to-r from-[#00bdd8] to-[#009fbf] px-4 py-2 text-sm font-semibold text-[#041226] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-base"
        >
          Enviar
        </button>
      </form>
    </>
  );
};

export default SuportChat;
