'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useParams } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import {
  ImageIcon,
  Mic,
  MoreHorizontal,
  Music,
  Send,
  ThumbsUp,
  Video,
  X,
} from 'lucide-react';

import { AudioRecorder } from '~/components/AudioRecorder';
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
  imageKey?: string;
  audioKey?: string;
  videoKey?: string;
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
  imageKey?: string;
  audioKey?: string;
  videoKey?: string;
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
  const [replyMessage, setReplyMessage] = useState<Record<number, string>>({});
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState<string>('');
  const [editReplyContent, setEditReplyContent] = useState<string>('');
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  // Para posts principales
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  // Para replies (indexadas por postId)
  const [replyImage, setReplyImage] = useState<Record<number, File>>({});
  const [replyAudio, setReplyAudio] = useState<Record<number, File>>({});
  const [replyVideo, setReplyVideo] = useState<Record<number, File>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showReplyAudioRecorder, setShowReplyAudioRecorder] = useState<
    Set<number>
  >(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    if (!message.trim() || !user || isSubmitting || ForumIdNumber === null)
      return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', message);
      formData.append('foroId', String(ForumIdNumber));
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      if (selectedAudio) {
        formData.append('audio', selectedAudio);
      }
      if (selectedVideo) {
        formData.append('video', selectedVideo);
      }

      const response = await fetch('/api/forums/posts', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('');
        setSelectedImage(null);
        setSelectedAudio(null);
        setSelectedVideo(null);
        if (textareaRef.current) textareaRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (audioInputRef.current) audioInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
        // Pequeño delay para asegurar que el estado se actualiza antes de hacer fetch
        setTimeout(() => {
          fetchPosts();
        }, 100);
      }
    } catch (error) {
      console.error('Error al enviar el post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (replyingToPostId === null) return;

    const currentReplyMessage = replyMessage[replyingToPostId] || '';
    const currentReplyImage = replyImage[replyingToPostId];
    const currentReplyAudio = replyAudio[replyingToPostId];
    const currentReplyVideo = replyVideo[replyingToPostId];

    if (
      !currentReplyMessage.trim() &&
      !currentReplyAudio &&
      !currentReplyImage &&
      !currentReplyVideo
    )
      return;
    if (!user || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      const formData = new FormData();
      formData.append('content', currentReplyMessage);
      formData.append('postId', String(replyingToPostId));
      if (currentReplyImage) {
        formData.append('image', currentReplyImage);
      }
      if (currentReplyAudio) {
        formData.append('audio', currentReplyAudio);
      }
      if (currentReplyVideo) {
        formData.append('video', currentReplyVideo);
      }

      const response = await fetch('/api/forums/posts/postReplay', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setReplyMessage((prev) => {
          const updated = { ...prev };
          delete updated[replyingToPostId];
          return updated;
        });
        setReplyImage((prev) => {
          const updated = { ...prev };
          delete updated[replyingToPostId];
          return updated;
        });
        setReplyAudio((prev) => {
          const updated = { ...prev };
          delete updated[replyingToPostId];
          return updated;
        });
        setReplyVideo((prev) => {
          const updated = { ...prev };
          delete updated[replyingToPostId];
          return updated;
        });
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
            className="text-sm text-gray-400 transition-colors hover:text-primary"
          >
            Ver {replies.length} respuesta{replies.length > 1 ? 's' : ''}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => toggleReplies(postId)}
              className="text-sm text-gray-400 transition-colors hover:text-primary"
            >
              Ocultar respuestas
            </button>
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="ml-6 rounded-xl bg-gray-800/50 p-4"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
                      getAvatarColor(reply.userId.name ?? '')
                    )}
                  >
                    {getInitials(reply.userId.name ?? '')}
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {reply.userId.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(reply.createdAt)}
                      </span>
                    </div>
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

                {/* Content */}
                {editingReplyId === reply.id ? (
                  <div className="mt-3">
                    <textarea
                      className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-primary focus:outline-none"
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
                  <>
                    {reply.content && (
                      <p className="mt-2 text-sm text-gray-300">
                        {reply.content}
                      </p>
                    )}

                    {/* Media Grid */}
                    {(reply.imageKey || reply.videoKey || reply.audioKey) && (
                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Images & Videos */}
                        {(reply.imageKey || reply.videoKey) && (
                          <>
                            {reply.imageKey && (
                              <div
                                className="group relative h-40 w-full cursor-pointer overflow-hidden rounded-lg border border-cyan-700/40 bg-gray-900 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                                onClick={() =>
                                  setLightboxImage(
                                    `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.imageKey}`
                                  )
                                }
                              >
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.imageKey}`}
                                  alt="Respuesta"
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            )}
                            {reply.videoKey && (
                              <div className="relative h-40 w-full overflow-hidden rounded-lg border border-cyan-700/40 bg-gray-900 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
                                <video
                                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.videoKey}`}
                                  className="h-full w-full object-cover"
                                  controls
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* Audio - Full Width */}
                        {reply.audioKey && (
                          <div className="col-span-1 sm:col-span-2">
                            <audio
                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${reply.audioKey}`}
                              className="w-full rounded-lg border border-cyan-700/40 bg-gray-900"
                              controls
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="mt-4 text-sm text-primary">Cargando foro...</span>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <Image
            src={lightboxImage}
            alt="Imagen ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            width={1000}
            height={900}
          />
        </div>
      )}
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-sm text-primary hover:text-gray-300"
                href="/"
              >
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-sm text-primary hover:text-gray-300"
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
        <div className="rounded-3xl border border-gray-700/50 bg-gradient-to-b from-gray-900/90 to-gray-950/95 p-6 shadow-2xl ring-1 shadow-black/40 ring-white/5 backdrop-blur-sm">
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
          {(forumData?.coverImageKey && forumData.coverImageKey.trim()) ||
          (forumData?.documentKey && forumData.documentKey.trim()) ? (
            <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              {forumData?.coverImageKey && forumData.coverImageKey.trim() && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    Imagen del foro
                  </p>
                  <button
                    onClick={() =>
                      setLightboxImage(
                        `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forumData.coverImageKey}`
                      )
                    }
                    className="group relative overflow-hidden rounded-lg border border-gray-700 transition-colors hover:border-primary"
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forumData.coverImageKey}`}
                      alt="Imagen del foro"
                      className="h-32 w-32 object-cover transition-opacity group-hover:opacity-80"
                      width={128}
                      height={128}
                      loading="lazy"
                      onError={(e) => {
                        console.error(
                          'Error cargando imagen del foro:',
                          forumData.coverImageKey
                        );
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                      <ImageIcon className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                </div>
              )}
              {forumData?.documentKey && forumData.documentKey.trim() && (
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
          ) : null}

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
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedImage(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                  title="Adjuntar imagen"
                >
                  <ImageIcon className="h-5 w-5" />
                  {selectedImage && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
                      ✓
                    </span>
                  )}
                </button>

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    setSelectedAudio(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
                <div className="relative">
                  <button
                    onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                    className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                    title="Grabar o subir audio"
                  >
                    <Mic className="h-5 w-5" />
                    {selectedAudio && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
                        ✓
                      </span>
                    )}
                  </button>
                </div>

                {/* Modal del Audio Recorder - Portal */}
                {showAudioRecorder && (
                  <div className="fixed top-40 right-6 z-[9999] w-80 rounded-lg border border-cyan-700/30 bg-slate-900 p-4 shadow-lg">
                    <div className="space-y-3">
                      {/* Opción de subir archivo */}
                      <button
                        onClick={() => audioInputRef.current?.click()}
                        className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        📁 Subir archivo de audio
                      </button>

                      {/* Opción de grabar */}
                      <AudioRecorder
                        onAudioSelect={(file) => {
                          setSelectedAudio(file);
                          setShowAudioRecorder(false);
                        }}
                        onClose={() => setShowAudioRecorder(false)}
                      />

                      {/* Botón para cerrar */}
                      <button
                        onClick={() => setShowAudioRecorder(false)}
                        className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    setSelectedVideo(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                  title="Adjuntar video"
                >
                  <Video className="h-5 w-5" />
                  {selectedVideo && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
                      ✓
                    </span>
                  )}
                </button>
              </div>

              {/* Media previews para posts */}
              {(selectedImage || selectedVideo || selectedAudio) && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectedImage && (
                    <div className="relative overflow-hidden rounded-lg border border-cyan-700/40">
                      <Image
                        src={URL.createObjectURL(selectedImage)}
                        alt="Preview"
                        className="h-40 w-full object-cover"
                        width={500}
                        height={160}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                        {selectedImage.name}
                      </span>
                    </div>
                  )}
                  {selectedVideo && (
                    <div className="relative overflow-hidden rounded-lg border border-cyan-700/40 bg-black">
                      <video
                        src={URL.createObjectURL(selectedVideo)}
                        className="h-40 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                        {selectedVideo.name}
                      </span>
                    </div>
                  )}
                  {selectedAudio && (
                    <div className="relative flex items-center gap-2 rounded-lg border border-cyan-700/40 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60 p-2">
                      <Music className="h-4 w-4 flex-shrink-0 text-cyan-400/80" />
                      <span className="flex-1 truncate text-xs font-semibold text-white">
                        {selectedAudio.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedAudio(null)}
                        className="rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handlePostSubmit}
                disabled={
                  (!message.trim() &&
                    !selectedAudio &&
                    !selectedImage &&
                    !selectedVideo) ||
                  isSubmitting
                }
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
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
                              className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800 p-3 text-sm text-white focus:border-primary focus:outline-none"
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

                        {/* Media del post */}
                        {(post.imageKey || post.audioKey || post.videoKey) && (
                          <div className="mt-6 space-y-4">
                            {/* Imagen y Video lado a lado */}
                            {(post.imageKey || post.videoKey) && (
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Imagen - Marco premium */}
                                {post.imageKey && (
                                  <button
                                    onClick={() =>
                                      setLightboxImage(
                                        `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.imageKey}`
                                      )
                                    }
                                    className="group relative overflow-hidden rounded-lg border border-gray-600/40 shadow-lg shadow-black/50 transition-all duration-300 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30"
                                  >
                                    <Image
                                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.imageKey}`}
                                      alt="Imagen del post"
                                      className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                      width={500}
                                      height={256}
                                      loading="lazy"
                                      onError={(e) => {
                                        console.error(
                                          'Error cargando imagen:',
                                          post.imageKey
                                        );
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                                      <ImageIcon className="h-6 w-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    </div>
                                  </button>
                                )}
                                {/* Video */}
                                {post.videoKey && (
                                  <div className="overflow-hidden rounded-lg border border-gray-600/40 bg-black shadow-lg shadow-black/50 transition-all duration-300 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/30">
                                    <video
                                      controls
                                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.videoKey}`}
                                      className="h-64 w-full object-cover"
                                      onError={() =>
                                        console.error(
                                          'Error cargando video:',
                                          post.videoKey
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Audio - Ancho completo debajo */}
                            {post.audioKey && (
                              <div className="flex items-center gap-3 rounded-lg border border-gray-600/40 bg-gradient-to-r from-gray-900/60 via-gray-900/40 to-gray-900/60 p-4 shadow-md shadow-black/30 transition-all duration-300 hover:border-cyan-400/60 hover:from-gray-900/80 hover:to-gray-900/80">
                                <Music className="h-5 w-5 flex-shrink-0 text-cyan-400/80" />
                                <audio
                                  controls
                                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${post.audioKey}`}
                                  className="h-8 flex-1"
                                  onError={() =>
                                    console.error(
                                      'Error cargando audio:',
                                      post.audioKey
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="mt-3 flex items-center gap-4">
                          <button className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white">
                            <ThumbsUp className="h-4 w-4" />
                            Me gusta
                          </button>
                          {repliesCount > 0 && (
                            <span className="ml-auto text-xs text-gray-500">
                              {repliesCount} respuesta
                              {repliesCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Formulario de respuesta - Siempre visible */}
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
                              className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800 p-3 text-sm text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
                              placeholder="Escribe tu respuesta..."
                              value={replyMessage[post.id] || ''}
                              onChange={(e) =>
                                setReplyMessage((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              onFocus={() => setReplyingToPostId(post.id)}
                              rows={2}
                              autoFocus
                            />

                            {/* Audio Recorder para replies */}
                            {showReplyAudioRecorder.has(post.id) && (
                              <div className="mt-3">
                                <AudioRecorder
                                  onAudioSelect={(file) => {
                                    setReplyAudio((prev) => ({
                                      ...prev,
                                      [post.id]: file,
                                    }));
                                    setShowReplyAudioRecorder(
                                      (prev) =>
                                        new Set(
                                          [...prev].filter(
                                            (id) => id !== post.id
                                          )
                                        )
                                    );
                                  }}
                                  onClose={() =>
                                    setShowReplyAudioRecorder(
                                      (prev) =>
                                        new Set(
                                          [...prev].filter(
                                            (id) => id !== post.id
                                          )
                                        )
                                    )
                                  }
                                />
                              </div>
                            )}

                            {/* Media previews para replies */}
                            {(replyImage[post.id] ||
                              replyVideo[post.id] ||
                              replyAudio[post.id]) && (
                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {replyImage[post.id] && (
                                  <div className="relative overflow-hidden rounded-lg border border-cyan-700/40">
                                    <Image
                                      src={URL.createObjectURL(
                                        replyImage[post.id]
                                      )}
                                      alt="Preview"
                                      className="h-32 w-full object-cover"
                                      width={500}
                                      height={128}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReplyImage((prev) => {
                                          const updated = { ...prev };
                                          delete updated[post.id];
                                          return updated;
                                        })
                                      }
                                      className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
                                      {replyImage[post.id].name}
                                    </span>
                                  </div>
                                )}
                                {replyVideo[post.id] && (
                                  <div className="relative overflow-hidden rounded-lg border border-cyan-700/40 bg-black">
                                    <video
                                      src={URL.createObjectURL(
                                        replyVideo[post.id]
                                      )}
                                      className="h-32 w-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReplyVideo((prev) => {
                                          const updated = { ...prev };
                                          delete updated[post.id];
                                          return updated;
                                        })
                                      }
                                      className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
                                      {replyVideo[post.id].name}
                                    </span>
                                  </div>
                                )}
                                {replyAudio[post.id] && (
                                  <div className="relative flex items-center gap-2 rounded-lg border border-cyan-700/40 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60 p-2">
                                    <Music className="h-4 w-4 flex-shrink-0 text-cyan-400/80" />
                                    <span className="flex-1 truncate text-xs font-semibold text-white">
                                      {replyAudio[post.id].name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReplyAudio((prev) => {
                                          const updated = { ...prev };
                                          delete updated[post.id];
                                          return updated;
                                        })
                                      }
                                      className="rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {/* Botones de media */}
                              <button
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'audio/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement)
                                      .files?.[0];
                                    if (file)
                                      setReplyAudio((prev) => ({
                                        ...prev,
                                        [post.id]: file,
                                      }));
                                  };
                                  input.click();
                                }}
                                className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                title="Subir audio"
                              >
                                <Mic className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setShowReplyAudioRecorder((prev) =>
                                    prev.has(post.id)
                                      ? new Set(
                                          [...prev].filter(
                                            (id) => id !== post.id
                                          )
                                        )
                                      : new Set([...prev, post.id])
                                  )
                                }
                                className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                title="Grabar audio"
                              >
                                <Music className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement)
                                      .files?.[0];
                                    if (file)
                                      setReplyImage((prev) => ({
                                        ...prev,
                                        [post.id]: file,
                                      }));
                                  };
                                  input.click();
                                }}
                                className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                title="Adjuntar imagen"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'video/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement)
                                      .files?.[0];
                                    if (file)
                                      setReplyVideo((prev) => ({
                                        ...prev,
                                        [post.id]: file,
                                      }));
                                  };
                                  input.click();
                                }}
                                className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                                title="Adjuntar video"
                              >
                                <Video className="h-4 w-4" />
                              </button>

                              <button
                                className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
                                onClick={handleReplySubmit}
                                disabled={
                                  (!(replyMessage[post.id] || '').trim() &&
                                    !replyAudio[post.id] &&
                                    !replyImage[post.id] &&
                                    !replyVideo[post.id]) ||
                                  isSubmittingReply
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
                            </div>
                          </div>
                        </div>

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
