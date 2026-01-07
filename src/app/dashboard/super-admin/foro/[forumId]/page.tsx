'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useParams } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import {
  CornerDownLeft,
  ImageIcon,
  Mic,
  MoreHorizontal,
  Send,
  ThumbsUp,
  Video,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/educators/ui/collapsible';
import { cn } from '~/lib/utils';

// Interfaces del foro
interface Foro {
  id: number;
  title: string;
  description: string;
  coverImageKey?: string;
  documentKey?: string;
  userId: {
    id: string;
    name: string;
    email: string;
  };
  courseId: {
    id: number;
    title: string;
    descripcion: string;
    instructor: string;
    coverImageKey?: string;
  };
}

// Interfaces de los posts
interface Post {
  id: number;
  userId: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  foroId: number;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de las respuestas a los posts
interface PostReplay {
  id: number;
  userId: {
    id: string;
    name: string;
    email: string;
  };
  postId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Función para formatear la fecha con hora
const formatDateTime = (dateString: string | number | Date) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Fecha inválida';

  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Obtener iniciales del nombre
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }
  return name.substring(0, 2).toUpperCase();
};

// Colores para avatares basados en el nombre
const getAvatarColor = (name: string) => {
  const colors = [
    'from-purple-500 to-purple-700',
    'from-blue-500 to-blue-700',
    'from-green-500 to-green-700',
    'from-yellow-500 to-yellow-700',
    'from-red-500 to-red-700',
    'from-pink-500 to-pink-700',
    'from-indigo-500 to-indigo-700',
    'from-teal-500 to-teal-700',
  ];
  const index = name.length % colors.length;
  return colors[index];
};

