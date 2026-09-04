'use client';

import { useState } from 'react';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { getUserRole } from '~/utils/roles';

import type { CommunityPostComment } from '../types';
import type { Roles } from '~/types/globals';

// Staff de la plataforma, el mismo conjunto que `STAFF_ROLES` en
// `GET /api/community-posts` y que `isStaff` en el endpoint de borrado. El
// servidor vuelve a comprobarlo: esto solo decide si se pinta el control.
const STAFF_ROLES: readonly Roles[] = ['admin', 'educador', 'super-admin'];

// La anidación en los DATOS es ilimitada; la sangría visual no puede serlo, o
// a partir del quinto nivel el hilo no cabe en un móvil de 360 px. Pasado el
// tope, el rail de la izquierda sigue indicando que hay anidación pero el
// borde deja de avanzar, y cada nodo antepone "Respondiendo a @alguien" para
// que no se pierda de quién cuelga.
const INDENT_DEPTH_CAP = 4;

// Los dos anchos posibles del contenedor de respuestas, como cadenas
// literales completas: Tailwind 4 no ve una clase compuesta en tiempo de
// ejecución (`pl-${n}`), así que la utilidad simplemente no existiría.
const REPLIES_INDENTED = 'mt-3 ml-4 space-y-3 border-l-2 border-border/40 pl-3';
const REPLIES_FLUSH = 'mt-3 space-y-3 border-l-2 border-border/40 pl-3';

// A partir de aquí las respuestas llegan plegadas: es lo que evita montar
// cientos de subárboles de golpe en un hilo largo.
const AUTO_COLLAPSE_DEPTH = 2;

// Un nodo raíz no tiene antepasados. Constante compartida para no crear un
// `Set` nuevo por raíz en cada render.
const NO_ANCESTORS: ReadonlySet<number> = new Set<number>();

interface CommentsResponse {
  items: CommunityPostComment[];
}

