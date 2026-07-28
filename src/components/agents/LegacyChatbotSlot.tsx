'use client';

import { usePathname } from 'next/navigation';

import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';

/**
 * Renders the legacy student chatbot everywhere except the routes that already
 * mount an agent widget of their own. Without this guard two floating
 * launchers would overlap in the bottom-right corner.
 */
export function LegacyChatbotSlot() {
  const pathname = usePathname();

  if (pathname?.startsWith('/estudiantes/proyectos-guiados/')) {
    return null;
  }

  return <StudentChatbot isAlwaysVisible={true} />;
}

export default LegacyChatbotSlot;
