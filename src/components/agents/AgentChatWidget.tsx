'use client';

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  AlignLeft,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  FolderKanban,
  type LucideIcon,
  Play,
  Plus,
  Rocket,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

/** Artiefy brand cyan. The floating launcher keeps it for every agent. */
const LAUNCHER_COLOR = '#22C4D3';

/** Below this width the panel behaves as a full-screen bottom sheet. */
const BOTTOM_SHEET_QUERY = '(max-width: 767px)';

/** Drag distance, in px, past which releasing the handle dismisses the sheet. */
const DISMISS_THRESHOLD = 120;

/** Single shared quick action shown above the composer for every agent. */
const QUICK_ACTIONS = ['Hablar con un asesor'];

/**
 * Opening menu. Each option is sent as a plain message: the orchestrator reads
 * the intent and hands the conversation to the right specialist on its own.
 */
const WELCOME_OPTIONS = [
  'Quiero aprender algo nuevo',
  'Quiero desarrollar y crear una nueva idea o proyecto',
  'Quiero conocer qué puedo hacer en Artiefy',
];

/** Chat history lives in the browser: the chat API stores no conversations. */
const HISTORY_STORAGE_KEY = 'artiefy.agent-chat.history';
const MAX_STORED_CONVERSATIONS = 20;

export type AgentId = 'artie' | 'tutor' | 'coach';

interface AgentDefinition {
  id: AgentId;
  name: string;
  badge: string;
  /** Hex, always 6 digits: alpha suffixes are appended to it (`${color}1f`). */
  color: string;
  icon: LucideIcon;
}

const AGENTS: Record<AgentId, AgentDefinition> = {
  artie: {
    id: 'artie',
    name: 'Artie',
    badge: 'Guía',
    color: LAUNCHER_COLOR,
    icon: Sparkles,
  },
  tutor: {
    id: 'tutor',
    name: 'Tutor',
    badge: 'Enseñanza',
    color: '#FBBD23',
    icon: Brain,
  },
  coach: {
    id: 'coach',
    name: 'Coach',
    badge: 'Proyectos',
    color: '#32C8B4',
    icon: Rocket,
  },
};

export interface AgentActivity {
  id: number;
  name: string;
  isCompleted: boolean;
}

export interface AgentObjective {
  id: number;
  title: string;
  activities?: AgentActivity[];
}

export interface AgentProject {
  id: number;
  title: string;
  objectives: AgentObjective[];
}

export interface AgentChatWidgetProps {
  /** Present only on guided project routes. Unlocks the Coach objectives tree. */
  project?: AgentProject;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  agent: AgentId;
  text: string;
  time: string;
}

type AgentQuotaTier = 'anon' | 'free' | 'premium';

interface AgentQuotaPayload {
  tier: AgentQuotaTier;
  limit: number;
  remaining: number;
  resetsDaily: boolean;
}

interface AgentQuotaNotice {
  title: string;
  body: string;
  primary: { label: string; href: string } | null;
  secondary: { label: string; href: string } | null;
}

/** Friendly, sales-forward copy shown when an allowance runs out. */
function buildQuotaNotice(quota: AgentQuotaPayload): AgentQuotaNotice {
  if (quota.tier === 'premium') {
    return {
      title: 'Llegaste a tus mensajes de hoy',
      body: `Tu plan incluye ${quota.limit} mensajes diarios con nuestros agentes. El cupo se renueva mañana y seguimos donde lo dejamos.`,
      primary: null,
      secondary: null,
    };
  }

  if (quota.tier === 'free') {
    return {
      title: 'Se te acabaron los mensajes de prueba',
      body: `Aprovechaste los ${quota.limit} mensajes de tu prueba gratis, y se nota que le estás sacando jugo. Con Premium tienes 50 mensajes al día con Artie, el Tutor y el Coach, más todos los cursos, para que nada te frene.`,
      primary: { label: 'Quiero Premium', href: '/planes' },
      secondary: null,
    };
  }

  return {
    title: 'Se te acabaron los mensajes gratis',
    body: `Ya usaste los ${quota.limit} mensajes de cortesía. Crea tu cuenta y estrena 10 días de Premium, o pásate a Premium y conversa hasta 50 veces al día con nuestros agentes.`,
    primary: { label: 'Quiero Premium', href: '/planes' },
    secondary: { label: 'Crear cuenta gratis', href: '/sign-up' },
  };
}

