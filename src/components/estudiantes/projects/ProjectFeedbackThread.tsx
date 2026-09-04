'use client';

import { useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { cn } from '~/lib/utils';
import { getUserRole } from '~/utils/roles';

import type { Roles } from '~/types/globals';

interface FeedbackAuthor {
  id: string;
  name: string;
  role: Roles;
}

interface FeedbackReply {
  id: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: FeedbackAuthor;
}

interface FeedbackThread extends FeedbackReply {
  replies: FeedbackReply[];
}

interface FeedbackResponse {
  items: FeedbackThread[];
}

// Solo estos roles pueden ver el composer de un hilo nuevo — refleja
// ROOT_FEEDBACK_ROLES del endpoint (`educador`, `super-admin`; `admin` queda
// fuera a propósito). Este chequeo por rol SÍ es confiable en el cliente
// porque no depende del contexto del proyecto (dueño/colaborador), a
// diferencia del permiso de respuesta.
const ROOT_COMPOSER_ROLES: readonly Roles[] = ['educador', 'super-admin'];

const ROLE_LABELS: Record<Roles, string> = {
  estudiante: 'Estudiante',
  educador: 'Educador',
  admin: 'Admin',
  'super-admin': 'Super Admin',
};

const ROLE_BADGE_STYLES: Record<Roles, string> = {
  estudiante: 'border-border/50 bg-secondary/40 text-muted-foreground',
  educador: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  admin: 'border-blue-500/30 bg-blue-500/15 text-blue-300',
  'super-admin': 'border-purple-500/30 bg-purple-500/15 text-purple-300',
};

const getInitial = (value: string) =>
  value.trim().charAt(0).toUpperCase() || 'U';

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recién';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'justo ahora';
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} d`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `hace ${diffMonths} meses`;
  const diffYears = Math.floor(diffMonths / 12);
  return `hace ${diffYears} años`;
};

const extractErrorMessage = (payload: unknown, fallback: string) => {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof (payload as { error?: unknown }).error === 'string'
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
};

const fetcher = async (url: string): Promise<FeedbackResponse> => {
  const res = await fetch(url);
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      extractErrorMessage(data, 'No se pudo cargar la retroalimentación')
    );
  }
  return data as FeedbackResponse;
};

function RoleBadge({ role }: { role: Roles }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        ROLE_BADGE_STYLES[role]
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

interface ProjectFeedbackThreadProps {
  projectId: number;
}

export default function ProjectFeedbackThread({
  projectId,
}: ProjectFeedbackThreadProps) {
  const { user, isSignedIn } = useUser();
  const viewerRole = getUserRole(user?.publicMetadata?.role);
  const canStartThread = Boolean(
    viewerRole && ROOT_COMPOSER_ROLES.includes(viewerRole)
  );
  // El cliente no puede saber con certeza si el usuario es colaborador del
  // proyecto (esa relación no viaja en la respuesta de GET), así que el
  // control de "Responder" se muestra de forma optimista a cualquier
  // usuario autenticado; el servidor sigue siendo la única autoridad y
  // rechaza con 403 (mensaje que se muestra vía toast) cuando no corresponde.
  const canAttemptReply = Boolean(isSignedIn);

  const feedbackUrl = `/api/projects/${projectId}/feedback`;
  const { data, isLoading, mutate } = useSWR<FeedbackResponse>(
    feedbackUrl,
    fetcher
  );
  const threads = data?.items ?? [];

  const [rootContent, setRootContent] = useState('');
  const [isSubmittingRoot, setIsSubmittingRoot] = useState(false);

  const [openReplyId, setOpenReplyId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const postFeedback = async (content: string, parentId?: number) => {
    const res = await fetch(feedbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        parentId === undefined ? { content } : { content, parentId }
      ),
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        extractErrorMessage(body, 'No se pudo enviar la retroalimentación')
      );
    }
  };

  const handleSubmitRoot = async () => {
    const content = rootContent.trim();
    if (!content || isSubmittingRoot) return;
    setIsSubmittingRoot(true);
    try {
      await postFeedback(content);
      setRootContent('');
      await mutate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar la retroalimentación'
      );
    } finally {
      setIsSubmittingRoot(false);
    }
  };

  const toggleReply = (rootId: number) => {
    setOpenReplyId((current) => (current === rootId ? null : rootId));
    setReplyContent('');
  };

  const handleSubmitReply = async (rootId: number) => {
    const content = replyContent.trim();
    if (!content || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      await postFeedback(content, rootId);
      setReplyContent('');
      setOpenReplyId(null);
      await mutate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar la respuesta'
      );
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-4">
      {canStartThread && (
        <div
          className="
            overflow-hidden rounded-2xl border border-border/60
            bg-gradient-to-br from-card/80 to-card/40 shadow-sm
          "
        >
          <div
            className="
              flex items-center gap-3 border-b border-border/50 px-4 py-3
              sm:px-5
            "
          >
            <div
              className="
                flex size-9 shrink-0 items-center justify-center rounded-xl
                bg-primary/15 text-primary
              "
            >
              <MessageSquare className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Iniciar retroalimentación
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Comparte una observación con el equipo del proyecto
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-4 sm:p-5">
            <div
              className="
                hidden size-9 shrink-0 items-center justify-center rounded-full
                bg-primary/20 text-xs font-bold text-primary ring-1
                ring-border/30
                sm:flex
              "
            >
              {getInitial(user?.fullName ?? user?.firstName ?? 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <label htmlFor="project-feedback-new-thread" className="sr-only">
                Iniciar retroalimentación
              </label>
              <textarea
                id="project-feedback-new-thread"
                value={rootContent}
                onChange={(event) => setRootContent(event.target.value)}
                placeholder="Escribe una observación para el equipo del proyecto..."
                rows={3}
                className="
                  min-h-[92px] w-full resize-none rounded-xl border
                  border-border/50 bg-background/40 p-3 text-sm text-foreground
                  transition-colors
                  placeholder:text-muted-foreground
                  focus:border-primary/40 focus:ring-2 focus:ring-primary/30
                  focus:outline-none
                "
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {rootContent.trim().length > 0
                    ? `${rootContent.trim().length} caracteres`
                    : 'Se notificará al equipo del proyecto'}
                </span>
                <button
                  type="button"
                  onClick={() => void handleSubmitRoot()}
                  disabled={!rootContent.trim() || isSubmittingRoot}
                  className="
                    inline-flex items-center gap-1.5 rounded-lg bg-primary px-4
                    py-2 text-sm font-semibold text-primary-foreground shadow-sm
                    transition-all
                    hover:bg-primary/90
                    focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none
                    active:scale-95
                    disabled:cursor-not-allowed disabled:opacity-50
                    disabled:active:scale-100
                  "
                >
                  <Send className="size-3.5" />
                  {isSubmittingRoot ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Cargando retroalimentación...
        </p>
      ) : threads.length === 0 ? (
        <div
          className="
            flex flex-col items-center gap-3 rounded-2xl border border-dashed
            border-border/60 bg-card/30 px-4 py-10 text-center
            sm:px-6
          "
        >
          <div
            className="
              flex size-12 items-center justify-center rounded-full
              bg-primary/10 text-primary
            "
          >
            <MessageSquare className="size-6" />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            {canStartThread
              ? 'Aún no hay retroalimentación. Inicia el primer hilo para este proyecto.'
              : 'Aún no hay retroalimentación disponible.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => {
            const replyRegionId = `project-feedback-reply-${thread.id}`;
            const isReplyOpen = openReplyId === thread.id;

            return (
              <div
                key={thread.id}
                className="
                  rounded-2xl border border-border/50 bg-card/50 p-4
                  transition-colors
                  hover:border-border
                  sm:p-5
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex size-9 shrink-0 items-center justify-center
                      rounded-full bg-primary/20 text-xs font-bold
                      text-primary ring-1 ring-border/30
                    "
                  >
                    {getInitial(thread.author.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {thread.author.name}
                      </span>
                      <RoleBadge role={thread.author.role} />
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(thread.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-foreground/90">
                      {thread.content}
                    </p>

                    {canAttemptReply && (
                      <button
                        type="button"
                        onClick={() => toggleReply(thread.id)}
                        aria-expanded={isReplyOpen}
                        aria-controls={replyRegionId}
                        className="
                          mt-2 inline-flex items-center gap-1 text-[11px]
                          font-semibold text-muted-foreground
                          transition-colors
                          hover:text-primary
                          focus-visible:ring-2 focus-visible:ring-ring
                          focus-visible:ring-offset-2 focus-visible:outline-none
                        "
                      >
                        <MessageSquare className="size-3" />
                        Responder
                      </button>
                    )}

                    {thread.replies.length > 0 && (
                      <div className="mt-3 space-y-3 border-l-2 border-border/40 pl-4">
                        {thread.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex items-start gap-2.5"
                          >
                            <div
                              className="
                                flex size-7 shrink-0 items-center justify-center
                                rounded-full bg-secondary/60 text-[11px]
                                font-bold text-foreground ring-1 ring-border/30
                              "
                            >
                              {getInitial(reply.author.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">
                                  {reply.author.name}
                                </span>
                                <RoleBadge role={reply.author.role} />
                                <span className="text-[10px] text-muted-foreground">
                                  {formatRelativeTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs whitespace-pre-wrap text-foreground/85">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isReplyOpen && (
                      <div
                        id={replyRegionId}
                        role="region"
                        aria-label={`Responder a ${thread.author.name}`}
                        className="mt-3 space-y-2 border-l-2 border-border/40 pl-4"
                      >
                        <label
                          htmlFor={`${replyRegionId}-textarea`}
                          className="sr-only"
                        >
                          Respuesta para {thread.author.name}
                        </label>
                        <textarea
                          id={`${replyRegionId}-textarea`}
                          value={replyContent}
                          onChange={(event) =>
                            setReplyContent(event.target.value)
                          }
                          placeholder="Escribe tu respuesta..."
                          rows={2}
                          autoFocus
                          className="
                            min-h-[64px] w-full resize-none rounded-xl
                            bg-secondary/30 p-2.5 text-xs text-foreground
                            placeholder:text-muted-foreground
                            focus:ring-2 focus:ring-primary/50 focus:outline-none
                          "
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleReply(thread.id)}
                            disabled={isSubmittingReply}
                            className="
                              rounded-lg px-3 py-1.5 text-xs font-semibold
                              text-muted-foreground transition-colors
                              hover:bg-accent hover:text-black
                              focus-visible:ring-2 focus-visible:ring-ring
                              focus-visible:ring-offset-2 focus-visible:outline-none
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSubmitReply(thread.id)}
                            disabled={!replyContent.trim() || isSubmittingReply}
                            className="
                              inline-flex items-center gap-1.5 rounded-lg
                              bg-primary px-3 py-1.5 text-xs font-semibold
                              text-primary-foreground transition-colors
                              hover:bg-primary/90
                              focus-visible:ring-2 focus-visible:ring-ring
                              focus-visible:ring-offset-2 focus-visible:outline-none
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                          >
                            <Send className="size-3" />
                            {isSubmittingReply ? 'Enviando...' : 'Enviar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
