'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { CommunityPostCard } from '~/components/estudiantes/proyectos/subcomponents/CommunityPostCard';
import { CreatePostModal } from '~/components/estudiantes/proyectos/subcomponents/CreatePostModal';

import type { CommunityFeedPost } from '~/components/estudiantes/proyectos/types';

const PAGE_SIZE = 20;

const buildPageUrl = (authorId: string, offset: number) =>
  `/api/community-posts?authorId=${encodeURIComponent(authorId)}` +
  `&limit=${PAGE_SIZE}&offset=${offset}`;

interface CommunityPostsPage {
  items: CommunityFeedPost[];
  hasMore: boolean;
  nextOffset: number;
}

// Copia local del mismo helper que usan `ProjectPostsTab` y
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

interface ProfilePostsTabProps {
  // Primera página, ya resuelta en el servidor por `perfil/page.tsx`.
  posts: CommunityFeedPost[];
  hasMore: boolean;
  // Dueño del perfil, que aquí es siempre quien mira.
  authorId: string;
  emptyMessage: string;
}

/**
 * Pestaña "Posts" del perfil: las publicaciones de la comunidad escritas por
 * el dueño del perfil, tanto las que cuelgan de un proyecto de curso o de un
 * proyecto suelto como las generales (sin proyecto).
 *
 * A diferencia de `ProjectPostsTab` no usa SWR: la primera página llega ya
 * renderizada desde el Server Component y `router.refresh()` la revalida, así
 * que montar SWR aquí solo duplicaría esa petición.
 */
export function ProfilePostsTab({
  posts,
  hasMore,
  authorId,
  emptyMessage,
}: ProfilePostsTabProps) {
  const router = useRouter();

  // Las páginas siguientes se acumulan aparte para que la primera siga siendo
  // la que renderiza el servidor.
  const [extraPosts, setExtraPosts] = useState<CommunityFeedPost[]>([]);
  const [extraHasMore, setExtraHasMore] = useState<boolean | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityFeedPost | null>(
    null
  );
  const [deletedPostIds, setDeletedPostIds] = useState<Set<number>>(
    () => new Set()
  );

  // Paginar por offset puede repetir una fila si se publica algo mientras se
  // lee, así que se deduplica al unir en lugar de complicar el cursor.
  const seenIds = new Set<number>();
  const loadedPosts: CommunityFeedPost[] = [];
  [...posts, ...extraPosts].forEach((post) => {
    if (seenIds.has(post.id)) return;
    seenIds.add(post.id);
    loadedPosts.push(post);
  });

  // El borrado es optimista: la fila desaparece antes de que `router.refresh()`
  // vuelva con la primera página ya sin ella.
  const visiblePosts = loadedPosts.filter(
    (post) => !deletedPostIds.has(post.id)
  );
  const showLoadMore = extraHasMore ?? hasMore;

  const closeModal = () => {
    setIsPostModalOpen(false);
    setEditingPost(null);
  };

  const handleSaved = () => {
    // Vuelve a la primera página: la publicación editada puede cambiar de
    // sitio y los offsets acumulados ya no corresponden.
    setExtraPosts([]);
    setExtraHasMore(null);
    router.refresh();
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      // El offset cuenta lo ya traído, no lo visible: una fila borrada en el
      // cliente sigue ocupando su sitio en la consulta del servidor hasta que
      // `router.refresh()` la retira.
      const page = await fetchPage(buildPageUrl(authorId, loadedPosts.length));
      setExtraPosts((prev) => {
        const known = new Set([...posts, ...prev].map((post) => post.id));
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
      {visiblePosts.length === 0 ? (
        // Mismo recuadro que las demás pestañas del perfil, para que el vacío
        // se vea igual venga de donde venga.
        <div
          className="
            rounded-2xl border border-dashed border-border/50 bg-card/30 px-6
            py-16 text-center
            lg:py-24
          "
        >
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        visiblePosts.map((post) => (
          <CommunityPostCard
            key={`post-${post.id}`}
            post={post}
            onEdit={(current) => {
              setEditingPost(current);
              setIsPostModalOpen(true);
            }}
            onDeleted={(postId) =>
              setDeletedPostIds((prev) => new Set(prev).add(postId))
            }
          />
        ))
      )}

      {showLoadMore && visiblePosts.length > 0 ? (
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
        onSaved={handleSaved}
      />
    </div>
  );
}
