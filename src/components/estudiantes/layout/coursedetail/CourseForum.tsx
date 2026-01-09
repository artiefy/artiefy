'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  Image as ImageIcon,
  Loader2,
  MessagesSquare,
  Mic,
  MoreHorizontal,
  Pencil,
  Reply,
  Send,
  ThumbsUp,
  Trash2,
  Video,
} from 'lucide-react';
import { FaUserGraduate, FaUserTie } from 'react-icons/fa6';
import { IoShieldCheckmark } from 'react-icons/io5';
import { MdOutlineForum } from 'react-icons/md';
import useSWR from 'swr';

import { cn } from '~/lib/utils';

import type { Roles } from '~/types/globals';

type Forum = {
  id: number;
  title: string;
  description?: string;
  courseId: { id: number; title: string };
  userId: { id: string; name: string; role?: string | null };
  createdAt?: string;
  updatedAt?: string;
};

type Post = {
  id: number;
  userId: { id: string; name: string; role?: string | null };
  content: string;
  imageKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PostReply = {
  id: number;
  userId: { id: string; name: string; role?: string | null };
  postId: number;
  content: string;
  imageKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch (err) {
    console.error('fetcher parse error', err);
    return null;
  }
};

interface CourseForumProps {
  courseId: number;
}

export function CourseForum({ courseId }: CourseForumProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [newPost, setNewPost] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReplying, setIsReplying] = useState<Record<number, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMenuPostId, setShowMenuPostId] = useState<number | null>(null);
  const [showMenuReplyId, setShowMenuReplyId] = useState<number | null>(null);
  const [savingPostId, setSavingPostId] = useState<number | null>(null);
  const [savingReplyId, setSavingReplyId] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [postLikes, setPostLikes] = useState<Record<number, number>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [replyImages, setReplyImages] = useState<Record<number, string | null>>(
    {}
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuPostId && !(event.target as Element).closest('.menu-post')) {
        setShowMenuPostId(null);
      }
      if (
        showMenuReplyId &&
        !(event.target as Element).closest('.menu-reply')
      ) {
        setShowMenuReplyId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuPostId, showMenuReplyId]);

  // Obtener el rol del usuario desde Clerk metadata
  const userRole = user?.publicMetadata?.role as Roles | undefined;

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

  // Hidratar likes y conteos desde servidor cuando cambian los posts
  useEffect(() => {
    const fetchLikes = async () => {
      if (!posts || posts.length === 0) return;
      const postIds = posts.map((p) => p.id).join(',');
      try {
        const res = await fetch(`/api/forums/posts/likes?postIds=${postIds}`);
        if (!res.ok) return;
        const data = await res.json();
        setPostLikes(data.counts ?? {});
        setLikedPosts(new Set(data.likedIds ?? []));
      } catch (err) {
        console.error('Error fetching likes', err);
      }
    };
    fetchLikes();
  }, [posts]);

  const postIds = useMemo(
    () => (posts ?? []).map((p) => p.id).join(','),
    [posts]
  );

  const { data: replies, mutate: mutateReplies } = useSWR<PostReply[]>(
    postIds ? `/api/forums/posts/postReplay?postIds=${postIds}` : null,
    fetcher
  );

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    forReply?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen válido.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (forReply) {
        setReplyImages((prev) => ({ ...prev, [forReply]: base64 }));
      } else {
        setSelectedImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (base64Image: string): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const res = await fetch('/api/forums/images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        console.error('Error al subir imagen');
        return null;
      }

      const data = await res.json();
      return data.imageKey;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublish = async () => {
    if (!forum?.id || !newPost.trim()) return;

    // Verificar si es la primera discusión del foro
    const isFirstPost = !posts || posts.length === 0;

    // Si es la primera discusión y el usuario es estudiante, bloquear
    if (isFirstPost && userRole === 'estudiante') {
      setErrorMessage(
        'Solo educadores, administradores y super-administradores pueden iniciar la discusión del foro.'
      );
      setTimeout(() => setErrorMessage(null), 5000); // Ocultar después de 5 segundos
      return;
    }

    setErrorMessage(null);
    setIsPublishing(true);
    try {
      let imageKey: string | null = null;
      if (selectedImage) {
        imageKey = await uploadImage(selectedImage);
      }

      await fetch(`/api/estudiantes/forums/${forum.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost, imageKey }),
      });
      setNewPost('');
      setSelectedImage(null);
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
      let imageKey: string | null = null;
      const replyImage = replyImages[postId];
      if (replyImage) {
        imageKey = await uploadImage(replyImage);
      }

      await fetch('/api/forums/posts/postReplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, postId, imageKey }),
      });
      setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
      setReplyImages((prev) => ({ ...prev, [postId]: null }));
      setReplyingTo(null);
      await mutatePosts();
      await mutateReplies();
    } finally {
      setIsReplying((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleEditPost = async (postId: number, newContent: string) => {
    if (!newContent.trim()) return;
    setSavingPostId(postId);
    try {
      const res = await fetch(
        `/api/estudiantes/forums/${forum?.id}/posts/${postId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent }),
        }
      );
      if (!res.ok) {
        console.error('Error editing post:', await res.text());
        return;
      }
      setEditingPostId(null);
      setEditContent('');
      await mutatePosts();
    } catch (error) {
      console.error('Error editing post:', error);
    } finally {
      setSavingPostId(null);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) return;
    try {
      const res = await fetch(
        `/api/estudiantes/forums/${forum?.id}/posts/${postId}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) {
        console.error('Error deleting post:', await res.text());
        return;
      }
      await mutatePosts();
      await mutateReplies();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditReply = async (replyId: number, newContent: string) => {
    if (!newContent.trim()) return;
    setSavingReplyId(replyId);
    try {
      const res = await fetch(`/api/forums/posts/postReplay/${replyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        console.error('Error editing reply:', await res.text());
        return;
      }
      setEditingReplyId(null);
      setEditContent('');
      await mutateReplies();
    } catch (error) {
      console.error('Error editing reply:', error);
    } finally {
      setSavingReplyId(null);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta respuesta?'))
      return;
    try {
      const res = await fetch(`/api/forums/posts/postReplay/${replyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.error('Error deleting reply:', await res.text());
        return;
      }
      await mutateReplies();
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      const res = await fetch('/api/forums/posts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        console.error('Error toggling like', await res.text());
        return;
      }
      const data = await res.json();
      // data: { action: 'liked'|'unliked', count: number }
      setPostLikes((prev) => ({ ...prev, [postId]: data.count }));
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (data.action === 'liked') next.add(postId);
        else next.delete(postId);
        return next;
      });
    } catch (err) {
      console.error('Error toggling like', err);
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

  const renderRoleBadge = (role?: string | null) => {
    // Si no hay rol, asumimos que es estudiante en este contexto
    const normalizedRole = role?.toLowerCase() ?? 'estudiante';

    const mapping: Record<
      string,
      { label: string; classes: string; icon: ReactNode }
    > = {
      estudiante: {
        label: 'Estudiante',
        classes: 'bg-blue-500/15 text-blue-400 border-blue-400/40',
        icon: <FaUserGraduate className="mr-1 h-3 w-3" />,
      },
      educador: {
        label: 'Educador',
        classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/40',
        icon: <FaUserTie className="mr-1 h-3 w-3" />,
      },
      admin: {
        label: 'Admin',
        classes: 'bg-purple-500/15 text-purple-400 border-purple-400/40',
        icon: <IoShieldCheckmark className="mr-1 h-3.5 w-3.5" />,
      },
      'super-admin': {
        label: 'Super-admin',
        classes: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-400/40',
        icon: <IoShieldCheckmark className="mr-1 h-3.5 w-3.5" />,
      },
    };

    const item = mapping[normalizedRole] ?? {
      label: normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1),
      classes: 'bg-slate-500/15 text-slate-300 border-slate-400/40',
      icon: <FaUserGraduate className="mr-1 h-3 w-3" />,
    };

    return (
      <div
        className={`focus:ring-ring inline-flex items-center rounded-full border px-2.5 font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${item.classes} py-0 text-xs`}
      >
        {item.icon}
        {item.label}
      </div>
    );
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

  // Mostrar un pseudo-post inicial construido desde la info del foro
  const initialDiscussion =
    forum && (!posts || posts.length === 0)
      ? {
          id: -forum.id, // id negativo para distinguirlo
          userId: forum.userId,
          content: forum.title || forum.description || '',
          createdAt: forum.createdAt ?? new Date().toISOString(),
          updatedAt: forum.updatedAt ?? new Date().toISOString(),
        }
      : null;

  const displayPosts: Post[] = initialDiscussion
    ? [initialDiscussion, ...(posts ?? [])]
    : (posts ?? []);

  const totalComments = displayPosts.length + (replies?.length ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-xl font-semibold">
          <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#22C4D3]/30 bg-[#22C4D3]/10 text-[#22C4D3]">
            <MdOutlineForum className="h-4 w-4" />
          </span>
          Foro del curso
        </h3>
        <p className="mt-1 text-sm text-[#94a3b8]">
          {totalComments} comentarios · Comparte dudas y avances con tus
          compañeros
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#1d283a80] bg-[#061c3780] p-4 shadow-sm">
        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <p className="font-medium">⚠️ {errorMessage}</p>
          </div>
        )}
        <textarea
          className="text-foreground focus-visible:ring-primary focus-visible:ring-offset-background min-h-[90px] w-full resize-none rounded-[16px] border border-[#1d283a80] bg-[#01152D80] px-3 py-2 text-sm placeholder:text-[#94a3b8] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="Inicia una nueva discusión o comparte tu avance..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        {selectedImage && (
          <div className="relative inline-block">
            <Image
              src={
                selectedImage.startsWith('data:')
                  ? selectedImage
                  : `data:image/jpeg;base64,${selectedImage}`
              }
              alt="Vista previa"
              width={80}
              height={80}
              className="h-20 w-20 rounded-lg border border-[#1d283a80] object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[#94a3b8]">
            <label
              htmlFor="forum-image-input"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-[#22C4D3] hover:text-white"
              aria-label="Adjuntar imagen"
            >
              <ImageIcon className="h-4 w-4" />
              <input
                id="forum-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageSelect(e)}
              />
            </label>
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
            disabled={!newPost.trim() || isPublishing || uploadingImage}
            className={cn(
              'ring-offset-background focus-visible:ring-ring hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-[14px] bg-[#22C4D3] px-3 text-sm font-medium whitespace-nowrap text-[#080C16] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
              (!newPost.trim() || isPublishing || uploadingImage) &&
                'opacity-60'
            )}
          >
            {uploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {uploadingImage
              ? 'Subiendo...'
              : isPublishing
                ? 'Publicando...'
                : 'Publicar'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {postsLoading ? (
          <div className="text-sm text-[#94a3b8]">Cargando comentarios...</div>
        ) : displayPosts && displayPosts.length > 0 ? (
          displayPosts.map((post) => {
            const postReplies =
              replies?.filter((r) => r.postId === post.id) ?? [];
            return (
              <div
                key={post.id}
                className="space-y-3 rounded-xl border border-[#1d283a80] bg-[#061c3780] p-4 shadow-sm"
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
                      {renderRoleBadge(post.userId?.role)}
                      <span className="text-xs text-[#94a3b8]">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <div>
                      {editingPostId === post.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="text-foreground/90 text-sm whitespace-pre-wrap w-full resize-none rounded-md border border-[#1d283a80] bg-[#01152D80] px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPostId(null);
                                setEditContent('');
                              }}
                              className="px-3 py-1 text-xs text-[#94a3b8] hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleEditPost(post.id, editContent)
                              }
                              disabled={savingPostId === post.id}
                              aria-busy={savingPostId === post.id}
                              className="px-3 py-1 text-xs bg-[#22C4D3] text-[#080C16] rounded-md hover:bg-[#22C4D3]/90 disabled:opacity-70 disabled:cursor-wait"
                            >
                              {savingPostId === post.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Guardar'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-foreground/90 text-sm whitespace-pre-wrap group">
                            {post.content}
                            {post.userId?.id === user?.id && (
                              <span className="relative inline-block ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowMenuPostId(
                                      showMenuPostId === post.id
                                        ? null
                                        : post.id
                                    )
                                  }
                                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1d283a80] text-[#94a3b8] hover:text-white"
                                  aria-label="Abrir menú"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                                {showMenuPostId === post.id && (
                                  <div
                                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-40 rounded-lg border border-[#1d283a80] shadow-lg z-10 menu-post"
                                    style={{
                                      backgroundColor: '#01152d',
                                      borderColor: 'hsla(217, 27%, 17%, 0.5)',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPostId(post.id);
                                        setEditContent(post.content);
                                        setShowMenuPostId(null);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#94a3b8] hover:bg-[#1d283a80] hover:text-white"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeletePost(post.id);
                                        setShowMenuPostId(null);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-[#1d283a80]"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </span>
                            )}
                          </div>
                          {post.imageKey && (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.imageKey}`}
                              alt="Imagen del post"
                              width={640}
                              height={360}
                              className="mt-2 max-w-md rounded-lg border border-[#1d283a80] h-auto w-full"
                              sizes="(max-width: 768px) 100vw, 640px"
                              unoptimized
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 pt-1 text-xs text-[#94a3b8]">
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        className={cn(
                          'flex items-center gap-1 transition',
                          likedPosts.has(post.id)
                            ? 'text-[#22C4D3] hover:text-[#22C4D3]'
                            : 'text-[#94a3b8] hover:text-white'
                        )}
                      >
                        <ThumbsUp
                          className={cn(
                            'h-4 w-4',
                            likedPosts.has(post.id) && 'fill-current'
                          )}
                        />
                        <span>Me gusta</span>
                        {(postLikes[post.id] ?? 0) > 0 && (
                          <span className="text-[11px] text-[#94a3b8]">
                            {postLikes[post.id]}
                          </span>
                        )}
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
                    {replyImages[post.id] && (
                      <div className="relative inline-block">
                        <Image
                          src={
                            replyImages[post.id]!.startsWith('data:')
                              ? replyImages[post.id]!
                              : `data:image/jpeg;base64,${replyImages[post.id]}`
                          }
                          alt="Vista previa"
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-lg border border-[#1d283a80] object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setReplyImages((prev) => ({
                              ...prev,
                              [post.id]: null,
                            }))
                          }
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor={`reply-image-input-${post.id}`}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-[#22C4D3] hover:text-white text-[#94a3b8]"
                        aria-label="Adjuntar imagen"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <input
                          id={`reply-image-input-${post.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageSelect(e, post.id)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleReply(post.id)}
                        disabled={
                          !replyDrafts[post.id]?.trim() ||
                          isReplying[post.id] ||
                          uploadingImage
                        }
                        className={cn(
                          'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                          'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-primary focus-visible:ring-offset-background',
                          (!replyDrafts[post.id]?.trim() ||
                            isReplying[post.id] ||
                            uploadingImage) &&
                            'opacity-60'
                        )}
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {uploadingImage
                          ? 'Subiendo...'
                          : isReplying[post.id]
                            ? 'Respondiendo...'
                            : 'Responder'}
                      </button>
                    </div>
                  </div>
                )}

                {postReplies.length > 0 && (
                  <div className="relative mt-3 space-y-4 pl-10">
                    <span className="pointer-events-none absolute left-4 top-0 h-full w-px bg-[#1f2a3d]" />
                    {postReplies.map((reply) => (
                      <div key={reply.id} className="flex gap-3 pl-1">
                        <span className="bg-accent/20 text-accent mt-1 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
                          {initials(reply.userId?.name)}
                        </span>
                        <div className="flex-1 space-y-1 border-l border-[#1f2a3d] pl-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground font-semibold">
                              {reply.userId?.name}
                            </span>
                            {renderRoleBadge(reply.userId?.role)}
                            <span className="text-[11px] text-[#94a3b8]">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <div>
                            {editingReplyId === reply.id ? (
                              <div className="space-y-2">
                                <textarea
                                  className="text-foreground/90 text-sm whitespace-pre-wrap w-full resize-none rounded-md border border-[#1d283a80] bg-[#01152D80] px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingReplyId(null);
                                      setEditContent('');
                                    }}
                                    className="px-3 py-1 text-xs text-[#94a3b8] hover:text-white"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditReply(reply.id, editContent)
                                    }
                                    disabled={savingReplyId === reply.id}
                                    aria-busy={savingReplyId === reply.id}
                                    className="px-3 py-1 text-xs bg-[#22C4D3] text-[#080C16] rounded-md hover:bg-[#22C4D3]/90 disabled:opacity-70 disabled:cursor-wait"
                                  >
                                    {savingReplyId === reply.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Guardar'
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-foreground/90 text-sm whitespace-pre-wrap group">
                                  {reply.content}
                                  {reply.userId?.id === user?.id && (
                                    <span className="relative inline-block ml-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowMenuReplyId(
                                            showMenuReplyId === reply.id
                                              ? null
                                              : reply.id
                                          )
                                        }
                                        className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1d283a80] text-[#94a3b8] hover:text-white"
                                        aria-label="Abrir menú"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                      {showMenuReplyId === reply.id && (
                                        <div
                                          className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-40 rounded-lg border border-[#1d283a80] shadow-lg z-10 menu-reply"
                                          style={{
                                            backgroundColor: '#01152d',
                                            borderColor:
                                              'hsla(217, 27%, 17%, 0.5)',
                                          }}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingReplyId(reply.id);
                                              setEditContent(reply.content);
                                              setShowMenuReplyId(null);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#94a3b8] hover:bg-[#1d283a80] hover:text-white"
                                          >
                                            <Pencil className="h-3 w-3" />
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDeleteReply(reply.id);
                                              setShowMenuReplyId(null);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-[#1d283a80]"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            Eliminar
                                          </button>
                                        </div>
                                      )}
                                    </span>
                                  )}
                                </div>
                                {reply.imageKey && (
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.imageKey}`}
                                    alt="Imagen de respuesta"
                                    width={480}
                                    height={270}
                                    className="mt-2 max-w-sm rounded-lg border border-[#1d283a80] h-auto w-full"
                                    sizes="(max-width: 768px) 100vw, 480px"
                                    unoptimized
                                  />
                                )}
                              </div>
                            )}
                          </div>
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
