'use client';
import { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import Loading from '~/app/loading';

interface Foro {
  id: number;
  title: string;
  description: string;
  courseId: { id: number; title: string };
  userId: { id: string; name: string };
}

interface Post {
  id: number;
  userId: { id: string; name: string };
  content: string;
  createdAt: string;
  updatedAt: string;
}

// --- NUEVO: Interfaz para respuestas ---
interface PostReply {
  id: number;
  userId: { id: string; name: string };
  postId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentForumPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const forumId = Array.isArray(params?.forumId)
    ? params.forumId[0]
    : params.forumId;
  const [forum, setForum] = useState<Foro | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [postReplies, setPostReplies] = useState<PostReply[]>([]);
  const [replyMessage, setReplyMessage] = useState<Record<number, string>>({});
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);

  // Verifica inscripción y carga foro
  useEffect(() => {
    const fetchForum = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/estudiantes/forums/${forumId}`);
        if (!res.ok) throw new Error('No se encontró el foro');
        const data = (await res.json()) as Partial<Foro>;
        if (data && typeof data.id === 'number') setForum(data as Foro);

        // Verifica inscripción
        if (
          user &&
          data?.courseId &&
          typeof data.courseId === 'object' &&
          typeof data.courseId.id === 'number'
        ) {
          const enrollRes = await fetch(
            `/api/estudiantes/courses/${data.courseId.id}/is-enrolled?userId=${user.id}`
          );
          const enrollData: { isEnrolled?: boolean } = await enrollRes.json();
          if (!enrollData?.isEnrolled) {
            toast.error(
              'Debes estar inscrito en el curso para acceder al foro'
            );
            router.replace(`/estudiantes/cursos/${data.courseId.id}`);
            return;
          }
        }
      } catch {
        toast.error('No tienes acceso a este foro');
        router.replace('/estudiantes');
      } finally {
        setLoading(false);
      }
    };
    fetchForum();
  }, [forumId, user, router]);

  // Cargar posts y respuestas
  useEffect(() => {
    if (!forum) return;
    const fetchPostsAndReplies = async () => {
      const res = await fetch(`/api/estudiantes/forums/${forum.id}/posts`);
      if (res.ok) {
        const postsData = (await res.json()) as Post[];
        setPosts(postsData);

        // Obtener replies para todos los posts
        if (postsData.length > 0) {
          const postIds = postsData.map((p) => p.id).join(',');
          const repliesRes = await fetch(
            `/api/forums/posts/postReplay?postIds=${postIds}`
          );
          if (repliesRes.ok) {
            setPostReplies((await repliesRes.json()) as PostReply[]);
          }
        } else {
          setPostReplies([]);
        }
      }
    };
    fetchPostsAndReplies();
  }, [forum]);

  // Enviar respuesta
  const handleSend = async () => {
    if (!message.trim() || !user) return;
    const res = await fetch(`/api/estudiantes/forums/${forum?.id}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message, userId: user.id }),
    });
    if (res.ok) {
      setMessage('');
      const updated = await fetch(`/api/estudiantes/forums/${forum?.id}/posts`);
      setPosts((await updated.json()) as Post[]);
    }
  };

  // --- NUEVO: Enviar respuesta a un post específico ---
  const handleReplySend = async (postId: number) => {
    if (!replyMessage[postId]?.trim() || !user) return;
    const res = await fetch('/api/forums/posts/postReplay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: replyMessage[postId],
        postId,
        userId: user.id,
      }),
    });
    if (res.ok) {
      setReplyMessage((prev) => ({ ...prev, [postId]: '' }));
      setReplyingToPostId(null);
      // Refrescar replies
      const postIds = posts.map((p) => p.id).join(',');
      const repliesRes = await fetch(
        `/api/forums/posts/postReplay?postIds=${postIds}`
      );
      if (repliesRes.ok) {
        setPostReplies((await repliesRes.json()) as PostReply[]);
      }
    }
  };

  if (loading) return <Loading />;
  if (!forum) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="mb-2 text-2xl font-bold">{forum.title}</h1>
      <p className="mb-6 text-gray-300">{forum.description}</p>
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="mb-2 rounded bg-gray-800 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold text-cyan-300">
                {post.userId.name}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="text-white">{post.content}</div>
            {/* --- Mostrar replies de este post --- */}
            <div className="mt-3 space-y-2">
              {postReplies
                .filter((r) => r.postId === post.id)
                .map((reply) => (
                  <div key={reply.id} className="ml-4 rounded bg-gray-900 p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-300">
                        {reply.userId.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-white">{reply.content}</div>
                  </div>
                ))}
            </div>
            {/* --- Botón para responder a este post --- */}
            <div className="mt-3">
              {replyingToPostId === post.id ? (
                <div>
                  <textarea
                    className="mb-2 w-full rounded bg-gray-900 p-3 text-white"
                    rows={2}
                    placeholder="Escribe tu respuesta..."
                    value={replyMessage[post.id] || ''}
                    onChange={(e) =>
                      setReplyMessage((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
                      onClick={() => handleReplySend(post.id)}
                    >
                      Responder
                    </button>
                    <button
                      className="rounded bg-gray-600 px-4 py-2 font-bold text-white hover:bg-gray-700"
                      onClick={() => setReplyingToPostId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="mt-2 text-sm text-blue-400 hover:underline"
                  onClick={() => setReplyingToPostId(post.id)}
                >
                  Responder a este post
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <textarea
          className="mb-2 w-full rounded bg-gray-900 p-3 text-white"
          rows={3}
          placeholder="Escribe tu respuesta..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="rounded bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
          onClick={handleSend}
        >
          Responder
        </button>
      </div>
    </div>
  );
}