interface StoredConversation {
  id: string;
  agent: AgentId;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  });
}

export function AgentChatWidget({ project }: AgentChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agentId, setAgentId] = useState<AgentId>(project ? 'coach' : 'artie');
  const [isTreeOpen, setIsTreeOpen] = useState(true);
  const [expandedObjectives, setExpandedObjectives] = useState<number[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<StoredConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<AgentQuotaNotice | null>(null);
  const hasLoadedHistory = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  /** Pointer Y where the current handle drag started; null when not dragging. */
  const dragStartY = useRef<number | null>(null);

  const agent = AGENTS[agentId];
  const AgentIcon = agent.icon;

  /**
   * Entrance. On small screens the panel is an Apple-style bottom sheet: it
   * slides up over a fading backdrop. From `md` up it stays the corner popover
   * and only gets a short fade, so the desktop layout is untouched.
   */
  useGSAP(
    () => {
      if (!isOpen || !panelRef.current) return;

      const mm = gsap.matchMedia();

      mm.add(BOTTOM_SHEET_QUERY, () => {
        gsap
          .timeline()
          .fromTo(
            backdropRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.25, ease: 'power1.out' },
            0
          )
          .from(
            panelRef.current,
            { yPercent: 100, duration: 0.45, ease: 'power3.out' },
            0
          );
      });

      mm.add(`not all and ${BOTTOM_SHEET_QUERY}`, () => {
        gsap.from(panelRef.current, {
          autoAlpha: 0,
          y: 12,
          duration: 0.2,
          ease: 'power2.out',
        });
      });

      return () => {
        mm.revert();
        // The drag and exit tweens below are created after this hook runs, so
        // they live outside the context and need killing by hand.
        gsap.killTweensOf([panelRef.current, backdropRef.current]);
      };
    },
    { scope: rootRef, dependencies: [isOpen], revertOnUpdate: true }
  );

  /** Plays the exit animation first, then unmounts the panel. */
  const closePanel = () => {
    const panel = panelRef.current;

    if (!panel || !window.matchMedia(BOTTOM_SHEET_QUERY).matches) {
      setIsOpen(false);
      return;
    }

    gsap
      .timeline({ onComplete: () => setIsOpen(false) })
      .to(panel, { yPercent: 100, y: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(backdropRef.current, { autoAlpha: 0, duration: 0.3 }, 0);
  };

  // Drag the grab handle down to dismiss, the way a native sheet behaves.
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || !panelRef.current) return;
    // Only downward drags move the sheet; pulling up does nothing.
    gsap.set(panelRef.current, {
      y: Math.max(0, event.clientY - dragStartY.current),
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || !panelRef.current) return;

    const travelled = Math.max(0, event.clientY - dragStartY.current);
    dragStartY.current = null;

    if (travelled > DISMISS_THRESHOLD) {
      closePanel();
      return;
    }

    gsap.to(panelRef.current, { y: 0, duration: 0.25, ease: 'power2.out' });
  };

  // Restore the locally stored conversations once, on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredConversation[];
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      // Corrupt or unavailable storage: start with an empty history.
    }
  }, []);

  // Keep the open conversation mirrored into the history list. Only exchanges
  // that got an answer are stored, so a blocked message leaves nothing behind.
  useEffect(() => {
    if (!conversationId) return;
    if (!messages.some((message) => message.role === 'agent')) return;

    const firstUserMessage = messages.find(
      (message) => message.role === 'user'
    );
    const entry: StoredConversation = {
      id: conversationId,
      agent: agentId,
      title: firstUserMessage?.text.slice(0, 60) ?? 'Nueva conversación',
      updatedAt: Date.now(),
      messages,
    };

    setHistory((prev) =>
      [entry, ...prev.filter((item) => item.id !== conversationId)].slice(
        0,
        MAX_STORED_CONVERSATIONS
      )
    );
  }, [messages, conversationId, agentId]);

  // Persist on every change except the very first render, which would
  // overwrite stored history before the load effect above has run.
  useEffect(() => {
    if (!hasLoadedHistory.current) {
      hasLoadedHistory.current = true;
      return;
    }
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage full or blocked: history stays in memory for this session.
    }
  }, [history]);

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setDraft('');
    setIsHistoryOpen(false);
  };

  const openConversation = (conversation: StoredConversation) => {
    setAgentId(conversation.agent);
    setMessages(conversation.messages);
    setConversationId(conversation.id);
    setIsHistoryOpen(false);
  };

  const deleteConversation = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (conversationId === id) {
      setMessages([]);
      setConversationId(null);
    }
  };

  const { totalActivities, completedActivities, currentActivity } =
    useMemo(() => {
      let total = 0;
      let completed = 0;
      let current: {
        objective: AgentObjective;
        activity: AgentActivity;
      } | null = null;

      for (const objective of project?.objectives ?? []) {
        for (const activity of objective.activities ?? []) {
          total += 1;
          if (activity.isCompleted) {
            completed += 1;
          } else if (!current) {
            current = { objective, activity };
          }
        }
      }

      return {
        totalActivities: total,
        completedActivities: completed,
        currentActivity: current,
      };
    }, [project]);

  // The active activity is the selected one, falling back to the first
  // uncompleted activity in objective order.
  const activeActivityId =
    selectedActivityId ?? currentActivity?.activity.id ?? null;

  const progressPercent =
    totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

  const showTree = Boolean(project) && agentId === 'coach';

  const toggleObjective = (objectiveId: number) => {
    setExpandedObjectives((prev) =>
      prev.includes(objectiveId)
        ? prev.filter((id) => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const isObjectiveExpanded = (objective: AgentObjective) =>
    expandedObjectives.includes(objective.id) ||
    (expandedObjectives.length === 0 &&
      objective.id === currentActivity?.objective.id);

  const sendMessage = async (text: string) => {
    if (!text || isSending || quotaNotice) return;

    const now = new Date();
    const userMessageId = `${now.getTime()}-user`;

    if (!conversationId) {
      setConversationId(`conv-${now.getTime()}`);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        agent: agentId,
        text,
        time: formatTime(now),
      },
    ]);
    setDraft('');
    setIsSending(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agent: agentId,
          projectId: project?.id,
          activityId: activeActivityId,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        agent?: AgentId;
        error?: string;
        quota?: AgentQuotaPayload;
      };

      // Allowance exhausted: drop the optimistic message — it never reached
      // the agent — and show the upgrade notice instead of a reply.
      if (response.status === 429 && data.quota) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== userMessageId)
        );
        setDraft(text);
        setQuotaNotice(buildQuotaNotice(data.quota));
        return;
      }

      const replyTime = new Date();
      // The orchestrator decides who answers, so the badge follows the reply
      // instead of whatever the previous turn happened to be.
      const answeringAgent =
        data.agent && AGENTS[data.agent] ? data.agent : agentId;
      setAgentId(answeringAgent);

      setMessages((prev) => [
        ...prev,
        {
          id: `${replyTime.getTime()}-agent`,
          role: 'agent',
          agent: answeringAgent,
          text:
            data.reply ??
            data.error ??
            'No pude responder en este momento. Intenta de nuevo.',
          time: formatTime(replyTime),
        },
      ]);
    } catch {
      const errorTime = new Date();
      setMessages((prev) => [
        ...prev,
        {
          id: `${errorTime.getTime()}-agent`,
          role: 'agent',
          agent: agentId,
          text: 'No pudimos contactar al asistente. Revisa tu conexión e intenta de nuevo.',
          time: formatTime(errorTime),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // `js-floating-launcher` lets globals.css lift the launcher above the fixed
  // mobile bottom nav on small screens.
  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Abrir chat con Artie"
        onClick={() => setIsOpen(true)}
        className="js-floating-launcher fixed right-6 bottom-6 z-60 flex size-14 items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${LAUNCHER_COLOR}, rgba(34, 196, 211, 0.65))`,
          boxShadow: '0 4px 24px rgba(34, 196, 211, 0.35)',
        }}
      >
        <Brain className="size-6" style={{ color: 'rgb(8, 12, 22)' }} />
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      className="
        js-agent-chat-panel fixed inset-0 z-60
        md:inset-auto md:right-6 md:bottom-6 md:h-[min(70dvh,620px)]
        md:w-[440px] md:max-w-[calc(100vw-48px)]
      "
    >
      {/* Sheet backdrop. Tapping it dismisses, like a native bottom sheet. */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        onClick={closePanel}
        className="absolute inset-0 bg-black/60 md:hidden"
      />

      <div
        ref={panelRef}
        className="
          holo-glass absolute inset-0 flex flex-col overflow-hidden rounded-none
          md:relative md:inset-auto md:h-full md:rounded-[20px]
        "
        style={{
          boxShadow: `rgba(4, 6, 11, 0.6) 0px 8px 40px, ${agent.color} 0px 0px 1px`,
        }}
      >
        {/* Grab handle: drag it down to dismiss. Bottom-sheet sizes only. */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex shrink-0 touch-none justify-center py-2.5 md:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-white/25" />
        </div>

        {/* Header */}
        <div
          className="relative border-b px-4 py-3"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.06)',
            background:
              'linear-gradient(135deg, rgba(34, 196, 211, 0.06), rgba(124, 59, 237, 0.03), transparent)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Historial de chats"
              aria-expanded={isHistoryOpen}
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="
                flex size-9 shrink-0 items-center justify-center rounded-full
                border transition-colors hover:bg-white/[0.08]
              "
              style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <AlignLeft className="size-4 text-muted-foreground" />
            </button>

            {/* Agent identity: avatar with a live dot, then name and role. */}
            <div className="relative shrink-0">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}14)`,
                  boxShadow: `inset 0 0 0 1px ${agent.color}33`,
                }}
              >
                <AgentIcon className="size-4" style={{ color: agent.color }} />
              </div>
              <span
                aria-hidden
                className="
                  absolute -right-0.5 -bottom-0.5 size-2.5 animate-pulse
                  rounded-full bg-green-500 ring-2 ring-black/40
                "
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col text-left">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-sm leading-tight font-semibold text-foreground">
                  {agent.name}
                </h3>
                <span
                  className="
                    shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-none
                    font-medium
                  "
                  style={{
                    backgroundColor: `${agent.color}1f`,
                    color: agent.color,
                  }}
                >
                  {agent.badge}
                </span>
              </div>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                Guía de Artiefy
              </p>
            </div>

            <button
              type="button"
              aria-label="Cerrar chat"
              onClick={closePanel}
              className="
                shrink-0 rounded-lg p-2 transition-colors
                hover:bg-white/[0.06]
              "
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Chat history */}
        {isHistoryOpen && (
          <div className="holo-glass absolute inset-0 z-[72] flex flex-col">
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <h3 className="text-sm font-semibold text-foreground">
                Historial de chats
              </h3>
              <button
                type="button"
                aria-label="Cerrar historial"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            <div className="scrollbar-minimal flex-1 overflow-y-auto p-3">
              {history.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Todavía no tienes conversaciones guardadas. Escríbele a un
                  agente y aparecerán aquí.
                </p>
              ) : (
                <ul className="space-y-1">
                  {history.map((conversation) => {
                    const conversationAgent = AGENTS[conversation.agent];
                    const ConversationIcon = conversationAgent.icon;

                    return (
                      <li
                        key={conversation.id}
                        className="flex items-center gap-1 rounded-xl px-1 transition-colors hover:bg-white/[0.04]"
                      >
                        <button
                          type="button"
                          onClick={() => openConversation(conversation)}
                          className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left"
                        >
                          <div
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: `${conversationAgent.color}26`,
                            }}
                          >
                            <ConversationIcon
                              className="size-4"
                              style={{ color: conversationAgent.color }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">
                              {conversation.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {conversationAgent.name} ·{' '}
                              {formatDay(conversation.updatedAt)}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${conversation.title}`}
                          onClick={() => deleteConversation(conversation.id)}
                          className="rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
                        >
                          <Trash2 className="size-3.5 text-muted-foreground" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Floating action: starting a new chat is the primary intent here. */}
            <button
              type="button"
              aria-label="Nueva conversación"
              onClick={startNewConversation}
              className="
                absolute right-4 bottom-4 flex size-12 items-center
                justify-center rounded-full transition-transform
                hover:scale-105 active:scale-95
              "
              style={{
                background: `linear-gradient(135deg, ${agent.color}, ${agent.color}bf)`,
                boxShadow: `0 10px 24px -8px ${agent.color}99`,
              }}
            >
              <Plus className="size-5 text-[#04121b]" />
            </button>
          </div>
        )}

        <div className="scrollbar-minimal flex flex-1 flex-col overflow-y-auto">
          {showTree && currentActivity && (
            <button
              type="button"
              onClick={() => setSelectedActivityId(currentActivity.activity.id)}
              className="mx-3 mt-3 mb-1 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
              style={{
                borderColor: `${agent.color}40`,
                background: `linear-gradient(135deg, ${agent.color}1f, ${agent.color}0a)`,
              }}
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${agent.color}33` }}
              >
                <Play
                  className="size-3.5 fill-current"
                  style={{ color: agent.color }}
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="max-w-[120px] truncate">
                    {currentActivity.objective.title}
                  </span>
                  <ChevronRight className="size-2.5 shrink-0" />
                </p>
                <p className="truncate text-xs font-semibold text-foreground">
                  {currentActivity.activity.name}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{ background: `${agent.color}26`, color: agent.color }}
              >
                En progreso
              </span>
            </button>
          )}

          {showTree && project && (
            <div className="pt-2">
              <div
                className="mx-3 mb-2 overflow-hidden rounded-xl border"
                style={{
                  borderColor: `${agent.color}26`,
                  background: `linear-gradient(135deg, ${agent.color}0d, ${agent.color}05)`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsTreeOpen((prev) => !prev)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${agent.color}26` }}
                  >
                    <FolderKanban
                      className="size-3.5"
                      style={{ color: agent.color }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Objetivos del Proyecto
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {completedActivities}/{totalActivities}
                      </span>
                    </div>
                    <div className="mt-1 h-1 w-full rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          background: agent.color,
                        }}
                      />
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${
                      isTreeOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isTreeOpen && (
                  <div
                    className="space-y-1 border-t px-3 pb-3"
                    style={{ borderColor: `${agent.color}1a` }}
                  >
                    {project.objectives.map((objective) => {
                      const activities = objective.activities ?? [];
                      const done = activities.filter(
                        (a) => a.isCompleted
                      ).length;
                      const expanded = isObjectiveExpanded(objective);

                      return (
                        <div key={objective.id} className="pt-1.5">
                          <button
                            type="button"
                            onClick={() => toggleObjective(objective.id)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                              expanded
                                ? 'bg-white/[0.06]'
                                : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <Target
                              className="size-3.5 shrink-0"
                              style={{ color: agent.color }}
                            />
                            <span className="flex-1 truncate text-left text-[11px] font-medium text-foreground/90">
                              {objective.title}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {done}/{activities.length}
                            </span>
                            <ChevronDown
                              className={`size-3 text-muted-foreground transition-transform duration-200 ${
                                expanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {expanded && (
                            <div
                              className="ml-4 space-y-0.5 border-l py-1 pl-2.5"
                              style={{ borderColor: `${agent.color}26` }}
                            >
                              {activities.map((activity) => {
                                const isActive =
                                  activity.id === activeActivityId;

                                return (
                                  <button
                                    key={activity.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedActivityId(activity.id)
                                    }
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
                                    style={
                                      isActive && !activity.isCompleted
                                        ? {
                                            background: `${agent.color}1a`,
                                            boxShadow: `${agent.color}33 0px 0px 0px 1px inset`,
                                          }
                                        : undefined
                                    }
                                  >
                                    {activity.isCompleted ? (
                                      <CircleCheck className="size-3.5 text-green-400" />
                                    ) : (
                                      <Play
                                        className="size-3.5 fill-current"
                                        style={{ color: agent.color }}
                                      />
                                    )}
                                    <span
                                      className={`flex-1 truncate text-left text-[11px] ${
                                        activity.isCompleted
                                          ? 'text-muted-foreground line-through'
                                          : 'font-medium text-foreground'
                                      }`}
                                    >
                                      {activity.name}
                                    </span>
                                    {activity.isCompleted ? (
                                      <span className="text-[9px] text-green-400/70">
                                        Completada
                                      </span>
                                    ) : isActive ? (
                                      <span
                                        className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                                        style={{
                                          background: `${agent.color}26`,
                                          color: agent.color,
                                        }}
                                      >
                                        Activa
                                      </span>
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages / empty state */}
          {messages.length === 0 && !isSending ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div
                className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}33, ${agent.color}0d)`,
                }}
              >
                <AgentIcon className="size-8" style={{ color: agent.color }} />
              </div>
              <h4 className="mb-2 font-semibold text-foreground">
                ¡Hola! Qué gusto saludarte
              </h4>
              <p className="mb-5 max-w-[260px] text-sm text-muted-foreground">
                ¿En qué te ayudo hoy? Dime qué prefieres y yo te ayudo.
              </p>
              <div className="flex w-full max-w-[280px] flex-col gap-2">
                {WELCOME_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => void sendMessage(option)}
                    disabled={isSending}
                    className="rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{
                      borderColor: `${agent.color}33`,
                      color: agent.color,
                      backgroundColor: `${agent.color}14`,
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-3 p-4">
              {messages.map((message) => {
                const messageAgent = AGENTS[message.agent];
                const MessageIcon = messageAgent.icon;

                return message.role === 'user' ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-holo-surface2 px-4 py-2.5 text-foreground">
                      <p className="text-sm leading-relaxed text-foreground">
                        {message.text}
                      </p>
                      <span className="mt-1 block text-[10px] text-muted-foreground/60">
                        {message.time}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-start">
                    <div
                      className="holo-glass relative max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5"
                      style={{ borderColor: `${messageAgent.color}26` }}
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <MessageIcon
                          className="size-3"
                          style={{ color: messageAgent.color }}
                        />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: messageAgent.color }}
                        >
                          {messageAgent.name}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {message.text}
                      </p>
                      <span className="mt-1 block text-[10px] text-muted-foreground/60">
                        {message.time}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex justify-start">
                  <div
                    className="holo-glass rounded-2xl rounded-bl-sm px-4 py-3"
                    style={{ borderColor: `${agent.color}26` }}
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      <AgentIcon
                        className="size-3"
                        style={{ color: agent.color }}
                      />
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: agent.color }}
                      >
                        {agent.name}
                      </span>
                    </div>
                    <div
                      className="dots-container"
                      style={{ '--dot-color': agent.color } as CSSProperties}
                      aria-live="polite"
                      aria-label={`${agent.name} está escribiendo`}
                    >
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upgrade notice: replaces the composer once the allowance is spent */}
        {quotaNotice ? (
          <div className="p-3">
            <div
              className="rounded-2xl border p-4 text-center"
              style={{
                borderColor: `${LAUNCHER_COLOR}40`,
                background: `linear-gradient(135deg, ${LAUNCHER_COLOR}1f, ${LAUNCHER_COLOR}08)`,
              }}
            >
              <div
                className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl"
                style={{ background: `${LAUNCHER_COLOR}26` }}
              >
                <Sparkles
                  className="size-5"
                  style={{ color: LAUNCHER_COLOR }}
                />
              </div>
              <h4 className="mb-1.5 text-sm font-semibold text-foreground">
                {quotaNotice.title}
              </h4>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                {quotaNotice.body}
              </p>
              {quotaNotice.primary && (
                <Link
                  href={quotaNotice.primary.href}
                  className="
                    flex w-full items-center justify-center rounded-xl px-4
                    py-2.5 text-sm font-semibold transition-transform
                    hover:scale-[1.02]
                  "
                  style={{
                    backgroundColor: LAUNCHER_COLOR,
                    color: 'rgb(8, 12, 22)',
                  }}
                >
                  {quotaNotice.primary.label}
                </Link>
              )}
              {quotaNotice.secondary && (
                <Link
                  href={quotaNotice.secondary.href}
                  className="
                    mt-2.5 block text-xs font-medium text-muted-foreground
                    underline-offset-4 hover:underline
                  "
                >
                  {quotaNotice.secondary.label}
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Composer */
          <div className="space-y-2.5 p-3">
            <div className="scrollbar-minimal flex gap-2 overflow-x-auto px-1 pb-1">
              {QUICK_ACTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void sendMessage(chip)}
                  disabled={isSending}
                  className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.03] disabled:opacity-40"
                  style={{
                    borderColor: `${agent.color}33`,
                    color: agent.color,
                    backgroundColor: `${agent.color}14`,
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(draft.trim());
                  }
                }}
                placeholder={
                  isSending
                    ? `${agent.name} está pensando...`
                    : 'Escribe tu mensaje...'
                }
                aria-label="Mensaje de chat"
                className="flex-1 rounded-xl border bg-holo-surface2/60 px-4 py-2.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:outline-none"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
              />
              <button
                type="button"
                onClick={() => void sendMessage(draft.trim())}
                disabled={!draft.trim() || isSending}
                aria-label="Enviar mensaje"
                className="flex size-10 items-center justify-center rounded-xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor: agent.color,
                  color: 'rgb(8, 12, 22)',
                }}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentChatWidget;
