import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';

interface Ticket {
  id: number;
  unread_count: number;
}

export function useTicketsUnread() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  const ticketType = role === 'super-admin' ? 'created' : 'assigned';

  const shouldFetch = Boolean(
    user?.id && role && (role === 'admin' || role === 'super-admin')
  );

  const { data: tickets = [] } = useSWR<Ticket[]>(
    shouldFetch ? [`/api/admin/tickets?type=${ticketType}`, user?.id] : null,
    async () => {
      const res = await fetch(`/api/admin/tickets?type=${ticketType}`);
      if (!res.ok) return [];
      return (await res.json()) as Ticket[];
    },
    { refreshInterval: 15000 }
  );

  const totalUnread = tickets.reduce(
    (sum: number, ticket: Ticket) => sum + (ticket.unread_count || 0),
    0
  );

  return { totalUnread, isLoading: !tickets.length && shouldFetch };
}