// Copia local de los mismos helpers que ya duplican `CommunityPostCard`,
// `ProjectFeedbackThread` y `ProjectPostsTab`: este repo todavía no tiene un
// módulo compartido de fechas ni de errores de fetch.
const getInitial = (value: string) =>
  value.trim().charAt(0).toUpperCase() || 'U';

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recién';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'justo ahora';
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} días`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `hace ${diffMonths} meses`;
  const diffYears = Math.floor(diffMonths / 12);
  return `hace ${diffYears} años`;
};

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

const fetcher = async (url: string): Promise<CommentsResponse> => {
  const res = await fetch(url);
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      extractErrorMessage(data, 'No se pudieron cargar los comentarios')
    );
  }
  return data as CommentsResponse;
};

// Comentarios vivos del árbol, sin las lápidas: es exactamente lo que cuenta
// la subconsulta escalar del feed (`deleted_at is null`), así que el número
// que se pinta con el hilo abierto no contradice al que llegó con la página.
const countLiveComments = (nodes: CommunityPostComment[]): number =>
  nodes.reduce(
    (total, node) =>
      total + (node.isDeleted ? 0 : 1) + countLiveComments(node.replies),
    0
  );

interface CommentNodeProps {
  comment: CommunityPostComment;
  depth: number;
  // Solo se usa pasado `INDENT_DEPTH_CAP`, donde la sangría ya no distingue
  // de quién cuelga la respuesta.
  parentAuthorName: string | null;
  // Ids de la cadena de padres de este nodo. Segunda barrera contra un
  // `parent_id` corrupto: el servidor ya corta ciclos al armar el árbol,
  // pero este componente es exportable y algún día puede recibir datos de
  // otra fuente. Una recursión sin freno cuelga la pestaña entera.
  ancestors: ReadonlySet<number>;
  viewerId?: string;
  canModerate: boolean;
  isSignedIn: boolean;
  openReplyId: number | null;
  onToggleReply: (commentId: number) => void;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  isSubmittingReply: boolean;
  onSubmitReply: (parentId: number) => void;
  editingId: number | null;
  onToggleEdit: (comment: CommunityPostComment) => void;
  editContent: string;
  onEditContentChange: (value: string) => void;
  isSubmittingEdit: boolean;
  onSubmitEdit: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  deletingId: number | null;
}

function CommentNode({
  comment,
  depth,
  parentAuthorName,
  ancestors,
  viewerId,
  canModerate,
  isSignedIn,
  openReplyId,
  onToggleReply,
  replyContent,
  onReplyContentChange,
  isSubmittingReply,
  onSubmitReply,
  editingId,
  onToggleEdit,
  editContent,
  onEditContentChange,
  isSubmittingEdit,
  onSubmitEdit,
  onDelete,
  deletingId,
}: CommentNodeProps) {
  const [areRepliesOpen, setAreRepliesOpen] = useState(
    depth < AUTO_COLLAPSE_DEPTH
  );

  const authorName = comment.author?.name.trim() ?? 'Usuario';
  const avatarUrl = comment.author?.avatarUrl;
  const isOwnComment = Boolean(
    viewerId && comment.author?.id === viewerId && !comment.isDeleted
  );
  const canDelete = !comment.isDeleted && (isOwnComment || canModerate);
  const isReplyOpen = openReplyId === comment.id;
  const isEditing = editingId === comment.id;
  const replyRegionId = `community-comment-${comment.id}-reply`;
  const repliesRegionId = `community-comment-${comment.id}-replies`;

  // Cadena de padres incluyendo este nodo: una respuesta que ya aparece en
  // ella cerraría un ciclo, así que no se renderiza (y con ella se corta la
  // recursión infinita que colgaría la pestaña).
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(comment.id);
  const safeReplies = comment.replies.filter(
    (reply) => !nextAncestors.has(reply.id)
  );

  return (
    <div className="min-w-0">
      <div className="flex items-start gap-2.5">
        {comment.isDeleted ? (
          <div
            className="
              size-8 shrink-0 rounded-full border border-dashed
              border-border/50
            "
          />
        ) : avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={authorName}
            width={32}
            height={32}
            className="
              size-8 shrink-0 rounded-full object-cover ring-1 ring-border/30
            "
          />
        ) : (
          <div
            className="
              flex size-8 shrink-0 items-center justify-center rounded-full
              bg-primary/20 text-[11px] font-bold text-primary ring-1
              ring-border/30
            "
          >
            {getInitial(authorName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {comment.isDeleted ? (
            <p className="text-xs text-muted-foreground italic">
              Comentario eliminado
            </p>
          ) : (
            <>
              {depth >= INDENT_DEPTH_CAP && parentAuthorName ? (
                <p className="text-[11px] text-muted-foreground">
                  Respondiendo a{' '}
                  <span className="font-semibold text-primary">
                    @{parentAuthorName}
                  </span>
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {authorName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                {comment.updatedAt !== comment.createdAt ? (
                  <span className="text-[10px] text-muted-foreground">
                    (editado)
                  </span>
                ) : null}
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <label
                    htmlFor={`community-comment-${comment.id}-edit`}
                    className="sr-only"
                  >
                    Editar comentario
                  </label>
                  <textarea
                    id={`community-comment-${comment.id}-edit`}
                    value={editContent}
                    onChange={(event) =>
                      onEditContentChange(event.target.value)
                    }
                    rows={2}
                    autoFocus
                    className="
                      min-h-[64px] w-full resize-none rounded-xl bg-secondary/30
                      p-2.5 text-xs text-foreground
                      placeholder:text-muted-foreground
                      focus:ring-2 focus:ring-primary/50 focus:outline-none
                    "
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleEdit(comment)}
                      disabled={isSubmittingEdit}
                      className="
                        rounded-lg px-3 py-1.5 text-xs font-semibold
                        text-muted-foreground transition-colors
                        hover:bg-accent hover:text-black
                        focus-visible:ring-2 focus-visible:ring-ring
                        focus-visible:ring-offset-2 focus-visible:outline-none
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => onSubmitEdit(comment.id)}
                      disabled={!editContent.trim() || isSubmittingEdit}
                      className="
                        rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold
                        text-primary-foreground transition-colors
                        hover:bg-primary/90
                        focus-visible:ring-2 focus-visible:ring-ring
                        focus-visible:ring-offset-2 focus-visible:outline-none
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                    >
                      {isSubmittingEdit ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-0.5 text-xs whitespace-pre-wrap text-foreground/90">
                  {comment.content}
                </p>
              )}
            </>
          )}

          {!comment.isDeleted && !isEditing ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => onToggleReply(comment.id)}
                  aria-expanded={isReplyOpen}
                  aria-controls={isReplyOpen ? replyRegionId : undefined}
                  className="
                    inline-flex items-center gap-1 text-[11px] font-semibold
                    text-muted-foreground transition-colors
                    hover:text-primary
                    focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none
                  "
                >
                  <MessageSquare className="size-3" />
                  Responder
                </button>
              ) : null}
              {isOwnComment ? (
                <button
                  type="button"
                  onClick={() => onToggleEdit(comment)}
                  className="
                    text-[11px] font-semibold text-muted-foreground
                    transition-colors
                    hover:text-primary
                    focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none
                  "
                >
                  Editar
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="
                    text-[11px] font-semibold text-muted-foreground
                    transition-colors
                    hover:text-red-400
                    focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  {deletingId === comment.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              ) : null}
            </div>
          ) : null}

          {isReplyOpen ? (
            <div
              id={replyRegionId}
              role="region"
              aria-label={`Responder a ${authorName}`}
              className="mt-2 space-y-2"
            >
              <label htmlFor={`${replyRegionId}-textarea`} className="sr-only">
                Respuesta para {authorName}
              </label>
              <textarea
                id={`${replyRegionId}-textarea`}
                value={replyContent}
                onChange={(event) => onReplyContentChange(event.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={2}
                autoFocus
                className="
                  min-h-[64px] w-full resize-none rounded-xl bg-secondary/30
                  p-2.5 text-xs text-foreground
                  placeholder:text-muted-foreground
                  focus:ring-2 focus:ring-primary/50 focus:outline-none
                "
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onToggleReply(comment.id)}
                  disabled={isSubmittingReply}
                  className="
                    rounded-lg px-3 py-1.5 text-xs font-semibold
                    text-muted-foreground transition-colors
                    hover:bg-accent hover:text-black
                    focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isSubmittingReply}
                  className="
                    inline-flex items-center gap-1.5 rounded-lg bg-primary
                    px-3 py-1.5 text-xs font-semibold text-primary-foreground
                    transition-colors
                    hover:bg-primary/90
                    focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  <Send className="size-3" />
                  {isSubmittingReply ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          ) : null}

          {safeReplies.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setAreRepliesOpen((current) => !current)}
                aria-expanded={areRepliesOpen}
                aria-controls={areRepliesOpen ? repliesRegionId : undefined}
                className="
                  mt-2 text-[11px] font-semibold text-primary
                  transition-colors
                  hover:text-primary/80
                  focus-visible:ring-2 focus-visible:ring-ring
                  focus-visible:ring-offset-2 focus-visible:outline-none
                "
              >
                {areRepliesOpen
                  ? 'Ocultar respuestas'
                  : `Ver ${safeReplies.length} ${
                      safeReplies.length === 1 ? 'respuesta' : 'respuestas'
                    }`}
              </button>
              {areRepliesOpen ? (
                <div
                  id={repliesRegionId}
                  className={
                    depth >= INDENT_DEPTH_CAP ? REPLIES_FLUSH : REPLIES_INDENTED
                  }
                >
                  {safeReplies.map((reply) => (
                    <CommentNode
                      key={reply.id}
                      comment={reply}
                      depth={depth + 1}
                      parentAuthorName={comment.isDeleted ? null : authorName}
                      ancestors={nextAncestors}
                      viewerId={viewerId}
                      canModerate={canModerate}
                      isSignedIn={isSignedIn}
                      openReplyId={openReplyId}
                      onToggleReply={onToggleReply}
                      replyContent={replyContent}
                      onReplyContentChange={onReplyContentChange}
                      isSubmittingReply={isSubmittingReply}
                      onSubmitReply={onSubmitReply}
                      editingId={editingId}
                      onToggleEdit={onToggleEdit}
                      editContent={editContent}
                      onEditContentChange={onEditContentChange}
                      isSubmittingEdit={isSubmittingEdit}
                      onSubmitEdit={onSubmitEdit}
                      onDelete={onDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface CommunityPostCommentsProps {
  postId: number;
  // Deja que la tarjeta prefiera el total vivo del hilo abierto sobre el
  // `commentCount` que llegó con la página del feed, que se queda atrás en
  // cuanto alguien comenta.
  onCountChange?: (count: number) => void;
}

/**
 * Hilo de comentarios de una publicación de la comunidad, con anidación
 * ILIMITADA (estilo Facebook).
 *
 * Se monta DENTRO de `CommunityPostCard`, no en cada vista: las tres
 * superficies que muestran publicaciones (perfil, feed social y la pestaña
 * "Posts" de un proyecto) ya renderizan esa tarjeta, así que el hilo llega a
 * las tres con un solo componente y no puede divergir entre ellas.
 *
 * Solo recibe `postId`: los datos, la identidad de quien mira y los permisos
 * los resuelve por su cuenta. El servidor vuelve a comprobar cada permiso;
 * los controles de aquí son comodidad, no autoridad.
 */
export function CommunityPostComments({
  postId,
  onCountChange,
}: CommunityPostCommentsProps) {
  const { user, isSignedIn } = useUser();
  const viewerId = user?.id;
  const viewerRole = getUserRole(user?.publicMetadata?.role);
  const canModerate = Boolean(viewerRole && STAFF_ROLES.includes(viewerRole));

  const commentsUrl = `/api/community-posts/${postId}/comments`;
  const { data, isLoading, error, mutate } = useSWR<CommentsResponse, Error>(
    commentsUrl,
    fetcher,
    {
      // El contador se refresca en el mismo momento en que llegan los datos,
      // sin un efecto que espeje el estado del hijo en el padre.
      onSuccess: (loaded) =>
        onCountChange?.(countLiveComments(loaded.items ?? [])),
    }
  );
  const comments = data?.items ?? [];

  const [rootContent, setRootContent] = useState('');
  const [isSubmittingRoot, setIsSubmittingRoot] = useState(false);
  // Un solo composer abierto en todo el árbol, como en
  // `ProjectFeedbackThread`: el estado vive aquí y baja por props, en vez de
  // repetirse en cada uno de los (potencialmente cientos de) nodos.
  const [openReplyId, setOpenReplyId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const postComment = async (content: string, parentId?: number) => {
    const res = await fetch(commentsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        parentId === undefined ? { content } : { content, parentId }
      ),
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        extractErrorMessage(body, 'No se pudo publicar el comentario')
      );
    }
  };

  // Sin inserción optimista, a propósito: colocar un nodo nuevo dentro de un
  // árbol anidado y revertirlo si el POST falla es justo donde se rompen las
  // invariantes de ciclos y huérfanos. Un `mutate()` sobre un hilo ya
  // cargado cuesta un viaje y deja al servidor como único autor de la forma
  // del árbol.
  const handleSubmitRoot = () => {
    const content = rootContent.trim();
    if (!content || isSubmittingRoot) return;
    setIsSubmittingRoot(true);
    void (async () => {
      try {
        await postComment(content);
        setRootContent('');
        await mutate();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : 'No se pudo publicar el comentario'
        );
      } finally {
        setIsSubmittingRoot(false);
      }
    })();
  };

  const handleToggleReply = (commentId: number) => {
    setOpenReplyId((current) => (current === commentId ? null : commentId));
    setReplyContent('');
  };

  const handleSubmitReply = (parentId: number) => {
    const content = replyContent.trim();
    if (!content || isSubmittingReply) return;
    setIsSubmittingReply(true);
    void (async () => {
      try {
        await postComment(content, parentId);
        setReplyContent('');
        setOpenReplyId(null);
        await mutate();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : 'No se pudo enviar la respuesta'
        );
      } finally {
        setIsSubmittingReply(false);
      }
    })();
  };

  const handleToggleEdit = (comment: CommunityPostComment) => {
    setEditingId((current) => (current === comment.id ? null : comment.id));
    setEditContent(comment.content);
  };

  const handleSubmitEdit = (commentId: number) => {
    const content = editContent.trim();
    if (!content || isSubmittingEdit) return;
    setIsSubmittingEdit(true);
    void (async () => {
      try {
        const res = await fetch(`${commentsUrl}/${commentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const body: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            extractErrorMessage(body, 'No se pudo editar el comentario')
          );
        }
        setEditingId(null);
        setEditContent('');
        await mutate();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : 'No se pudo editar el comentario'
        );
      } finally {
        setIsSubmittingEdit(false);
      }
    })();
  };

  const handleDelete = (commentId: number) => {
    if (deletingId !== null) return;
    const confirmed = window.confirm(
      '¿Eliminar este comentario? Sus respuestas seguirán visibles.'
    );
    if (!confirmed) return;

    setDeletingId(commentId);
    void (async () => {
      try {
        const res = await fetch(`${commentsUrl}/${commentId}`, {
          method: 'DELETE',
        });
        const body: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            extractErrorMessage(body, 'No se pudo eliminar el comentario')
          );
        }
        await mutate();
      } catch (deleteError) {
        toast.error(
          deleteError instanceof Error
            ? deleteError.message
            : 'No se pudo eliminar el comentario'
        );
      } finally {
        setDeletingId(null);
      }
    })();
  };

  return (
    <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
      {isSignedIn ? (
        <div className="space-y-2">
          <label
            htmlFor={`community-post-${postId}-comment`}
            className="sr-only"
          >
            Escribe un comentario
          </label>
          <textarea
            id={`community-post-${postId}-comment`}
            value={rootContent}
            onChange={(event) => setRootContent(event.target.value)}
            placeholder="Escribe un comentario..."
            rows={2}
            className="
              min-h-[64px] w-full resize-none rounded-xl bg-secondary/30 p-2.5
              text-xs text-foreground
              placeholder:text-muted-foreground
              focus:ring-2 focus:ring-primary/50 focus:outline-none
            "
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitRoot}
              disabled={!rootContent.trim() || isSubmittingRoot}
              className="
                inline-flex items-center gap-1.5 rounded-lg bg-primary px-3
                py-1.5 text-xs font-semibold text-primary-foreground
                transition-colors
                hover:bg-primary/90
                focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              <Send className="size-3" />
              {isSubmittingRoot ? 'Publicando...' : 'Comentar'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Inicia sesión para comentar.
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando comentarios...</p>
      ) : error ? (
        <p className="text-xs text-red-400">
          {error.message || 'No se pudieron cargar los comentarios'}
        </p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todavía no hay comentarios. Sé la primera persona en comentar.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              parentAuthorName={null}
              ancestors={NO_ANCESTORS}
              viewerId={viewerId}
              canModerate={canModerate}
              isSignedIn={Boolean(isSignedIn)}
              openReplyId={openReplyId}
              onToggleReply={handleToggleReply}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              isSubmittingReply={isSubmittingReply}
              onSubmitReply={handleSubmitReply}
              editingId={editingId}
              onToggleEdit={handleToggleEdit}
              editContent={editContent}
              onEditContentChange={setEditContent}
              isSubmittingEdit={isSubmittingEdit}
              onSubmitEdit={handleSubmitEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
