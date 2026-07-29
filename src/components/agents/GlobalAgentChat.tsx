'use client';

import { usePathname } from 'next/navigation';

import { AgentChatWidget } from './AgentChatWidget';

/** Guided project detail pages mount their own widget with project context. */
const GUIDED_PROJECT_DETAIL = /^\/estudiantes\/proyectos-guiados\/[^/]+$/;

/**
 * Mounts the agent chat launcher on every route. Routes that can supply richer
 * context render their own <AgentChatWidget> instead, so this one steps aside
 * to avoid two floating launchers in the same corner.
 */
export function GlobalAgentChat() {
  const pathname = usePathname();

  if (pathname && GUIDED_PROJECT_DETAIL.test(pathname)) {
    return null;
  }

  return <AgentChatWidget />;
}

export default GlobalAgentChat;
