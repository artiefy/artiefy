'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';

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
  liked: boolean;
  saved: boolean;
}

export function ProjectFeedCard({ item }: ProjectFeedCardProps) {
  const [interactions, setInteractions] = useState<InteractionState>({
    likes: item.likes,
    comments: item.comments,
    saves: item.saves,
    liked: false,
    saved: false,
  });
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ProjectCommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const authorInitial = useMemo(
    () => item.author.name.charAt(0).toUpperCase(),
    [item.author.name]
  );

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const res = await fetch(
          `/api/projects/interactions?projectIds=${item.id}`
        );
        if (!res.ok) return;

        const data = (await res.json()) as {
          counts?: Record<
            number,
            { likes: number; comments: number; saves: number }
          >;
          likedIds?: number[];
          savedIds?: number[];
        };

        const counts = data.counts?.[item.id];
        setInteractions((prev) => ({
          likes: counts?.likes ?? prev.likes,
          comments: counts?.comments ?? prev.comments,
          saves: counts?.saves ?? prev.saves,
          liked: Boolean(data.likedIds?.includes(item.id)),
          saved: Boolean(data.savedIds?.includes(item.id)),
        }));
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

  const toggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && !hasLoadedComments && !isLoadingComments) {
      await fetchComments();
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
        absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5
        to-cyan-500/5 opacity-0 transition-opacity duration-500
        group-hover:opacity-100
      "
      />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="
            relative flex size-11 items-center justify-center rounded-full
            bg-gradient-to-br from-primary/25 to-cyan-500/30 font-semibold
            text-primary
          "
          >
            {authorInitial}
            <span
              className="
              absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border
              border-card bg-emerald-500
            "
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {item.author.name}
              </span>
              <span className="text-xs text-muted-foreground">publicó en</span>
              <span className="text-sm font-semibold text-primary">
                {item.title}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="
                inline-flex items-center gap-1 rounded-full border
                border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px]
                font-semibold text-primary
              "
              >
                <Sparkles className="size-3" />
                {item.stage}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeDate(item.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/proyectos/${item.id}`}
          className="
            inline-flex h-8 items-center rounded-lg border border-primary/30
            bg-primary/10 px-3 text-xs font-semibold text-primary
            transition-colors
            hover:bg-primary hover:text-primary-foreground
          "
        >
          Ver detalle
        </Link>
      </div>

      <p className="relative mb-4 text-sm leading-relaxed text-foreground">
        {item.description}
      </p>

      {item.coverImageUrl ? (
        <div
          className="
          relative mb-4 overflow-hidden rounded-xl border border-border/50
        "
        >
          <Image
            src={item.coverImageUrl}
            alt={`Portada de ${item.title}`}
            width={980}
            height={520}
            className="
              h-52 w-full object-cover transition-transform duration-500
              group-hover:scale-105
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
            border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px]
            font-semibold text-emerald-300
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
        pt-2
      "
      >
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLike}
            disabled={isLiking}
            className={`
              action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
              text-sm transition-colors
              ${
                interactions.liked
                  ? 'bg-rose-500/10 text-rose-400'
                  : `
                  text-muted-foreground
                  hover:bg-rose-500/10 hover:text-rose-400
                `
              }
            `}
          >
            <Heart className="size-4" />
            <span>{interactions.likes}</span>
          </button>
          <button
            onClick={toggleComments}
            className={`
              action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
              text-sm transition-colors
              ${
                showComments
                  ? 'bg-primary/10 text-primary'
                  : `
                  text-muted-foreground
                  hover:bg-primary/10 hover:text-primary
                `
              }
            `}
          >
            <MessageCircle className="size-4" />
            <span>{interactions.comments}</span>
          </button>
          <button
            onClick={toggleSave}
            disabled={isSaving}
            className={`
              action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
              text-sm transition-colors
              ${
                interactions.saved
                  ? 'bg-primary/10 text-primary'
                  : `
                  text-muted-foreground
                  hover:bg-primary/10 hover:text-primary
                `
              }
            `}
          >
            <Bookmark className="size-4" />
            <span>{interactions.saves}</span>
          </button>
        </div>
        <button
          className="
          rounded-xl p-2 text-muted-foreground transition-colors
          hover:bg-[#1A2333] hover:text-foreground
        "
        >
          <Share2 className="size-4" />
        </button>
      </div>

      {showComments ? (
        <div className="relative mt-3 border-t border-border/50 pt-3">
          <div className="flex items-center gap-2">
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
              placeholder="Escribe un comentario..."
              className={`
                w-full rounded-xl bg-[#1A2333] px-3 py-2 text-sm text-foreground
                placeholder:text-muted-foreground
                focus:ring-2 focus:ring-primary/40 focus:outline-none
              `}
            />
            <button
              onClick={() => void handleSubmitComment()}
              disabled={isSubmittingComment || newComment.trim().length === 0}
              className={`
                rounded-xl bg-primary px-3 py-2 text-xs font-semibold
                text-[#080c16] transition-colors
                hover:bg-primary/90
                disabled:opacity-50
              `}
            >
              Enviar
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {isLoadingComments ? (
              <p className="text-xs text-muted-foreground">
                Cargando comentarios...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aún no hay comentarios. Sé el primero en comentar.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="
                    rounded-xl border border-border/50 bg-[#1A2333]/35 p-3
                  "
                >
                  <div className="mb-1 flex items-center gap-2">
                    {comment.user.avatarUrl ? (
                      <Image
                        src={comment.user.avatarUrl}
                        alt={comment.user.name}
                        width={24}
                        height={24}
                        className="size-6 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="
                        flex size-6 items-center justify-center rounded-full
                        bg-primary/20 text-[10px] font-semibold text-primary
                      "
                      >
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-foreground">
                      {comment.user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}
