import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getConversationByUserId } from '~/server/actions/estudiantes/chats/saveChat';
import { getTicketsByUser } from '~/server/actions/estudiantes/chats/suportChatBot';

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

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? 'chatia';
    const statusFilter = searchParams.get('status') ?? 'all';

    let allChats: Chat[] = [];

    // Obtener chats según el tipo solicitado
    if (type === 'chatia') {
      const result = await getConversationByUserId(userId);
      allChats = result.conversations.map((conv) => ({
        id: conv.id,
        title: conv.title || 'Sin título',
        curso_id: conv.curso_id,
        type: 'chat' as const,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    } else if (type === 'tickets') {
      const list = await getTicketsByUser(userId);

      // Aplicar filtro de estado si no es 'all'
      const filtered =
        statusFilter === 'all'
          ? list
          : list.filter((t) => (t.estado ?? '').toLowerCase() === statusFilter);

      allChats = filtered.map((t) => ({
        id: t.id,
        title: 'Ticket de Soporte',
        curso_id: null,
        type: 'ticket' as const,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        status: (t.estado ?? '').toLowerCase(),
        unreadCount: (t as { unreadCount?: number }).unreadCount ?? 0,
      }));
    }

    // Ordenar por fecha de actualización, más recientes primero
    allChats.sort((a, b) => {
      // Si es de tipo ticket, priorizar los que tienen mensajes sin leer
      if (type === 'tickets') {
        const aUnread = a.unreadCount ?? 0;
        const bUnread = b.unreadCount ?? 0;

        if (aUnread > 0 && bUnread === 0) return -1;
        if (aUnread === 0 && bUnread > 0) return 1;
      }

      const getTimestamp = (chat: Chat) => {
        const date = chat.updatedAt ?? chat.createdAt;
        if (!date) return 0;
        return new Date(date).getTime();
      };

      return getTimestamp(b) - getTimestamp(a);
    });

    return NextResponse.json({ chats: allChats }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener chats:', error);
    return NextResponse.json(
      { error: 'Error al obtener chats' },
      { status: 500 }
    );
  }
}
