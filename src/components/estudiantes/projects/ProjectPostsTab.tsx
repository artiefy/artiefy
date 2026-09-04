'use client';

import { useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import useSWR from 'swr';

import { CommunityPostCard } from '~/components/estudiantes/proyectos/subcomponents/CommunityPostCard';
import { CreatePostModal } from '~/components/estudiantes/proyectos/subcomponents/CreatePostModal';

import type { CommunityFeedPost } from '~/components/estudiantes/proyectos/types';

const PAGE_SIZE = 10;

// Acotado a ESTE proyecto: lo publicado bajo un proyecto privado vive aquí
// dentro y no sale al muro de `/proyectos` hasta que el proyecto se marque
// como público. `projectId` solo puede reducir el resultado — quién puede ver
// cada fila lo sigue decidiendo el servidor con el id de quien mira, nunca un
// parámetro de la petición.
const buildPageUrl = (projectId: number, offset: number) =>
  `/api/community-posts?limit=${PAGE_SIZE}&offset=${offset}&projectId=${projectId}`;

interface CommunityPostsPage {
  items: CommunityFeedPost[];
  hasMore: boolean;
  nextOffset: number;
}

// Copia local del mismo helper que usan `ProjectFeedbackThread` y
// `CommunityPostCard`: este repo todavía no tiene un módulo compartido de
// manejo de errores de fetch.
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

const fetchPage = async (url: string): Promise<CommunityPostsPage> => {
  const res = await fetch(url);
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      extractErrorMessage(data, 'No se pudieron cargar las publicaciones')
    );
  }
  return data as CommunityPostsPage;
};

const getInitial = (value?: string | null) =>
  value?.trim().charAt(0).toUpperCase() || 'T';

interface ProjectPostsTabProps {
  projectId: number;
  projectName: string;
  // Solo el dueño publica bajo un proyecto: `POST /api/community-posts`
  // responde 403 a cualquier otro, así que un colaborador invitado lee el
  // feed pero no ve el compositor. Si algún día llegara un `Project` sin
  // `userId`, el compositor simplemente no aparece.
  canPublish: boolean;
}

/**
 * Pestaña "Posts" de la ficha del proyecto. Arriba, para el dueño, un
 * compositor que publica ya apuntando a este proyecto; debajo, lo publicado
 * bajo ESTE proyecto. Mientras el proyecto sea privado, esas publicaciones
 * viven solo aquí; al marcarlo como público también salen al muro de
 * `/proyectos`.
 *
 * El filtro de visibilidad vive entero en `GET /api/community-posts`: aquí no
 * se descarta ninguna publicación, porque un filtro de cliente no protege
 * nada.
 */
export default function ProjectPostsTab({
  projectId,
  projectName,
  canPublish,
}: ProjectPostsTabProps) {
  const { user } = useUser();

  const { data, error, isLoading, mutate } = useSWR<CommunityPostsPage, Error>(
    buildPageUrl(projectId, 0),
    fetchPage
  );

  // Las páginas siguientes se acumulan aparte para que SWR siga siendo el
  // dueño de la primera y pueda revalidarla sola.
  const [extraPosts, setExtraPosts] = useState<CommunityFeedPost[]>([]);
  const [extraHasMore, setExtraHasMore] = useState<boolean | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityFeedPost | null>(
    null
  );

  // Paginar por offset puede repetir una fila si alguien publica mientras se
  // lee, así que se deduplica al unir en lugar de complicar el cursor.
  const seenIds = new Set<number>();
  const posts: CommunityFeedPost[] = [];
  [...(data?.items ?? []), ...extraPosts].forEach((post) => {
    if (seenIds.has(post.id)) return;
    seenIds.add(post.id);
    posts.push(post);
  });

  const hasMore = extraHasMore ?? data?.hasMore ?? false;

  const closeModal = () => {
    setIsPostModalOpen(false);
    setEditingPost(null);
  };

  const handleSaved = () => {
    // Vuelve a la primera página: la publicación recién creada va arriba y
    // los offsets acumulados ya no corresponden.
    setExtraPosts([]);
    setExtraHasMore(null);
    void mutate();
  };

  const handleDeleted = (postId: number) => {
    setExtraPosts((prev) => prev.filter((post) => post.id !== postId));
    void mutate();
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await fetchPage(buildPageUrl(projectId, posts.length));
      setExtraPosts((prev) => {
        const known = new Set(
          [...(data?.items ?? []), ...prev].map((post) => post.id)
        );
        return [...prev, ...page.items.filter((post) => !known.has(post.id))];
      });
      setExtraHasMore(page.hasMore);
    } catch (loadError) {
      toast.error(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar más publicaciones'
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4">
      {canPublish ? (
        <button
          type="button"
          onClick={() => {
            setEditingPost(null);
            setIsPostModalOpen(true);
          }}
          className="
            flex w-full items-center gap-3 rounded-xl border border-border/50
            bg-card/50 p-4 text-left transition-colors
            hover:border-primary/40 hover:bg-card/70
            sm:p-5
          "
        >
          <span
            aria-hidden="true"
            className="
              flex size-9 shrink-0 items-center justify-center rounded-full
              bg-primary/15 text-sm font-semibold text-primary
            "
          >
            {getInitial(user?.firstName ?? user?.fullName)}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            ¿Qué quieres compartir sobre este proyecto?
          </span>
        </button>
      ) : null}

      <h3 className="pt-1 text-sm font-semibold text-foreground">
        Publicaciones del proyecto
      </h3>

      {isLoading ? (
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            Cargando publicaciones...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar las publicaciones.
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            Aún no hay publicaciones en este proyecto.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <CommunityPostCard
              key={`post-${post.id}`}
              post={post}
              onEdit={(current) => {
                setEditingPost(current);
                setIsPostModalOpen(true);
              }}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {hasMore && posts.length > 0 ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={isLoadingMore}
            className="
              inline-flex items-center justify-center rounded-md px-4 py-2
              text-sm font-medium text-muted-foreground transition-colors
              hover:bg-accent hover:text-black
              disabled:pointer-events-none disabled:opacity-50
            "
          >
            {isLoadingMore ? 'Cargando...' : 'Ver más posts'}
          </button>
        </div>
      ) : null}

      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={closeModal}
        editingPost={editingPost}
        lockedProject={{ id: projectId, name: projectName }}
        onSaved={handleSaved}
      />
    </div>
  );
}
