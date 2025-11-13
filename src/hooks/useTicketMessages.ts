import useSWR from 'swr';

export interface TicketMessage {
  id: number;
  content: string;
  sender: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TicketMessagesResponse {
  ticketId: number;
  ticketStatus?: string;
  messages: TicketMessage[];
  updatedAt: string;
}

const fetcher = async (url: string): Promise<TicketMessagesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Error al cargar mensajes del ticket');
  }
  const data = await res.json();
  return data as TicketMessagesResponse;
};

/**
 * Hook personalizado para obtener mensajes de un ticket en tiempo real usando SWR
 * @param ticketId - ID del ticket (null para no hacer petición)
 * @param refreshInterval - Intervalo de refresco en ms (por defecto 3000ms = 3s)
 * @returns Objeto con datos, error, isLoading y mutate
 */
export function useTicketMessages(
  ticketId: number | null,
  refreshInterval = 3000
) {
  const { data, error, mutate, isLoading } = useSWR<TicketMessagesResponse>(
    ticketId ? `/api/tickets/${ticketId}/messages` : null,
    fetcher,
    {
      refreshInterval, // Polling automático cada X ms
      revalidateOnFocus: true, // Revalidar al volver a la ventana
      revalidateOnReconnect: true, // Revalidar al reconectar
      dedupingInterval: 1000, // Evitar peticiones duplicadas en 1s
    }
  );

  return {
    messages: data?.messages ?? [],
    ticketId: data?.ticketId,
    ticketStatus: data?.ticketStatus,
    updatedAt: data?.updatedAt,
    isLoading,
    isError: error,
    mutate, // Para forzar revalidación manual
  };
}
