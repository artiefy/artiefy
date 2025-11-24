'use client';

import React, { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { Button } from '@headlessui/react';
import { motion } from 'framer-motion';
import { ChevronDown, FileText, MessageSquare, Ticket } from 'lucide-react';
import { BsRobot } from 'react-icons/bs';

import { getConversationByUserId } from '~/server/actions/estudiantes/chats/saveChat';
import { getTicketByUser } from '~/server/actions/estudiantes/chats/suportChatBot';

interface ChatListProps {
  setChatMode: React.Dispatch<
    React.SetStateAction<{
      idChat: number | null;
      status: boolean;
      curso_title: string;
      type?: 'ticket' | 'chat' | 'project';
    }>
  >;
  setShowChatList: React.Dispatch<React.SetStateAction<boolean>>;
  activeType?: 'tickets' | 'chatia' | 'projects';
}

interface Chat {
  id: number;
  title: string;
  curso_id: number | null;
  type?: 'ticket' | 'chat' | 'project';
  createdAt?: string | Date;
}

const chatTypeConfig = {
  ticket: {
    icon: <Ticket className="h-4 w-4" />,
    color: 'purple',
  },
  chat: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'blue',
  },
  project: {
    icon: <FileText className="h-4 w-4" />,
    color: 'green',
  },
} as const;

export const ChatList = ({
  setChatMode,
  setShowChatList,
  activeType = 'chatia',
}: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user?.id) return;

    // Cambiamos el status a true en setChatMode para
    setShowChatList(true);

    const fetchChats = async () => {
      try {
        let allChats: Chat[] = [];

        // Obtener chats según el tipo activo
        if (activeType === 'chatia') {
          const result = await getConversationByUserId(user.id);
          allChats = result.conversations.map((conv) => ({
            id: conv.id,
            title: conv.title || 'Sin título',
            curso_id: conv.curso_id,
            type: 'chat' as const,
            createdAt: conv.createdAt,
          }));
        } else if (activeType === 'tickets') {
          const ticketData = await getTicketByUser(user.id);
          if (ticketData.ticket) {
            allChats = [
              {
                id: ticketData.ticket.id,
                title: 'Ticket de Soporte',
                curso_id: null,
                type: 'ticket',
                createdAt: ticketData.ticket.createdAt,
              },
            ];
          }
        } else if (activeType === 'projects') {
          // Aquí se pueden cargar los proyectos del usuario cuando tengamos la API
          allChats = [];
        }

        // Ordenar por fecha de creación, más recientes primero
        allChats.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setChats(allChats);
        console.log('Chats obtenidos:', allChats);
      } catch (error) {
        console.error('Error al traer chats:', error);
        setChats([]);
      }
    };

    void fetchChats();
  }, [user?.id, activeType, setShowChatList]);

  return (
    <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="flex items-center justify-center gap-2 text-center text-lg font-semibold text-gray-800">
          {activeType === 'tickets' ? (
            'Tickets de Soporte'
          ) : activeType === 'projects' ? (
            'Mis Proyectos'
          ) : (
            <BsRobot className="h-5 w-5 text-white" />
          )}
        </h2>
      </div>

      {/* Botón para crear nuevo chat/ticket */}
      {activeType === 'tickets' && chats.length === 0 && (
        <div className="p-4">
          <Button
            onClick={() => {
              // Crear nuevo ticket de soporte
              setChatMode({
                idChat: null,
                status: true,
                curso_title: 'Nuevo Ticket de Soporte',
                type: 'ticket',
              });
              setShowChatList(false);
            }}
            className="w-full rounded-lg bg-purple-500 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-purple-600"
          >
            <div className="flex items-center justify-center gap-2">
              <Ticket className="h-5 w-5" />
              Crear Nuevo Ticket
            </div>
          </Button>
        </div>
      )}

      {chats.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-gray-500">
          {activeType === 'tickets'
            ? 'No tienes tickets de soporte. Crea uno nuevo para obtener ayuda.'
            : `No hay ${activeType === 'projects' ? 'proyectos' : 'chats'} disponibles`}
        </div>
      ) : (
        <ul className="max-h-[calc(4*110px)] flex-1 overflow-y-auto pr-2">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Button
                onClick={() => {
                  if (chat.type === 'ticket') {
                    setChatMode({
                      idChat: chat.id,
                      status: true,
                      curso_title: chat.title,
                      type: 'ticket',
                    });
                    setShowChatList(false);
                  } else {
                    setChatMode({
                      idChat: chat.id,
                      status: true,
                      curso_title: chat.title,
                      type: chat.type,
                    });
                    setShowChatList(false);
                  }
                }}
                className="w-full border-b border-gray-100 bg-gray-50 px-4 py-3 text-left transition-transform duration-200 ease-in-out hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2">
                  {chat.type && chatTypeConfig[chat.type]?.icon}
                  <div className="truncate font-medium text-gray-800">
                    {chat.title}
                  </div>
                </div>
                <div className="mt-1 truncate text-sm text-gray-500">
                  {chat.curso_id
                    ? 'Ver curso'
                    : chat.type === 'ticket'
                      ? 'Ver ticket'
                      : 'Continuar chat'}
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`mt-2 flex w-27 items-center gap-1 rounded-2xl px-3 py-1 text-sm text-white shadow-md ${
                    chat.type && chatTypeConfig[chat.type]?.color === 'purple'
                      ? 'bg-purple-500 hover:bg-purple-600'
                      : chat.type &&
                          chatTypeConfig[chat.type]?.color === 'green'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  Abrir
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Botón flotante para crear nuevo cuando ya existen chats */}
      {chats.length > 0 && activeType === 'tickets' && (
        <div className="border-t border-gray-200 p-4">
          <Button
            onClick={() => {
              setChatMode({
                idChat: null,
                status: true,
                curso_title: 'Nuevo Ticket de Soporte',
                type: 'ticket',
              });
              setShowChatList(false);
            }}
            className="w-full rounded-lg bg-purple-500 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-purple-600"
          >
            <div className="flex items-center justify-center gap-2">
              <Ticket className="h-4 w-4" />
              Nuevo Ticket
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};
