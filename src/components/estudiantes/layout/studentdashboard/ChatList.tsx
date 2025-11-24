'use client';

import React, { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { Button } from '@headlessui/react';
import { FileText, Loader2, Plus, Ticket } from 'lucide-react';
import { BsRobot } from 'react-icons/bs';
import { IoChatboxEllipses } from 'react-icons/io5';
import { toast } from 'sonner';

import { getConversationByUserId } from '~/server/actions/estudiantes/chats/saveChat';
import {
  getTicketsByUser,
  getUserOpenTicket,
} from '~/server/actions/estudiantes/chats/suportChatBot';

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
  updatedAt?: string | Date;
  status?: string;
  unreadCount?: number;
}

const chatTypeConfig = {
  ticket: {
    icon: <Ticket className="h-4 w-4 text-white" />,
    color: 'purple',
  },
  chat: {
    icon: <IoChatboxEllipses className="h-4 w-4 text-white" />,
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
  const [isLoading, setIsLoading] = useState(true); // Solo true en mount inicial
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Nuevo estado para controlar carga inicial
  const [loadingChatId, setLoadingChatId] = useState<number | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { user } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'abierto' | 'solucionado' | 'cerrado'
  >('all');
  const [selectedChats, setSelectedChats] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Función para formatear fecha y hora en formato colombiano (12 horas)
  const formatColombianDateTime = (date: string | Date | undefined) => {
    if (!date) return '';

    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    return dateObj.toLocaleString('es-CO', options);
  };

  // Función para limpiar el título del chat
  const cleanChatTitle = (title: string) => {
    // Quitar "Búsqueda: " del inicio
    let cleanTitle = title.replace(/^Búsqueda:\s*/i, '');

    // Quitar fechas en formato DD-MM-YYYY HH:MM del final (con o sin guión)
    cleanTitle = cleanTitle.replace(
      /\s*-?\s*\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}$/,
      ''
    );

    // Quitar fechas en formato DD-MM-YYYY del final (solo fecha)
    cleanTitle = cleanTitle.replace(/\s+\d{2}-\d{2}-\d{4}$/, '');

    // Si queda solo "hola..." o texto muy corto, usar "Chat" como título
    if (cleanTitle.length <= 3 || cleanTitle.toLowerCase().includes('hola')) {
      return 'Chat';
    }

    return cleanTitle.trim() || 'Chat';
  };

  // Función para asignar títulos únicos a los chats
  const assignUniqueTitles = (chats: Chat[]) => {
    return chats.map((chat, index) => {
      if (chat.type === 'ticket') {
        // Para tickets: "Ticket #ID"
        return { ...chat, title: `Ticket #${chat.id}` };
      } else {
        // Para chats de IA: solo el más reciente es "Nuevo Chat", los demás son "Chat"
        const isNewest = index === 0; // El array ya está ordenado por fecha desc
        return {
          ...chat,
          title: isNewest ? 'Nuevo Chat' : 'Chat',
        };
      }
    });
  };

  // Función para formatear la fecha con prefijo "Modificado"
  const formatChatDateTime = (chat: Chat) => {
    const dateToUse = chat.updatedAt ?? chat.createdAt;
    const formattedDate = formatColombianDateTime(dateToUse);

    // Si hay updatedAt y es diferente a createdAt, mostrar "Modificado"
    if (
      chat.updatedAt &&
      chat.createdAt &&
      new Date(chat.updatedAt).getTime() !== new Date(chat.createdAt).getTime()
    ) {
      return `Modificado: ${formattedDate}`;
    }

    return formattedDate;
  };

  const handleCreateNewTicket = () => {
    if (!user?.id) return;

    setIsCreatingTicket(true);

    // Validar si existe un ticket abierto
    getUserOpenTicket(user.id)
      .then((open) => {
        if (
          open &&
          (open.estado ?? '').toLowerCase() !== 'cerrado' &&
          (open.estado ?? '').toLowerCase() !== 'solucionado'
        ) {
          toast.error(
            'Tienes un ticket abierto. No puedes crear uno nuevo hasta cerrarlo.'
          );
          // Opcional: abrir el ticket abierto
          window.dispatchEvent(
            new CustomEvent('support-open-chat', { detail: { id: open.id } })
          );
          setIsCreatingTicket(false);
          return;
        }
        // Disparar evento para crear nuevo ticket
        window.dispatchEvent(
          new CustomEvent('create-new-ticket', {
            detail: {
              userId: user.id,
              email: user.emailAddresses?.[0]?.emailAddress,
            },
          })
        );

        // El spinner se desactivará cuando se abra el chat de soporte
        setTimeout(() => {
          setIsCreatingTicket(false);
        }, 1500);
      })
      .catch((err) => {
        console.error('Error verificando ticket abierto:', err);
        // fallback: intentar crear igualmente
        window.dispatchEvent(
          new CustomEvent('create-new-ticket', {
            detail: {
              userId: user.id,
              email: user.emailAddresses?.[0]?.emailAddress,
            },
          })
        );

        setTimeout(() => {
          setIsCreatingTicket(false);
        }, 1500);
      });
  };

  const handleCreateNewChat = () => {
    if (!user?.id) return;
    setIsCreatingChat(true);

    // Crear nuevo chat con menú inicial de Artie y curso_id: null
    const now = Date.now();
    const initialTitle = `Búsqueda: Chat nuevo - ${new Date(now).toLocaleString('es-CO')}`;
    import('~/server/actions/estudiantes/chats/saveChat').then((mod) => {
      // Tipar la respuesta como objeto que contiene `id`
      const fn = mod.getOrCreateConversation as (args: {
        senderId: string;
        cursoId: number | null;
        title?: string;
      }) => Promise<{ id: number }>;

      fn({ senderId: user.id, cursoId: null, title: initialTitle })
        .then((response) => {
          window.dispatchEvent(
            new CustomEvent('create-new-chat-with-search', {
              detail: {
                query: '',
                chatId: response.id,
                initialMenu: true,
              },
            })
          );
          setShowChatList(false);
          setIsCreatingChat(false);
        })
        .catch((err) => {
          console.error('Error creando chat IA:', err);
          setIsCreatingChat(false);
        });
    });
  };

  useEffect(() => {
    if (!user?.id) return;

    setShowChatList(true);
    // Solo mostrar loader en la carga inicial, no en los refrescos periódicos
    if (isInitialLoad) {
      setIsLoading(true);
    }

    const fetchChats = async () => {
      try {
        let allChats: Chat[] = [];

        if (activeType === 'chatia') {
          const result = await getConversationByUserId(user.id);
          allChats = result.conversations.map((conv) => ({
            id: conv.id,
            title: cleanChatTitle(conv.title || 'Sin título'),
            curso_id: conv.curso_id,
            type: 'chat' as const,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
          }));
        } else if (activeType === 'tickets') {
          const list = await getTicketsByUser(user.id);
          // Filtro por estado si aplica
          const filtered =
            statusFilter === 'all'
              ? list
              : list.filter(
                  (t) => (t.estado ?? '').toLowerCase() === statusFilter
                );

          allChats = filtered.map((t) => ({
            id: t.id,
            title: 'Ticket de Soporte',
            curso_id: null,
            type: 'ticket' as const,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            status: (t.estado ?? '').toLowerCase(),
            // Añadimos unread flag si el backend devolvió unreadCount
            unreadCount: (t as { unreadCount?: number }).unreadCount ?? 0,
          }));
        } else if (activeType === 'projects') {
          // TODO: Implementar cuando tengamos la API de proyectos
          allChats = [];
        }

        // Ordenar por fecha de actualización, más recientes primero
        allChats.sort((a, b) => {
          // Si es de tipo ticket, priorizar los que tienen mensajes sin leer
          if (activeType === 'tickets') {
            const aUnread = a.unreadCount ?? 0;
            const bUnread = b.unreadCount ?? 0;

            // Si uno tiene mensajes sin leer y el otro no, el que tiene sin leer va primero
            if (aUnread > 0 && bUnread === 0) return -1;
            if (aUnread === 0 && bUnread > 0) return 1;

            // Si ambos tienen o ambos no tienen sin leer, ordenar por fecha de actualización
          }

          const getTimestamp = (chat: Chat) => {
            const date = chat.updatedAt ?? chat.createdAt;
            if (!date) return 0;
            return new Date(date).getTime();
          };

          return getTimestamp(b) - getTimestamp(a);
        });

        // Asignar títulos únicos después del ordenamiento
        allChats = assignUniqueTitles(allChats);

        setChats(allChats);
      } catch (error) {
        console.error('Error al traer chats:', error);
        setChats([]);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    void fetchChats();
  }, [
    user?.id,
    activeType,
    setShowChatList,
    refreshKey,
    statusFilter,
    isInitialLoad,
  ]);

  // Refresco periódico para tickets: asegura que el badge "Nuevo" reaparezca cuando admins comentan
  useEffect(() => {
    if (!user?.id || activeType !== 'tickets') return;
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 4000); // cada 4s; ajustar si deseas menos/más frecuencia
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, activeType]);

  // Escuchar eventos globales para refrescar la lista cuando se creen/actualicen tickets
  useEffect(() => {
    const handleRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener('ticket-created', handleRefresh);
    window.addEventListener('chat-updated', handleRefresh);
    return () => {
      window.removeEventListener('ticket-created', handleRefresh);
      window.removeEventListener('chat-updated', handleRefresh);
    };
  }, []);

  const statusBadge = (status?: string) => {
    const s = (status ?? '').toLowerCase();
    if (s === 'abierto')
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (s === 'solucionado')
      return 'bg-green-100 text-green-800 border-green-200';
    if (s === 'cerrado') return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleSelectChat = (chatId: number, checked: boolean) => {
    if (checked) {
      setSelectedChats((prev) => [...prev, chatId]);
    } else {
      setSelectedChats((prev) => prev.filter((id) => id !== chatId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedChats.length === 0) return;
    const confirm = window.confirm(
      `¿Eliminar ${selectedChats.length} chat(s) seleccionado(s)? Esta acción no se puede deshacer.`
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const mod = await import('~/server/actions/estudiantes/chats/saveChat');
      const deleteFn = mod.deleteConversation as (id: number) => Promise<void>;
      for (const id of selectedChats) {
        await deleteFn(id);
      }
      setSelectedChats([]);
      setRefreshKey((k) => k + 1);
      toast.success('Chats eliminados correctamente');
    } catch (error) {
      console.error('Error eliminando chats:', error);
      toast.error('Error al eliminar algunos chats');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col border-r border-transparent bg-gradient-to-b from-[#061226] to-[#071024] text-white">
      <div
        className={`border-b border-gray-700 p-4 ${activeType === 'tickets' ? 'pt-6' : ''}`}
      >
        <h2
          className={`flex items-center justify-center gap-2 text-center text-lg font-extrabold tracking-tight ${activeType === 'chatia' ? 'bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent' : 'text-white'}`}
        >
          {activeType === 'tickets' ? (
            'Tickets de Soporte'
          ) : activeType === 'projects' ? (
            'Mis Proyectos'
          ) : (
            <>
              Chats con IA
              <BsRobot className="h-5 w-5 text-white" />
            </>
          )}
        </h2>

        {/* Botón para crear nuevo chat de IA */}
        {activeType === 'chatia' && (
          <div className="mt-3 space-y-2">
            <Button
              onClick={handleCreateNewChat}
              disabled={isCreatingChat}
              className="w-full transform-gpu rounded-lg px-4 py-2 transition-transform hover:scale-[1.02] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'linear-gradient(90deg,#3AF4EF,#00BDD8)',
                boxShadow:
                  '0 6px 24px rgba(58,244,239,0.24), 0 0 18px rgba(0,189,216,0.18)',
              }}
            >
              <div className="flex items-center justify-center gap-2 font-semibold text-black">
                {isCreatingChat ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando chat...
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-white/20 p-1 shadow-sm">
                        <Plus className="h-4 w-4 text-black" />
                      </span>
                      Crear Nuevo Chat IA
                    </span>
                  </>
                )}
              </div>
            </Button>
            {selectedChats.length > 0 && (
              <Button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>Eliminar {selectedChats.length} chat(s)</>
                  )}
                </div>
              </Button>
            )}
          </div>
        )}

        {/* Botón para crear nuevo ticket */}
        {activeType === 'tickets' && (
          <div className="mt-3">
            <Button
              onClick={handleCreateNewTicket}
              disabled={isCreatingTicket}
              className="w-full transform-gpu rounded-lg px-4 py-2 transition-transform hover:scale-[1.02] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'linear-gradient(90deg,#3AF4EF,#00BDD8)',
                boxShadow:
                  '0 6px 24px rgba(58,244,239,0.24), 0 0 18px rgba(0,189,216,0.18)',
              }}
            >
              <div className="flex items-center justify-center gap-2 font-semibold text-black">
                {isCreatingTicket ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando ticket...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-black" />
                    Crear Nuevo Ticket
                  </>
                )}
              </div>
            </Button>
          </div>
        )}

        {/* Filtro por estado para tickets */}
        {activeType === 'tickets' && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-300">
              Filtrar por estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white shadow-sm focus:border-gray-500 focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="abierto">Abierto</option>
              <option value="solucionado">Solucionado</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <span className="text-sm text-gray-500">Cargando...</span>
          </div>
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-gray-500">
          No hay{' '}
          {activeType === 'tickets'
            ? 'tickets'
            : activeType === 'projects'
              ? 'proyectos'
              : 'chats'}{' '}
          disponibles
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto pr-2 pb-6">
          {chats.map((chat) => (
            <li key={chat.id} className="relative">
              <div className="flex items-center gap-2 p-2">
                <Button
                  onClick={() => {
                    setLoadingChatId(chat.id);
                    if (chat.type === 'ticket') {
                      window.dispatchEvent(
                        new CustomEvent('support-open-chat', { detail: chat })
                      );
                    } else {
                      setChatMode({
                        idChat: chat.id,
                        status: true,
                        curso_title: chat.title,
                        type: chat.type,
                      });
                    }
                    // Reset loading después de un breve delay
                    setTimeout(() => setLoadingChatId(null), 1000);
                  }}
                  className="flex-1 rounded-xl border border-white/6 bg-white/4 px-4 py-3 text-left backdrop-blur-sm transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-white/6 hover:shadow-[0_8px_30px_rgba(59,130,246,0.06)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {loadingChatId === chat.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                      ) : (
                        chat.type && chatTypeConfig[chat.type]?.icon
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-semibold text-white">
                          {chat.title}
                        </div>
                        {chat.type === 'ticket' && (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 truncate rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusBadge(chat.status)}`}
                            >
                              {chat.status
                                ? chat.status.charAt(0).toUpperCase() +
                                  chat.status.slice(1)
                                : '—'}
                            </span>
                            {Number(chat.unreadCount) > 0 && (
                              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                                Nuevo
                              </span>
                            )}
                          </div>
                        )}
                        {/* Badge for new chats (futuristic neon) */}
                        {chat.title === 'Nuevo Chat' && (
                          <span className="ml-2 inline-flex items-center gap-2">
                            <span className="animate-pulse rounded-full bg-gradient-to-r from-green-400 to-cyan-300 p-1 shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
                            <span
                              className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm"
                              style={{
                                boxShadow: '0 6px 18px rgba(6,182,212,0.12)',
                              }}
                            >
                              <span className="text-green-200">Nuevo</span>
                            </span>
                          </span>
                        )}
                      </div>
                      {/* Fecha y hora de creación/modificación */}
                      <div className="mt-1 truncate text-xs text-white/60">
                        {formatChatDateTime(chat)}
                      </div>
                    </div>
                  </div>
                </Button>

                {activeType === 'chatia' && (
                  <input
                    type="checkbox"
                    checked={selectedChats.includes(chat.id)}
                    onChange={(e) =>
                      handleSelectChat(chat.id, e.target.checked)
                    }
                    className="ml-3 h-4 w-4 rounded border-gray-300 text-cyan-400 focus:ring-cyan-300"
                    aria-label={`Seleccionar chat ${chat.title}`}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
