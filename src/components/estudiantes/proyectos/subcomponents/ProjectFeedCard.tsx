'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import {
  Bookmark,
  Check,
  ChevronDown,
  Ellipsis,
  ExternalLink,
  Flame,
  Heart,
  MessageCircle,
  Send,
  Share2,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';

import type { ProjectSocialItem } from '../types';

const formatRelativeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recién publicado';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays < 30) return `hace ${diffDays} días`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `hace ${diffMonths} meses`;
  const diffYears = Math.floor(diffMonths / 12);
  return `hace ${diffYears} años`;
};

const getInitial = (value: string) =>
  value.trim().charAt(0).toUpperCase() || 'U';

interface ProjectFeedCardProps {
  item: ProjectSocialItem;
}

interface ProjectCommentItem {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface InteractionState {
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  shared: boolean;
  followed: boolean;
}

export function ProjectFeedCard({ item }: ProjectFeedCardProps) {
  const { user } = useUser();
  const [interactions, setInteractions] = useState<InteractionState>({
    likes: item.likes,
    comments: item.comments,
    saves: item.saves,
    shares: 0,
    liked: false,
    saved: false,
    shared: false,
    followed: false,
  });
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ProjectCommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const [interactionsRes, followRes] = await Promise.all([
          fetch(`/api/projects/interactions?projectIds=${item.id}`),
          fetch(`/api/projects/${item.id}/follows`),
        ]);

        if (interactionsRes.ok) {
          const data = (await interactionsRes.json()) as {
            counts?: Record<
              number,
              { likes: number; comments: number; saves: number; shares: number }
            >;
            likedIds?: number[];
            savedIds?: number[];
            sharedIds?: number[];
          };
          const counts = data.counts?.[item.id];
          setInteractions((prev) => ({
            ...prev,
            likes: counts?.likes ?? prev.likes,
            comments: counts?.comments ?? prev.comments,
            saves: counts?.saves ?? prev.saves,
            shares: counts?.shares ?? prev.shares,
            liked: Boolean(data.likedIds?.includes(item.id)),
            saved: Boolean(data.savedIds?.includes(item.id)),
            shared: Boolean(data.sharedIds?.includes(item.id)),
          }));
        }

        if (followRes.ok) {
          const data = (await followRes.json()) as { followed?: boolean };
          setInteractions((prev) => ({
            ...prev,
            followed: Boolean(data.followed),
          }));
        }
      } catch (error) {
        console.error('Error cargando interacciones del proyecto', error);
      }
    };

    void fetchInteractions();
  }, [item.id]);

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const res = await fetch(`/api/projects/${item.id}/comments`);
      if (!res.ok) return;

      const data = (await res.json()) as { comments?: ProjectCommentItem[] };
      const loadedComments = data.comments ?? [];
      setComments(loadedComments);
      setInteractions((prev) => ({
        ...prev,
        comments: loadedComments.length,
      }));
      setHasLoadedComments(true);
    } catch (error) {
      console.error('Error cargando comentarios', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const openComments = async () => {
    setIsCommentsOpen(true);
    if (!hasLoadedComments && !isLoadingComments) {
      await fetchComments();
    }
  };

  const toggleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      const res = await fetch(`/api/projects/${item.id}/likes`, {
        method: 'POST',
      });
      if (res.status === 401) {
        alert('Inicia sesión para dar me gusta');
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        action: 'liked' | 'unliked';
        count: number;
      };
      setInteractions((prev) => ({
        ...prev,
        liked: data.action === 'liked',
        likes: data.count,
      }));
    } catch (error) {
      console.error('Error alternando like', error);
    } finally {
      setIsLiking(false);
    }
  };

  const toggleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/projects/${item.id}/saves`, {
        method: 'POST',
      });
      if (res.status === 401) {
        alert('Inicia sesión para guardar proyectos');
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        action: 'saved' | 'unsaved';
        count: number;
      };
      setInteractions((prev) => ({
        ...prev,
        saved: data.action === 'saved',
        saves: data.count,
      }));
    } catch (error) {
      console.error('Error alternando guardado', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShare = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      const res = await fetch(`/api/projects/${item.id}/shares`, {
        method: 'POST',
      });
      if (res.status === 401) {
        alert('Inicia sesión para compartir proyectos');
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        action: 'shared' | 'unshared';
        count: number;
      };
      setInteractions((prev) => ({
        ...prev,
        shared: data.action === 'shared',
        shares: data.count,
      }));
    } catch (error) {
      console.error('Error alternando compartido', error);
    } finally {
      setIsSharing(false);
    }
  };

  const toggleFollow = async () => {
    if (isFollowing) return;
    try {
      setIsFollowing(true);
      const res = await fetch(`/api/projects/${item.id}/follows`, {
        method: 'POST',
      });
      if (res.status === 401) {
        alert('Inicia sesión para seguir proyectos');
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { followed: boolean };
      setInteractions((prev) => ({
        ...prev,
        followed: data.followed,
      }));
    } catch (error) {
      console.error('Error alternando seguimiento', error);
    } finally {
      setIsFollowing(false);
    }
  };

  const handleSubmitComment = async () => {
    if (isSubmittingComment) return;
    const content = newComment.trim();
    if (!content) return;

    try {
      setIsSubmittingComment(true);
      const res = await fetch(`/api/projects/${item.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.status === 401) {
        alert('Inicia sesión para comentar');
        return;
      }
      if (!res.ok) return;

      const data = (await res.json()) as { comment?: ProjectCommentItem };
      if (!data.comment) return;

      setComments((prev) => [data.comment as ProjectCommentItem, ...prev]);
      setInteractions((prev) => ({
        ...prev,
        comments: prev.comments + 1,
      }));
      setNewComment('');
      setHasLoadedComments(true);
    } catch (error) {
      console.error('Error enviando comentario', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <>
      <article
        className="
          feed-card group relative overflow-hidden rounded-2xl border
          border-border/50 bg-card/70 p-5 backdrop-blur-sm transition-all
          duration-300
          hover:border-primary/40 hover:shadow-[0_0_30px_hsl(185_72%_48%/0.22)]
        "
      >
        <div
          className="
            pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/0
            via-primary/5 to-cyan-500/5 opacity-0 transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />

        <div className="relative mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                relative flex size-11 shrink-0 items-center justify-center
                rounded-full bg-gradient-to-br from-primary/25 to-cyan-500/30
                font-semibold text-primary ring-2 ring-primary/20 transition-all
                duration-300
                group-hover:ring-primary/40
              "
            >
              {getInitial(item.author.name)}
              <span
                className="
                  absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border
                  border-card bg-emerald-500
                "
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">
                  {item.author.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  publicó en
                </span>
                <span
                  className="
                    bg-gradient-to-r from-primary to-cyan-400
                    bg-clip-text font-semibold text-transparent
                  "
                >
                  {item.title}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="
                    inline-flex items-center gap-1 rounded-full border
                    border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5
                    text-[10px] font-semibold text-emerald-300
                  "
                >
                  {item.stage === 'Idea' ? (
                    <Zap className="size-3" />
                  ) : (
                    <Flame className="size-3" />
                  )}
                  {item.stage === 'Idea' ? 'Actualización' : 'Hito'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(item.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void toggleFollow()}
              disabled={isFollowing}
              title={
                interactions.followed ? 'Dejar de seguir' : 'Seguir proyecto'
              }
              className={`
                rounded-lg p-2 transition-all
                ${
                  interactions.followed
                    ? 'bg-primary/15 text-primary'
                    : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }
              `}
            >
              {interactions.followed ? (
                <Check className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsActionsOpen((current) => !current)}
                className="
                  rounded-xl p-2 text-muted-foreground transition-all
                  hover:scale-105 hover:bg-secondary/80 hover:text-foreground
                "
                aria-expanded={isActionsOpen}
                aria-haspopup="menu"
              >
                <Ellipsis className="size-4" />
              </button>
              {isActionsOpen ? (
                <div
                  role="menu"
                  className="
                    absolute right-0 z-20 mt-2 w-40 rounded-xl border
                    border-border/60 bg-card p-1 shadow-xl shadow-black/30
                  "
                >
                  <Link
                    href={`/proyectos/${item.id}`}
                    role="menuitem"
                    className="
                      flex items-center gap-2 rounded-lg px-3 py-2 text-sm
                      text-foreground transition-colors
                      hover:bg-secondary/80
                    "
                    onClick={() => setIsActionsOpen(false)}
                  >
                    <ExternalLink className="size-4 text-primary" />
                    Ver detalle
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <p className="relative mb-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {item.description}
        </p>

        {item.coverImageUrl ? (
          <div
            className="
              group/media relative mb-4 overflow-hidden rounded-xl border
              border-border/50
            "
          >
            <Image
              src={item.coverImageUrl}
              alt={`Portada de ${item.title}`}
              width={980}
              height={520}
              className="
                h-48 w-full object-cover transition-transform duration-500
                group-hover/media:scale-105
                sm:h-64
              "
            />
            <div
              className="
                absolute inset-0 bg-gradient-to-t from-black/30 to-transparent
                opacity-0 transition-opacity duration-300
                group-hover/media:opacity-100
              "
            />
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          <span
            className="
              rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1
              text-[11px] font-semibold text-blue-300
            "
          >
            {item.stage}
          </span>
          <span className="chip text-[11px]">{item.category.name}</span>
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={`${item.id}-${tag}`}
              className="chip text-[11px] text-foreground"
            >
              {tag}
            </span>
          ))}
          {item.needsCollaborators ? (
            <span
              className="
                inline-flex items-center gap-1 rounded-full border
                border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1
                text-[11px] font-semibold text-emerald-300
              "
            >
              <Users className="size-3" />
              Busca colaboradores
            </span>
          ) : null}
        </div>

        <div
          className="
            relative flex items-center justify-between border-t border-border/50
            pt-3
          "
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void toggleLike()}
              disabled={isLiking}
              className={`
                action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
                text-sm font-medium transition-all
                ${
                  interactions.liked
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400'
                }
              `}
            >
              <Heart className="size-5" />
              <span className="tabular-nums">{interactions.likes}</span>
            </button>
            <button
              type="button"
              onClick={() => void openComments()}
              className="
                action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
                text-sm font-medium text-muted-foreground transition-all
                hover:bg-primary/10 hover:text-primary
              "
            >
              <MessageCircle className="size-5" />
              <span className="tabular-nums">{interactions.comments}</span>
            </button>
            <button
              type="button"
              onClick={() => void toggleSave()}
              disabled={isSaving}
              className={`
                action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
                text-sm font-medium transition-all
                ${
                  interactions.saved
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }
              `}
            >
              <Bookmark className="size-5" />
              <span className="tabular-nums">{interactions.saves}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => void toggleShare()}
            disabled={isSharing}
            className="
              action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
              text-sm font-medium text-muted-foreground transition-all
              hover:bg-secondary hover:text-foreground
            "
          >
            <Share2 className="size-5" />
            <span className="tabular-nums">{interactions.shares}</span>
          </button>
        </div>
      </article>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent
          className="
            max-h-[85vh] max-w-[calc(100%-2rem)] gap-0 overflow-hidden border
            border-border/50 bg-card p-0 shadow-2xl
            sm:flex
            sm:max-w-4xl sm:flex-row
          "
        >
          <DialogTitle className="sr-only">Comentarios</DialogTitle>
          <DialogDescription className="sr-only">
            Comentarios del proyecto {item.title}
          </DialogDescription>

          {item.coverImageUrl ? (
            <div className="hidden w-1/2 shrink-0 items-center justify-center bg-black sm:flex">
              <Image
                src={item.coverImageUrl}
                alt={`Portada de ${item.title}`}
                width={900}
                height={900}
                className="size-full max-h-[85vh] object-cover"
              />
            </div>
          ) : null}

          <div
            className={`
              flex min-h-0 flex-1 flex-col
              ${item.coverImageUrl ? 'sm:w-1/2' : 'w-full'}
            `}
          >
            <div className="flex shrink-0 items-center border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                Comentarios
              </h3>
            </div>

            <div className="shrink-0 border-b border-border/50 bg-muted/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="
                    flex size-8 shrink-0 items-center justify-center rounded-full
                    bg-primary/20 text-xs font-bold text-primary ring-1
                    ring-primary/20
                  "
                >
                  {getInitial(item.author.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{item.author.name}</span>{' '}
                    <span className="line-clamp-2 text-xs text-foreground/80">
                      {item.description}
                    </span>
                  </p>
                </div>
              </div>
              {item.coverImageUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl sm:hidden">
                  <Image
                    src={item.coverImageUrl}
                    alt={`Portada de ${item.title}`}
                    width={800}
                    height={360}
                    className="max-h-52 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
              {isLoadingComments ? (
                <p className="text-sm text-muted-foreground">
                  Cargando comentarios...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay comentarios. Sé el primero en comentar.
                </p>
              ) : (
                comments.map((comment, index) => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.user.avatarUrl ? (
                      <Image
                        src={comment.user.avatarUrl}
                        alt={comment.user.name}
                        width={36}
                        height={36}
                        className="
                          size-9 shrink-0 rounded-full object-cover ring-1
                          ring-border/30
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex size-9 shrink-0 items-center justify-center
                          rounded-full bg-primary/20 text-xs font-bold
                          text-primary ring-1 ring-border/30
                        "
                      >
                        {getInitial(comment.user.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">
                            <span className="font-semibold">
                              {comment.user.name}
                            </span>{' '}
                            <span className="text-foreground/90">
                              {comment.content}
                            </span>
                          </p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeDate(comment.createdAt)}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {index + 1} Me gusta
                            </span>
                            <button
                              type="button"
                              className="
                                text-[11px] font-semibold text-muted-foreground
                                transition-colors
                                hover:text-foreground
                              "
                            >
                              Responder
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 p-1 text-muted-foreground hover:text-rose-400"
                        >
                          <Heart className="size-3.5" />
                        </button>
                      </div>
                      {index === 0 ? (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="
                              flex items-center gap-1.5 text-[11px]
                              font-semibold text-muted-foreground
                              transition-colors
                              hover:text-primary
                            "
                          >
                            <span className="h-px w-6 bg-muted-foreground/40" />
                            <ChevronDown className="size-3" />
                            Ver 1 respuesta
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 space-y-3 border-t border-border/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleLike()}
                  disabled={isLiking}
                  className={`
                    inline-flex items-center gap-1.5 rounded-xl px-3 py-2
                    text-sm font-medium transition-all
                    ${
                      interactions.liked
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400'
                    }
                  `}
                >
                  <Heart className="size-5" />
                  <span className="tabular-nums">{interactions.likes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void toggleSave()}
                  disabled={isSaving}
                  className={`
                    inline-flex items-center gap-1.5 rounded-xl px-3 py-2
                    text-sm font-medium transition-all
                    ${
                      interactions.saved
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }
                  `}
                >
                  <Bookmark className="size-5" />
                  <span className="tabular-nums">{interactions.saves}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void toggleShare()}
                  disabled={isSharing}
                  className={`
                    inline-flex items-center gap-1.5 rounded-xl px-3 py-2
                    text-sm font-medium transition-all
                    ${
                      interactions.shared
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }
                  `}
                >
                  <Share2 className="size-5" />
                  <span className="tabular-nums">{interactions.shares}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName ?? 'Usuario'}
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="
                      flex size-8 shrink-0 items-center justify-center
                      rounded-full bg-primary/20 text-xs font-bold text-primary
                    "
                  >
                    {getInitial(user?.fullName ?? user?.username ?? 'T')}
                  </div>
                )}
                <div
                  className="
                    flex flex-1 items-center rounded-full border
                    border-border/50 bg-muted/30 px-4 py-2
                  "
                >
                  <input
                    type="text"
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleSubmitComment();
                      }
                    }}
                    placeholder="Añade un comentario..."
                    className="
                      flex-1 bg-transparent text-sm text-foreground
                      placeholder:text-muted-foreground
                      focus:outline-none
                    "
                  />
                  <button
                    type="button"
                    onClick={() => void handleSubmitComment()}
                    disabled={
                      isSubmittingComment || newComment.trim().length === 0
                    }
                    className="
                      ml-2 text-muted-foreground transition-colors
                      hover:text-primary
                      disabled:text-muted-foreground/40
                    "
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
