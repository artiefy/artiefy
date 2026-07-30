'use client';

import { type CSSProperties, useMemo, useState } from 'react';

import {
  ArrowLeftRight,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  FolderKanban,
  History,
  type LucideIcon,
  Play,
  Rocket,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

/** Artiefy brand cyan. The floating launcher keeps it for every agent. */
const LAUNCHER_COLOR = '#22C4D3';

export type AgentId = 'artie' | 'tutor' | 'coach';

interface AgentDefinition {
  id: AgentId;
  name: string;
  badge: string;
  tagline: string;
  color: string;
  icon: LucideIcon;
  emptyState: string;
  chips: string[];
}

const AGENTS: Record<AgentId, AgentDefinition> = {
  artie: {
    id: 'artie',
    name: 'Artie',
    badge: 'Guía',
    tagline: 'Tu guía principal en Artiefy',
    color: 'rgb(34, 196, 211)',
    icon: Sparkles,
    emptyState:
      'Tu guía principal en Artiefy. Pregúntame sobre cursos, proyectos, planes o cómo moverte por la plataforma.',
    chips: ['Cursos', 'Proyectos', 'Planes', 'Hablar con un asesor'],
  },
  tutor: {
    id: 'tutor',
    name: 'Tutor',
    badge: 'Enseñanza',
    tagline: 'Tutor personalizado de habilidades',
    color: 'rgb(251, 189, 35)',
    icon: Brain,
    emptyState:
      'Busco dentro del material de todos los cursos de Artiefy para responderte con fuentes reales.',
    chips: ['¿Qué cursos hay de IA?', '¿Qué temas cubre?', 'Recomiéndame uno'],
  },
  coach: {
    id: 'coach',
    name: 'Coach',
    badge: 'Proyectos',
    tagline: 'Mentor para tus proyectos',
    color: 'rgb(50, 200, 180)',
    icon: Rocket,
    emptyState:
      'Mentor de tus proyectos guiados. Te acompaño paso a paso en la actividad que tengas activa.',
    chips: ['¿Por dónde empiezo?', 'Estoy trabado', '¿Qué sigue?'],
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

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AgentChatWidget({ project }: AgentChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agentId, setAgentId] = useState<AgentId>(project ? 'coach' : 'artie');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isTreeOpen, setIsTreeOpen] = useState(true);
  const [expandedObjectives, setExpandedObjectives] = useState<number[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const agent = AGENTS[agentId];
  const AgentIcon = agent.icon;

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
    if (!text || isSending) return;

    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: `${now.getTime()}-user`,
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
        error?: string;
      };
      const replyTime = new Date();

      setMessages((prev) => [
        ...prev,
        {
          id: `${replyTime.getTime()}-agent`,
          role: 'agent',
          agent: agentId,
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

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Abrir chat con Artie"
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-60 flex size-14 items-center justify-center rounded-full transition-transform hover:scale-105"
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
      className="fixed right-6 bottom-6 z-60 flex w-[440px] max-w-[calc(100vw-48px)] flex-col"
      style={{ height: 'min(70vh, 620px)', borderRadius: 20 }}
    >
      <div
        className="holo-glass relative flex h-full flex-col overflow-hidden rounded-[20px]"
        style={{
          boxShadow: `rgba(4, 6, 11, 0.6) 0px 8px 40px, ${agent.color} 0px 0px 1px`,
        }}
      >
        {/* Header */}
        <div
          className="relative border-b px-4 py-3"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.06)',
            background:
              'linear-gradient(135deg, rgba(34, 196, 211, 0.06), rgba(124, 59, 237, 0.03), transparent)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}14)`,
                }}
              >
                <AgentIcon className="size-5" style={{ color: agent.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {agent.name}
                  </h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${agent.color}1f`,
                      color: agent.color,
                    }}
                  >
                    {agent.badge}
                  </span>
                  <span className="size-2 animate-pulse rounded-full bg-green-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Guía de Artiefy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Historial de chats"
                className="rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
              >
                <History className="size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                aria-label="Cambiar agente"
                onClick={() => setIsSwitcherOpen((prev) => !prev)}
                className="rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
              >
                <ArrowLeftRight className="size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                aria-label="Cerrar chat"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Agent switcher */}
        {isSwitcherOpen && (
          <div className="holo-glass absolute top-16 right-4 left-4 z-[71] space-y-1 rounded-xl p-2">
            <p className="px-3 py-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Cambiar agente
            </p>
            {(Object.keys(AGENTS) as AgentId[]).map((id) => {
              const option = AGENTS[id];
              const OptionIcon = option.icon;
              const isCurrent = id === agentId;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setAgentId(id);
                    setIsSwitcherOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                    isCurrent ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${option.color}33, ${option.color}0d)`,
                    }}
                  >
                    <OptionIcon
                      className="size-4"
                      style={{ color: option.color }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {option.name}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${option.color}1f`,
                          color: option.color,
                        }}
                      >
                        {option.badge}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {option.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
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
                Chatea con {agent.name}
              </h4>
              <p className="mb-5 max-w-[260px] text-sm text-muted-foreground">
                {agent.emptyState}
              </p>
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

        {/* Composer */}
        <div
          className="space-y-2.5 border-t p-3"
          style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
        >
          <div className="scrollbar-minimal flex gap-2 overflow-x-auto px-1 pb-1">
            {agent.chips.map((chip) => (
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
              style={{ backgroundColor: agent.color, color: 'rgb(8, 12, 22)' }}
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentChatWidget;