const ForumPage = () => {
  const params = useParams();
  const forumId = params?.forumId;
  const { user } = useUser();
  const [forumData, setForumData] = useState<Foro | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postReplays, setPostReplays] = useState<PostReplay[]>([]);
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState<string>('');
  const [editReplyContent, setEditReplyContent] = useState<string>('');
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ForumIdString = Array.isArray(forumId) ? forumId[0] : forumId;
  const ForumIdNumber = ForumIdString ? parseInt(ForumIdString) : null;

  // Toggle respuestas expandidas
  const toggleReplies = (postId: number) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Fetch del foro
  const fetchForum = useCallback(async () => {
    setLoading(true);
    try {
      const responseForum = await fetch(`/api/forums/${ForumIdNumber}`);
      if (responseForum.ok) {
        const data = (await responseForum.json()) as Foro;
        setForumData(data);
      } else {
        console.error('Error al traer el foro');
      }
    } catch (e) {
      console.error('Error al obtener el foro:', e);
    } finally {
      setLoading(false);
    }
  }, [ForumIdNumber]);

  // Fetch de los posts principales
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    //setError(true)
    try {
      const responsePosts = await fetch(
        `/api/forums/posts?foroId=${ForumIdNumber}`
      );
      if (responsePosts.ok) {
        const data = (await responsePosts.json()) as Post[];
        setPosts(data);
      } else {
        console.error('Error al traer los posts');
      }
    } catch (e) {
      console.error('Error al obtener los posts:', e);
    } finally {
      setLoadingPosts(false);
    }
  }, [ForumIdNumber]);

  // Fetch de las respuestas (PostReplies)
  const fetchPostReplays = useCallback(async () => {
    try {
      const postIds = posts.map((post) => post.id).join(',');
      if (postIds) {
        const responsePostReplays = await fetch(
          `/api/forums/posts/postReplay?postIds=${postIds}`
        );
        if (responsePostReplays.ok) {
          const data = (await responsePostReplays.json()) as PostReplay[];
          setPostReplays(data);
        } else {
          console.error('Error al traer las respuestas');
        }
      }
    } catch (e) {
      console.error('Error al obtener las respuestas:', e);
    }
  }, [posts]);

  // Fetch de los foro y las posts
  useEffect(() => {
    fetchPosts().catch((error) =>
      console.error('Error fetching posts:', error)
    );
    fetchForum().catch((error) =>
      console.error('Error fetching forum:', error)
    );
  }, [fetchPosts, fetchForum]);

  // Fetch de las respuestas después de obtener los posts
  useEffect(() => {
    if (posts.length > 0) {
      fetchPostReplays().catch((error) =>
        console.error('Error fetching post replies:', error)
      );
    }
  }, [fetchPostReplays, posts]);

  const handlePostSubmit = async () => {
    if (!message.trim() || !user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/forums/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          foroId: ForumIdNumber,
          userId: user.id,
          userName: user.fullName,
          userEmail: user.emailAddresses[0]?.emailAddress,
        }),
      });

      if (response.ok) {
        setMessage('');
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error al enviar el post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (
      !replyMessage.trim() ||
      !user ||
      replyingToPostId === null ||
      isSubmittingReply
    )
      return;
    setIsSubmittingReply(true);
    try {
      const response = await fetch('/api/forums/posts/postReplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyMessage,
          postId: replyingToPostId,
          userId: user.fullName,
        }),
      });

      if (response.ok) {
        setReplyMessage('');
        setReplyingToPostId(null);
        // Expandir automáticamente las respuestas del post
        if (replyingToPostId !== null) {
          setExpandedPosts((prev) => new Set(prev).add(replyingToPostId));
        }
        await fetchPostReplays();
      }
    } catch (error) {
      console.error('Error al enviar la respuesta:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Eliminar un post
  const handleDeletePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/forums/posts?postId=${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts(); // Refrescar lista de posts
      } else {
        console.error('Error al eliminar el post');
      }
    } catch (error) {
      console.error('Error al eliminar el post:', error);
    }
  };

  // Eliminar una respuesta
  const handleDeleteReply = async (replyId: number) => {
    try {
      const response = await fetch(
        `/api/forums/posts/postReplay?replyId=${replyId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        await fetchPostReplays(); // Refrescar respuestas
      } else {
        console.error('Error al eliminar la respuesta');
      }
    } catch (error) {
      console.error('Error al eliminar la respuesta:', error);
    }
  };

  // Actualizar Post
  const handlePostUpdate = async (postId: number) => {
    if (!editPostContent.trim()) return;
    try {
      const response = await fetch(`/api/forums/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editPostContent,
        }),
      });

      if (response.ok) {
        setEditingPostId(null);
        setEditPostContent('');
        await fetchPosts(); // Refrescar lista de posts
      } else {
        console.error('Error al actualizar el post');
      }
    } catch (error) {
      console.error('Error al actualizar el post:', error);
    }
  };

  // Actualizar Respuesta
  const handleReplyUpdate = async (replyId: number) => {
    if (!editReplyContent.trim()) return;
    try {
      const response = await fetch(`/api/forums/posts/postReplay/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editReplyContent,
        }),
      });

      if (response.ok) {
        setEditingReplyId(null);
        setEditReplyContent('');
        await fetchPostReplays(); // Refrescar respuestas
      } else {
        console.error('Error al actualizar la respuesta');
      }
    } catch (error) {
      console.error('Error al actualizar la respuesta:', error);
    }
  };

  // Contar respuestas de un post
  const getRepliesCount = (postId: number) => {
    return postReplays.filter((reply) => reply.postId === postId).length;
  };

  // Renderizar respuestas de un post
  const renderPostReplies = (postId: number) => {
    const replies = postReplays.filter((reply) => reply.postId === postId);
    const isExpanded = expandedPosts.has(postId);

    if (replies.length === 0) return null;

    return (
      <div className="mt-3 border-t border-gray-800 pt-3">
        {!isExpanded ? (
          <button
            onClick={() => toggleReplies(postId)}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            Ver {replies.length} respuesta{replies.length > 1 ? 's' : ''}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => toggleReplies(postId)}
              className="text-sm text-gray-400 hover:text-primary transition-colors"
            >
              Ocultar respuestas
            </button>
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="ml-6 flex gap-3 rounded-xl bg-gray-800/50 p-3"
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
                    getAvatarColor(reply.userId.name ?? '')
                  )}
                >
                  {getInitials(reply.userId.name ?? '')}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      {reply.userId.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(reply.createdAt)}
                    </span>
                  </div>

                  {editingReplyId === reply.id ? (
                    <div className="mt-2">
                      <textarea
                        className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2 text-sm text-white resize-none focus:border-primary focus:outline-none"
                        value={editReplyContent}
                        onChange={(e) => setEditReplyContent(e.target.value)}
                        rows={2}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-black hover:opacity-90"
                          onClick={() => handleReplyUpdate(reply.id)}
                        >
                          Guardar
                        </button>
                        <button
                          className="rounded-lg bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600"
                          onClick={() => setEditingReplyId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-300">
                      {reply.content}
                    </p>
                  )}
                </div>

                {/* Menú */}
                {reply.userId.id === user?.id && (
                  <Collapsible>
                    <CollapsibleTrigger className="rounded-full p-1 hover:bg-gray-700">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="absolute right-0 z-10 mt-1 flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
                      <button
                        className="px-4 py-2 text-left text-sm text-white hover:bg-gray-800"
                        onClick={() => {
                          setEditingReplyId(reply.id);
                          setEditReplyContent(reply.content);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800"
                        onClick={() => handleDeleteReply(reply.id)}
                      >
                        Eliminar
                      </button>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <span className="text-primary mt-4 text-sm">Cargando foro...</span>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-primary text-sm hover:text-gray-300"
                href="/"
              >
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-primary text-sm hover:text-gray-300"
                href="/dashboard/super-admin/foro"
              >
                Foros
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-sm text-gray-400">{forumData?.title}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto max-w-4xl p-6">
        {/* Contenedor principal con marco */}
        <div className="rounded-3xl border border-gray-700/50 bg-gradient-to-b from-gray-900/90 to-gray-950/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm ring-1 ring-white/5">
          {/* Header del Foro */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary">Foro del curso</h1>
            <p className="mt-1 text-sm text-gray-400">
              {posts.length} comentarios ·{' '}
              {forumData?.description ??
                'Comparte dudas y avances con tus compañeros'}
            </p>
          </div>

          {/* Archivos adjuntos del foro */}
          {(forumData?.coverImageKey ?? forumData?.documentKey) && (
            <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              {forumData?.coverImageKey && (
                <div className="max-w-xs">
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    Imagen adjunta
                  </p>
                  <Image
                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forumData.coverImageKey}`}
                    alt="Imagen adjunta"
                    width={200}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              {forumData?.documentKey && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    Documento adjunto
                  </p>
                  <a
                    href={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forumData.documentKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-primary hover:bg-gray-700"
                  >
                    📄 Ver documento
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Caja de nuevo mensaje */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/80">
            <textarea
              ref={textareaRef}
              className="min-h-[100px] w-full resize-none bg-transparent p-4 text-sm text-white placeholder:text-gray-500 focus:outline-none"
              placeholder="Inicia una nueva discusión o comparte tu avance..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handlePostSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
              <div className="flex gap-2">
                <button
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                  title="Adjuntar imagen"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                  title="Adjuntar video"
                >
                  <Video className="h-5 w-5" />
                </button>
                <button
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                  title="Grabar audio"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={handlePostSubmit}
                disabled={!message.trim() || isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Publicar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Lista de Posts */}
          <div className="space-y-4">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
                <p className="text-gray-400">
                  No hay comentarios aún. ¡Sé el primero en participar!
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const repliesCount = getRepliesCount(post.id);
                const userRole =
                  forumData?.userId.id === post.userId.id ? 'educador' : null;

                return (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-gray-700"
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white',
                          getAvatarColor(post.userId.name ?? '')
                        )}
                      >
                        {getInitials(post.userId.name ?? '')}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">
                            {post.userId.name}
                          </span>
                          {userRole && (
                            <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              ☆ {userRole}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDateTime(post.createdAt)}
                          </span>
                        </div>

                        {editingPostId === post.id ? (
                          <div className="mt-3">
                            <textarea
                              className="w-full rounded-xl border border-gray-700 bg-gray-800 p-3 text-sm text-white resize-none focus:border-primary focus:outline-none"
                              value={editPostContent}
                              onChange={(e) =>
                                setEditPostContent(e.target.value)
                              }
                              rows={3}
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handlePostUpdate(post.id)}
                                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-black hover:opacity-90"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingPostId(null)}
                                className="rounded-lg bg-gray-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-relaxed text-primary">
                            {post.content}
                          </p>
                        )}

                        {/* Acciones */}
                        <div className="mt-3 flex items-center gap-4">
                          <button className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white">
                            <ThumbsUp className="h-4 w-4" />
                            Me gusta
                          </button>
                          <button
                            onClick={() => {
                              setReplyingToPostId(
                                replyingToPostId === post.id ? null : post.id
                              );
                              setReplyMessage('');
                            }}
                            className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white"
                          >
                            <CornerDownLeft className="h-4 w-4" />
                            Responder
                          </button>
                          {repliesCount > 0 && (
                            <span className="ml-auto text-xs text-gray-500">
                              {repliesCount} respuesta
                              {repliesCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Formulario de respuesta */}
                        {replyingToPostId === post.id && (
                          <div className="mt-4 flex gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
                                getAvatarColor(user?.fullName ?? '')
                              )}
                            >
                              {getInitials(user?.fullName ?? '')}
                            </div>
                            <div className="flex-1">
                              <textarea
                                className="w-full rounded-xl border border-gray-700 bg-gray-800 p-3 text-sm text-white placeholder:text-gray-500 resize-none focus:border-primary focus:outline-none"
                                placeholder="Escribe tu respuesta..."
                                value={replyMessage}
                                onChange={(e) =>
                                  setReplyMessage(e.target.value)
                                }
                                rows={2}
                                autoFocus
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
                                  onClick={handleReplySubmit}
                                  disabled={
                                    !replyMessage.trim() || isSubmittingReply
                                  }
                                >
                                  {isSubmittingReply ? (
                                    <>
                                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                      Enviando...
                                    </>
                                  ) : (
                                    'Enviar'
                                  )}
                                </button>
                                <button
                                  className="rounded-lg bg-gray-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-600"
                                  onClick={() => setReplyingToPostId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Respuestas */}
                        {renderPostReplies(post.id)}
                      </div>

                      {/* Menú de opciones */}
                      {post.userId.id === user?.id && (
                        <Collapsible className="relative">
                          <CollapsibleTrigger className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white">
                            <MoreHorizontal className="h-5 w-5" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="absolute right-0 z-10 mt-1 flex flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-xl">
                            <button
                              className="px-4 py-2.5 text-left text-sm text-white hover:bg-gray-800"
                              onClick={() => {
                                setEditingPostId(post.id);
                                setEditPostContent(post.content);
                              }}
                            >
                              Editar
                            </button>
                            <button
                              className="px-4 py-2.5 text-left text-sm text-red-400 hover:bg-gray-800"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              Eliminar
                            </button>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
