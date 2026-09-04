'use client';

import type { AgentProject } from '~/lib/agents/agentProject';

/**
 * What a conversation is about. It drives three things: the badge shown in the
 * chat history, the session thread the agents keep on the n8n side, and (once
 * the embeddings work lands) which documents the RAG step is allowed to read.
 */
export type AgentChatScope =
  | { kind: 'general' }
  | { kind: 'course'; id: number; title: string }
  | {
      kind: 'project';
      id: number;
      title: string;
      /**
       * Disambiguates the id when it collides between `guidedProjects` and
       * `projects` (independent serial sequences). Absent means "resolve as
       * a guided project first, like every conversation before this field
       * existed" — never a security boundary on its own, since the chat
       * route still re-checks enrollment/ownership server-side.
       */
      source?: 'guided' | 'user';
    };

export const GENERAL_SCOPE: AgentChatScope = { kind: 'general' };

export interface AgentChatOpenRequest {
  scope: AgentChatScope;
  /** Opening line, shown in place of the generic welcome menu. */
  greeting: string;
  /**
   * Objectives tree for callers that open the chat from a route which mounts
   * the widget without a project — the wizard's "Guardar Proyecto", above all.
   * It may start empty: the widget refreshes it from the project itself, so
   * objectives and activities appear as they are created.
   */
  project?: AgentProject;
}

const EVENT_NAME = 'artiefy:agent-chat-open';

/**
 * Asks the globally mounted chat widget to open a fresh conversation.
 *
 * A DOM event rather than a context provider: the widget is mounted once at the
 * app root by `GlobalAgentChat`, while the callers are scattered across
 * unrelated subtrees, and the widget can be portalled into a
 * picture-in-picture window where a React context would not reach it.
 */
export function openAgentChatFor(request: AgentChatOpenRequest): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AgentChatOpenRequest>(EVENT_NAME, { detail: request })
  );
}

/**
 * Opens the Coach on a project the learner has just saved from the wizard.
 *
 * The wizard deliberately stays open on its next step, so this is the whole
 * handoff: one new conversation named after the project, carrying its (still
 * empty) objectives tree so the widget can follow it as the remaining steps
 * fill it in.
 *
 * `source: 'user'` names the `projects` table, not the `type` column — a
 * project created inside a course is a row there too, so the course wizard and
 * the standalone "+ Nuevo proyecto" flow open the chat identically.
 */
export function openCoachChatForNewProject(project: {
  id: number;
  title?: string;
}): void {
  const title = project.title?.trim() ?? '';
  const name = title || 'tu proyecto';

  openAgentChatFor({
    scope: { kind: 'project', id: project.id, title: name, source: 'user' },
    greeting: `¡Listo! Soy tu Coach y te acompaño en "${name}". Aquí verás los objetivos y las actividades a medida que se vayan creando. ¿Seguimos armándolo juntos?`,
    project: { id: project.id, title: name, source: 'user', objectives: [] },
  });
}

/** Returns the unsubscribe function, ready to be a `useEffect` cleanup. */
export function subscribeToAgentChat(
  handler: (request: AgentChatOpenRequest) => void
): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<AgentChatOpenRequest>).detail);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

/** Badge shown next to a scoped conversation in the history list. */
export function scopeBadge(
  scope: AgentChatScope
): { label: string; color: string } | null {
  switch (scope.kind) {
    case 'project':
      return { label: 'Proyecto', color: '#32C8B4' };
    case 'course':
      return { label: 'Curso', color: '#FBBD23' };
    default:
      return null;
  }
}
