'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { Bell, BellRing } from 'lucide-react';

import { useTicketsUnread } from '~/../src/hooks/useTicketsUnread';

export function TicketNotificationBell() {
  const router = useRouter();
  const { user } = useUser();
  const [isAnimating, setIsAnimating] = useState(false);
  const { totalUnread } = useTicketsUnread();

  const role = user?.publicMetadata?.role as string | undefined;

  if (!role || (role !== 'admin' && role !== 'super-admin')) {
    return null;
  }

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (role === 'super-admin') {
      router.push('/dashboard/super-admin/tickets');
    } else if (role === 'admin') {
      router.push('/dashboard/admin/tickets');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group md:hover:bg-primary relative ml-2 rounded-full p-2 transition-all hover:bg-gray-800 ${
        isAnimating ? 'animate-bounce' : ''
      }`}
      type="button"
      aria-label="Tickets de soporte"
    >
      <span className="absolute top-full left-1/2 z-50 mt-2 hidden -translate-x-1/2 rounded bg-white px-2 py-1 text-xs whitespace-nowrap text-black opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
        Tickets de Soporte
      </span>

      {totalUnread > 0 ? (
        <BellRing className="group-hover:text-background size-6 text-white transition-colors" />
      ) : (
        <Bell className="group-hover:text-background size-6 text-white transition-colors" />
      )}

      {totalUnread > 0 && (
        <span className="ring-background absolute -top-1 -right-1 flex h-5 min-w-[20px] animate-pulse items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow-lg ring-2">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </button>
  );
}
