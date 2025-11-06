'use client';

import { useEffect, useRef } from 'react';

import Image from 'next/image';

import { BsPersonCircle } from 'react-icons/bs';
import { MdSupportAgent } from 'react-icons/md';

import { formatDateColombia } from '~/lib/formatDate';
import { getOrCreateSuportChat } from '~/server/actions/estudiantes/chats/suportChatBot';

import type { UserResource } from '@clerk/types';

interface SuportChatProps {
  messages: { id: number; text: string; sender: string }[];
  setMessages: React.Dispatch<
    React.SetStateAction<{ id: number; text: string; sender: string }[]>
  >;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSignedIn?: boolean;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputText: string;
  setInputText: (text: string) => void;
  user: UserResource | null | undefined;
  inputRef?: React.RefObject<HTMLInputElement>;
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
}) => {
  const defaultInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef ?? defaultInputRef;

  useEffect(() => {
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
          const historyMessages = ticket.messages
            ? ticket.messages.map((msg) => ({
                id: msg.id,
                text: msg.content,
                sender: msg.sender === 'user' ? 'user' : 'support',
              }))
            : [];

          const initialMessages = [
            {
              id: Date.now(),
              text: '¡Hola! ¿En qué puedo ayudarte?',
              sender: 'support',
            },
            ...historyMessages,
          ];

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
  }, [setMessages, user]);

  return (
    <>
      {/* Messages*/}
      <div className="support-chat-messages">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`flex max-w-[80%] items-start space-x-2 ${
                  message.sender === 'user'
                    ? 'flex-row-reverse space-x-reverse'
                    : 'flex-row'
                }`}
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
                    // Removido el priority ya que estas imágenes se cargan dinámicamente
                  />
                ) : (
                  <BsPersonCircle className="mt-2 text-xl text-gray-500" />
                )}
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 p-3">
              <div className="flex space-x-2">
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - Modificado para ser más compacto en móvil */}
      <form onSubmit={handleSendMessage} className="support-chat-input">
        <input
          ref={actualInputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe el problema..."
          className="text-background focus:ring-secondary flex-1 rounded-lg border p-1 text-sm focus:ring-2 focus:outline-none sm:p-2 sm:text-base"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-secondary rounded-lg px-3 py-1 text-sm text-white transition-colors hover:bg-[#00A5C0] disabled:bg-gray-300 sm:px-4 sm:py-2 sm:text-base"
        >
          Enviar
        </button>
      </form>
    </>
  );
};

export default SuportChat;
