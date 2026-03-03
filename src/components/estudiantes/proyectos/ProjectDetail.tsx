'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';

import type { ProjectSocialItem } from './types';

interface ProjectDetailProps {
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

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export function ProjectDetail({ item }: ProjectDetailProps) {
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
    <section className="relative min-h-screen overflow-hidden bg-background pb-16">
      <div className="pointer-events-none fixed inset-0">
        <div
          className="
            absolute top-10 left-1/4 size-72 rounded-full bg-primary/10
            blur-[120px]
          "
        />
        <div
          className="
            absolute right-1/4 bottom-1/4 size-72 rounded-full bg-cyan-500/10
            blur-[120px]
          "
        />
      </div>

      <div
        className="
          relative mx-auto max-w-4xl px-4 pt-16
          sm:px-6
        "
      >
        <Link
          href="/proyectos"
          className="
            inline-flex items-center gap-2 rounded-lg border border-border/50
            bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-colors
            hover:text-foreground
          "
        >
          <ArrowLeft className="size-4" />
          Volver a proyectos
        </Link>

        <article
          className="
            mt-6 overflow-hidden rounded-2xl border border-border/50 bg-card/70
          "
        >
          {item.coverImageUrl ? (
            <div className="relative h-72 border-b border-border/40">
              <Image
                src={item.coverImageUrl}
                alt={`Portada de ${item.title}`}
                width={1200}
                height={720}
                className="size-full object-cover"
              />
            </div>
          ) : null}

          <div
            className="
              space-y-6 p-6
              sm:p-8
            "
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1
                  className="
                    text-2xl font-bold text-foreground
                    sm:text-3xl
                  "
                >
                  {item.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Publicado por {item.author.name}
                </p>
              </div>
              <span
                className="
                  inline-flex items-center gap-1 rounded-full border
                  border-primary/30 bg-primary/15 px-3 py-1 text-xs
                  font-semibold text-primary
                "
              >
                <Sparkles className="size-3" />
                {item.stage}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="chip">{item.category.name}</span>
              {item.tags.map((tag) => (
                <span key={tag} className="chip text-foreground">
                  {tag}
                </span>
              ))}
              {item.needsCollaborators ? (
                <span
                  className="
                    inline-flex items-center gap-1 rounded-full border
                    border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs
                    font-semibold text-emerald-300
                  "
                >
                  <Users className="size-3" />
                  Busca colaboradores
                </span>
              ) : null}
            </div>

            <div className="rounded-xl border border-border/40 bg-[#1A2333]/20 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                {item.description}
              </p>
            </div>

            <div
              className="
                grid gap-3 text-sm
                sm:grid-cols-2
              "
            >
              <div
                className="
                  flex items-center gap-2 rounded-xl border border-border/40
                  bg-background/40 p-3
                "
              >
                <Calendar className="size-4 text-primary" />
                <span className="text-muted-foreground">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <div
                className="
                  flex items-center gap-2 rounded-xl border border-border/40
                  bg-background/40 p-3
                "
              >
                <Users className="size-4 text-primary" />
                <span className="text-muted-foreground">
                  Comunidad abierta de proyectos públicos
                </span>
              </div>
            </div>

            <div
              className="
                flex flex-wrap items-center gap-2 border-t border-border/50 pt-3
              "
            >
              <button
                onClick={toggleLike}
                disabled={isLiking}
                className={`
                  inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm
                  transition-colors
                  hover:bg-rose-500/10 hover:text-rose-400
                  ${
                    interactions.liked
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'text-muted-foreground'
                  }
                `}
              >
                <Heart className="size-4" />
                {interactions.likes}
              </button>
              <button
                onClick={toggleComments}
                className={`
                  inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm
                  transition-colors
                  hover:bg-primary/10 hover:text-primary
                  ${
                    showComments
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  }
                `}
              >
                <MessageCircle className="size-4" />
                {interactions.comments}
              </button>
              <button
                onClick={toggleSave}
                disabled={isSaving}
                className={`
                  inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm
                  transition-colors
                  hover:bg-primary/10 hover:text-primary
                  ${
                    interactions.saved
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  }
                `}
              >
                <Bookmark className="size-4" />
                {interactions.saves}
              </button>
              <button
                className="
                  inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm
                  text-muted-foreground transition-colors
                  hover:bg-[#1A2333] hover:text-foreground
                "
              >
                <Share2 className="size-4" />
                Compartir
              </button>
            </div>

            {showComments ? (
              <div className="border-t border-border/50 pt-3">
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
                      w-full rounded-xl bg-[#1A2333] px-3 py-2 text-sm
                      text-foreground
                      placeholder:text-muted-foreground
                      focus:ring-2 focus:ring-primary/40 focus:outline-none
                    `}
                  />
                  <button
                    onClick={() => void handleSubmitComment()}
                    disabled={
                      isSubmittingComment || newComment.trim().length === 0
                    }
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
                              flex size-6 items-center justify-center
                              rounded-full bg-primary/20 text-[10px]
                              font-semibold text-primary
                            "
                            >
                              {comment.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-foreground">
                            {comment.user.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
