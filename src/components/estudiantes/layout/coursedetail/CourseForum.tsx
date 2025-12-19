'use client';

import { useMemo, useState } from 'react';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  Image as ImageIcon,
  MessagesSquare,
  Mic,
  Reply,
  Send,
  ThumbsUp,
  Video,
} from 'lucide-react';
import useSWR from 'swr';

import { cn } from '~/lib/utils';

type Forum = {
  id: number;
  title: string;
  description?: string;
  courseId: { id: number; title: string };
  userId: { id: string; name: string };
};

type Post = {
  id: number;
  userId: { id: string; name: string };
  content: string;
  createdAt: string;
  updatedAt: string;
};

type PostReply = {
  id: number;
  userId: { id: string; name: string };
  postId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CourseForumProps {
  courseId: number;
}

export function CourseForum({ courseId }: CourseForumProps) {
  const { isSignedIn } = useAuth();
  const { user: _user } = useUser();
  const [newPost, setNewPost] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReplying, setIsReplying] = useState<Record<number, boolean>>({});

  const { data: forum, isLoading: forumLoading } = useSWR<Forum | null>(
    isSignedIn
      ? `/api/estudiantes/forums/by-course?courseId=${courseId}`
      : null,
    fetcher
  );

  const {
    data: posts,
    isLoading: postsLoading,
    mutate: mutatePosts,
  } = useSWR<Post[]>(
    forum?.id ? `/api/estudiantes/forums/${forum.id}/posts` : null,
    fetcher
  );

  const postIds = useMemo(
    () => (posts ?? []).map((p) => p.id).join(','),
    [posts]
  );

  const { data: replies, mutate: mutateReplies } = useSWR<PostReply[]>(
    postIds ? `/api/forums/posts/postReplay?postIds=${postIds}` : null,
    fetcher
  );

  const handlePublish = async () => {
    if (!forum?.id || !newPost.trim()) return;
    setIsPublishing(true);
    try {
      await fetch(`/api/estudiantes/forums/${forum.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost }),
      });
      setNewPost('');
      await mutatePosts();
      await mutateReplies();
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReply = async (postId: number) => {
    const message = replyDrafts[postId]?.trim();
    if (!message) return;
    setIsReplying((prev) => ({ ...prev, [postId]: true }));
    try {
      await fetch('/api/forums/posts/postReplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, postId }),
      });
      setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
      setReplyingTo(null);
      await mutateReplies();
    } finally {
      setIsReplying((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const initials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  };

  if (!isSignedIn) {
    return (
      <div
        className="border-border/50 flex flex-col items-center gap-2 rounded-xl border p-6 text-center"
        style={{ backgroundColor: 'rgba(6, 28, 55)' }}
      >
        <h3 className="text-foreground text-lg font-semibold">
          Inicia sesión para participar
        </h3>
        <p className="text-sm text-[#94a3b8]">
          Este foro es exclusivo para estudiantes inscritos.
        </p>
      </div>
    );
  }

  if (forumLoading) {
    return (
      <div
        className="border-border/50 rounded-xl border p-4 text-sm text-[#94a3b8]"
        style={{ backgroundColor: 'rgba(6, 28, 55)' }}
      >
        Cargando foro...
      </div>
    );
  }

  if (!forum?.id) {
    return (
      <div
        className="border-border/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center"
        style={{ backgroundColor: 'rgba(6, 28, 55)' }}
      >
        <div className="bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full text-black">
          <MessagesSquare className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-100">
          No hay foro disponible
        </h3>
        <p className="text-sm text-slate-300">
          Este curso aún no tiene foro creado.
        </p>
      </div>
    );
  }

  const totalComments = (posts?.length ?? 0) + (replies?.length ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-xl font-semibold">
          Foro del curso
        </h3>
        <p className="mt-1 text-sm text-[#94a3b8]">
          {totalComments} comentarios · Comparte dudas y avances con tus
          compañeros
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#1d283a80] bg-[#061c3780] p-4 shadow-sm">
        <textarea
          className="text-foreground focus-visible:ring-primary focus-visible:ring-offset-background min-h-[90px] w-full resize-none rounded-[16px] border border-[#1d283a80] bg-[#01152d80] px-3 py-2 text-sm placeholder:text-[#94a3b8] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="Inicia una nueva discusión o comparte tu avance..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[#94a3b8]">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#22C4D3] hover:text-white"
              aria-label="Adjuntar imagen"
              disabled
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#22C4D3] hover:text-white"
              aria-label="Adjuntar video"
              disabled
            >
              <Video className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#22C4D3] hover:text-white"
              aria-label="Adjuntar audio"
              disabled
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!newPost.trim() || isPublishing}
            className={cn(
              'ring-offset-background focus-visible:ring-ring hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-[14px] bg-[#22C4D3] px-3 text-sm font-medium whitespace-nowrap text-[#080C16] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
              (!newPost.trim() || isPublishing) && 'opacity-60'
            )}
          >
            <Send className="h-4 w-4" />
            {isPublishing ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {postsLoading ? (
          <div className="text-sm text-[#94a3b8]">Cargando comentarios...</div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => {
            const postReplies =
              replies?.filter((r) => r.postId === post.id) ?? [];
            return (
              <div
                key={post.id}
                className="border-border/50 space-y-3 rounded-xl border p-4 shadow-sm"
                style={{ backgroundColor: 'rgba(6, 28, 55, 0.3)' }}
              >
                <div className="flex gap-3">
                  <span className="bg-accent/20 text-accent flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                    {initials(post.userId?.name)}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground font-semibold">
                        {post.userId?.name}
                      </span>
                      <span className="text-xs text-[#94a3b8]">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-foreground/90 text-sm whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 pt-1 text-xs text-[#94a3b8]">
                      <button
                        type="button"
                        className="flex items-center gap-1 transition hover:text-white"
                        disabled
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Me gusta
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1 transition hover:text-white"
                        onClick={() =>
                          setReplyingTo((prev) =>
                            prev === post.id ? null : post.id
                          )
                        }
                      >
                        <Reply className="h-4 w-4" />
                        Responder
                      </button>
                      <span className="ml-auto text-[#94a3b8]/80">
                        {postReplies.length} respuestas
                      </span>
                    </div>
                  </div>
                </div>

                {replyingTo === post.id && (
                  <div className="ml-12 space-y-2">
                    <textarea
                      className="border-border/50 text-foreground focus-visible:ring-primary focus-visible:ring-offset-background min-h-[70px] w-full resize-none rounded-md border px-3 py-2 text-sm placeholder:text-[#94a3b8] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      style={{ backgroundColor: 'rgba(6, 28, 55, 0.45)' }}
                      placeholder="Escribe una respuesta..."
                      value={replyDrafts[post.id] ?? ''}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleReply(post.id)}
                        disabled={
                          !replyDrafts[post.id]?.trim() || isReplying[post.id]
                        }
                        className={cn(
                          'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                          'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-primary focus-visible:ring-offset-background',
                          (!replyDrafts[post.id]?.trim() ||
                            isReplying[post.id]) &&
                            'opacity-60'
                        )}
                      >
                        <Send className="h-4 w-4" />
                        {isReplying[post.id] ? 'Respondiendo...' : 'Responder'}
                      </button>
                    </div>
                  </div>
                )}

                {postReplies.length > 0 && (
                  <div className="border-border/40 mt-3 space-y-4 border-l-2 pl-6">
                    {postReplies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <span className="bg-accent/20 text-accent flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
                          {initials(reply.userId?.name)}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground font-semibold">
                              {reply.userId?.name}
                            </span>
                            <span className="text-[11px] text-[#94a3b8]">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-foreground/90 text-sm whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div
            className="border-border/50 rounded-xl border border-dashed p-6 text-center text-sm text-slate-300"
            style={{ backgroundColor: 'rgba(6, 28, 55, 0.3)' }}
          >
            Aún no hay discusiones. ¡Sé el primero en comentar!
          </div>
        )}
      </div>
    </div>
  );
}
