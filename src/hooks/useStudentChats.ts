import useSWR from 'swr';

export interface StudentChat {
  id: number;
  title: string;
  curso_id: number | null;
  type?: 'ticket' | 'chat' | 'project';
  createdAt?: string | Date;
  updatedAt?: string | Date;
  status?: string;
  unreadCount?: number;
}

export interface StudentChatsResponse {
  chats: StudentChat[];
}

const fetcher = async (url: string): Promise<StudentChatsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Error al cargar chats');
  }
  const data = await res.json();
  return data as StudentChatsResponse;
};

/**
 * Hook personalizado para obtener chats del estudiante en tiempo real usando SWR
 * @param activeType - Tipo de chats a obtener: 'chatia' | 'tickets' | 'projects'
 * @param statusFilter - Filtro de estado para tickets: 'all' | 'abierto' | 'solucionado' | 'cerrado'
 * @param refreshInterval - Intervalo de refresco en ms (por defecto 4000ms = 4s)
 * @returns Objeto con data, error, isLoading y mutate
 */
export function useStudentChats(
  activeType: 'tickets' | 'chatia' | 'projects' = 'chatia',
  statusFilter: 'all' | 'abierto' | 'solucionado' | 'cerrado' = 'all',
  refreshInterval = 4000
) {
  const url = `/api/estudiantes/chats?type=${activeType}&status=${statusFilter}`;

  const { data, error, isLoading, mutate } = useSWR<StudentChatsResponse>(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Evita peticiones duplicadas en 2s
    }
  );

  return {
    // Devolver `null` cuando no hay datos para evitar crear
    // una nueva referencia de array vacío en cada render.
    chats: data?.chats ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
