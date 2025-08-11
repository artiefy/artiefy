// components/ChatList.tsx
import React, { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { Button } from '@headlessui/react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { getConversationByUserId } from '~/server/actions/estudiantes/chats/saveChat';
import { getTicketByUser } from '~/server/actions/estudiantes/chats/suportChatBot';

// Database methods

interface ChatListProps {
  setChatMode: React.Dispatch<
    React.SetStateAction<{
      idChat: number | null;
      status: boolean;
      curso_title: string;
    }>
  >;
  setShowChatList: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Conversation {
  id: number;
  title: string;
  curso_id: number;
}

interface Chat {
  id: number;
  title: string;
  curso_id: number | null;
  tipo?: string;
}

export const ChatList = ({ setChatMode, setShowChatList }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user?.id) return;

    // Cambiamos el status a true en setChatMode para
    setShowChatList(true);

    const fetchChats = async () => {
      try {
        const result = await getConversationByUserId(user.id);
        const ticketData = await getTicketByUser(user.id);

        console.log('Ticket:', ticketData);
        console.log('User id:', user.id);

        // Crear el objeto del ticket (solo si existe)
        const ticketItem = ticketData.ticket
          ? {
              id: ticketData.ticket.id,
              title: 'Ticket de Soporte',
              curso_id: null, // o puedes usar `ticketData.ticket.curso_id` si lo tienes
              tipo: 'ticket', // extra opcional para diferenciarlo de las conversaciones
            }
          : null;

        // Mapear las conversaciones
        const conversationItems = result.conversations.map(
          (conv: Conversation) => ({
            id: conv.id,
            title: conv.title ?? 'Sin título',
            curso_id: conv.curso_id ?? null,
            tipo: 'conversation', // opcional, si quieres diferenciarlos
          })
        );

        // Combinar ticket primero, luego las conversaciones
        const allChats = ticketItem
          ? [ticketItem, ...conversationItems]
          : conversationItems;

        // Setear en el estado
        setChats(allChats);

        console.log('Chats obtenidos:', allChats);
      } catch (error) {
        console.error('Error al traer chats:', error);
        setChats([]);
      }
    };

    void fetchChats();
  }, [user, setShowChatList]);

  return (
    <>
      <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-center text-lg font-semibold text-gray-800">
            Chats Recientes
          </h2>
        </div>

        <ul className="max-h-[calc(4*110px)] flex-1 overflow-y-auto pr-2">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Button
                onClick={() => {
                  if (chat.curso_id) {
                    setChatMode({
                      idChat: chat.curso_id,
                      status: true,
                      curso_title: chat.title,
                    });
                  } else {
                    window.dispatchEvent(
                      new CustomEvent('support-open-chat', { detail: chat })
                    );
                  }
                  console.log('Chat seleccionado:', chat);
                }}
                className="w-full border-b border-gray-100 bg-gray-50 px-4 py-3 text-left transition-transform duration-200 ease-in-out hover:scale-[1.02]"
              >
                <div className="truncate font-medium text-gray-800">
                  {chat.title}
                </div>
                <div className="truncate text-sm text-gray-500">
                  {chat.curso_id ? 'Ver curso' : 'Ver Ticket'}
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={
                    chat.curso_id
                      ? 'flex w-27 items-center gap-1 rounded-2xl bg-blue-500 px-3 py-1 text-sm text-white shadow-md hover:bg-blue-600'
                      : 'flex w-27 items-center gap-1 rounded-2xl bg-yellow-500 px-3 py-1 text-sm text-white shadow-md hover:bg-yellow-600'
                  }
                >
                  Ver más
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-200 p-4 text-center text-sm text-gray-500">
          <h2 className="text-lg font-semibold text-gray-800">
            Proyectos Inscritos
          </h2>
        </div>
        <ul className="max-h-[50%] flex-1 scroll-mb-2 overflow-y-auto pr-2 sm:max-h-[360px]">
          {/* Datos estáticos simulando proyectos inscritos */}
          <li>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <div className="truncate font-medium text-gray-800">
                Proyecto: App de Finanzas
              </div>
              <div className="truncate text-sm text-gray-500">Ver Proyecto</div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex w-27 items-center gap-1 rounded-2xl bg-purple-500 px-3 py-1 text-sm text-white shadow-md hover:bg-purple-600"
              >
                Ver más
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          </li>
          <li>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <div className="truncate font-medium text-gray-800">
                Proyecto: Gestor de Tareas
              </div>
              <div className="truncate text-sm text-gray-500">Ver Proyecto</div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex w-27 items-center gap-1 rounded-2xl bg-purple-500 px-3 py-1 text-sm text-white shadow-md hover:bg-purple-600"
              >
                Ver más
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          </li>
          <li>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <div className="truncate font-medium text-gray-800">
                Proyecto: Gestor de Tareas
              </div>
              <div className="truncate text-sm text-gray-500">Ver Proyecto</div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex w-27 items-center gap-1 rounded-2xl bg-purple-500 px-3 py-1 text-sm text-white shadow-md hover:bg-purple-600"
              >
                Ver más
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          </li>
          <li>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <div className="truncate font-medium text-gray-800">
                Proyecto: Gestor de Tareas - PreUlt
              </div>
              <div className="truncate text-sm text-gray-500">Ver Proyecto</div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex w-27 items-center gap-1 rounded-2xl bg-purple-500 px-3 py-1 text-sm text-white shadow-md hover:bg-purple-600"
              >
                Ver más
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          </li>
          <li>
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <div className="truncate font-medium text-gray-800">
                Proyecto: Gestor de Tareas - Ult
              </div>
              <div className="truncate text-sm text-gray-500">Ver Proyecto</div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex w-27 items-center gap-1 rounded-2xl bg-purple-500 px-3 py-1 text-sm text-white shadow-md hover:bg-purple-600"
              >
                Ver más
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          </li>

          <li className="d-none sm:none">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <div className="truncate font-medium text-gray-800" />
              <div className="truncate text-sm text-gray-500" />
            </div>
            {innerWidth <= 640 && (
              <>
                <br />
                <br />
                <br />
              </>
            )}
          </li>
        </ul>
      </div>
    </>
  );
};
