'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import {
  Bookmark,
  Ellipsis,
  Flame,
  Heart,
  Link2,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import type { CommunityFeedPost, CommunityPostKind } from '../types';

// Same "hace X" formatting `ProjectFeedbackThread.tsx` uses, duplicated
// locally per this codebase's own convention (`ProjectFeedCard.tsx` and
// `ProjectFeedbackThread.tsx` each keep their own copy too — there is no
// shared date-formatting module in this repo yet).
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

const getInitial = (value: string) =>
  value.trim().charAt(0).toUpperCase() || 'U';

const KIND_BADGE: Record<
  Exclude<CommunityPostKind, 'none'>,
  { label: string; icon: typeof Zap; className: string }
> = {
  update: {
    label: 'Actualización',
    icon: Zap,
    className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  },
  milestone: {
    label: 'Hito',
    icon: Flame,
    className: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  },
  request: {
    label: 'Solicitud',
    icon: Users,
    className: 'border-blue-500/30 bg-blue-500/15 text-blue-300',
  },
};

interface CommunityPostCardProps {
  post: CommunityFeedPost;
  // Opens `CreatePostModal` pre-filled with this post's values (edit mode) —
  // the modal itself is mounted once by the parent feed view, not per card.
  onEdit: (post: CommunityFeedPost) => void;
  // Called after a successful delete. `router.refresh()` alone cannot update
  // a list that a client component fetched itself.
  onDeleted?: (postId: number) => void;
}

export function CommunityPostCard({
  post,
  onEdit,
  onDeleted,
}: CommunityPostCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const isAuthor = user?.id === post.author.id;

  const badge = post.kind === 'none' ? null : KIND_BADGE[post.kind];
  const BadgeIcon = badge?.icon;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);

  // Whether the clamped content actually overflows is only measurable on the
  // rendered node, so this effect is a genuine layout measurement (not
  // derivable state) — same pattern as `ProjectFeedCard.tsx`.
  useEffect(() => {
    if (isContentExpanded) return;
    const node = contentRef.current;
    if (!node) return;
    setIsContentOverflowing(node.scrollHeight > node.clientHeight + 1);
  }, [isContentExpanded, post.content]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDelete = async () => {
    if (isDeleting) return;
    const confirmed = window.confirm(
      '¿Eliminar esta publicación? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/community-posts/${post.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? 'No se pudo eliminar la publicación');
      }
      setIsMenuOpen(false);
      router.refresh();
      onDeleted?.(post.id);
    } catch (error) {
      console.error('Error al eliminar publicación:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la publicación'
      );
    } finally {
      setIsDeleting(false);
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
          pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/0
          via-primary/5 to-cyan-500/5 opacity-0 transition-opacity duration-500
          group-hover:opacity-100
        "
      />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative shrink-0">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={post.author.name}
                width={44}
                height={44}
                className="
                size-11 rounded-full object-cover ring-2 ring-primary/20
                transition-all duration-300
                group-hover:ring-primary/40
              "
              />
            ) : (
              <div
                className="
                flex size-11 items-center justify-center rounded-full
                bg-gradient-to-br from-primary/25 to-cyan-500/30
                font-semibold text-primary ring-2 ring-primary/20 transition-all
                duration-300
                group-hover:ring-primary/40
              "
              >
                {getInitial(post.author.name)}
              </div>
            )}
            <span
              className="
              absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border
              border-card bg-emerald-500
            "
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* One line from `sm` up — that is where a long project name
                used to wrap and push the badge/date row down. Below `sm` the
                row wraps on purpose: a phone leaves the project name a
                handful of pixels once the avatar, the author and "publicó en"
                are subtracted, so forcing one line there would truncate it
                away to nothing. `min-w-0` on every ancestor is what lets
                `truncate` work inside these nested flex rows. */}
            <div
              className="
                flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5
                sm:flex-nowrap
              "
            >
              {/* A general post has no project competing for the row, so the
                  author only gets capped when there is one. */}
              <span
                className={
                  post.project
                    ? `
                      max-w-full min-w-0 truncate font-semibold text-foreground
                      sm:max-w-[45%]
                    `
                    : 'min-w-0 truncate font-semibold text-foreground'
                }
              >
                {post.author.name}
              </span>
              {post.project ? (
                <>
                  <span
                    className="
                      shrink-0 text-sm whitespace-nowrap text-muted-foreground
                    "
                  >
                    publicó en
                  </span>
                  <Link
                    href={`/proyectos/${post.project.id}`}
                    title={post.project.name}
                    className="
                      min-w-0 flex-1 truncate bg-gradient-to-r from-primary
                      to-cyan-400 bg-clip-text font-semibold text-transparent
                      hover:underline
                    "
                  >
                    {post.project.name}
                  </Link>
                </>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {badge && BadgeIcon ? (
                <span
                  className={`
                  inline-flex items-center gap-1 rounded-full border
                  px-2.5 py-0.5 text-[10px] font-semibold
                  ${badge.className}
                `}
                >
                  <BadgeIcon className="size-3" />
                  {badge.label}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {isAuthor ? (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Opciones de la publicación"
              className="
                rounded-xl p-2 text-muted-foreground transition-all
                hover:scale-105 hover:bg-secondary/80 hover:text-foreground
              "
            >
              <Ellipsis className="size-4" />
            </button>
            {isMenuOpen ? (
              <div
                role="menu"
                className="
                  absolute right-0 z-20 mt-2 w-40 rounded-xl border
                  border-border/60 bg-card p-1 shadow-xl shadow-black/30
                "
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit(post);
                  }}
                  className="
                    flex w-full items-center gap-2 rounded-lg px-3 py-2
                    text-sm text-foreground transition-colors
                    hover:bg-secondary/80
                  "
                >
                  <Pencil className="size-4 text-primary" />
                  Editar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                  className="
                    flex w-full items-center gap-2 rounded-lg px-3 py-2
                    text-sm text-red-400 transition-colors
                    hover:bg-secondary/80
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  <Trash2 className="size-4" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative mb-4 text-sm leading-relaxed text-foreground">
        <p
          ref={contentRef}
          className={
            isContentExpanded
              ? 'whitespace-pre-wrap'
              : 'line-clamp-3 whitespace-pre-wrap'
          }
        >
          {post.content}
        </p>
        {isContentOverflowing ? (
          <button
            type="button"
            onClick={() => setIsContentExpanded((current) => !current)}
            aria-expanded={isContentExpanded}
            className="
              mt-1 text-xs font-semibold text-primary transition-colors
              hover:text-primary/80
            "
          >
            {isContentExpanded ? 'Ver menos' : 'Ver más'}
          </button>
        ) : null}
      </div>

      {post.linkUrl ? (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            mb-4 inline-flex max-w-full items-center gap-1.5 truncate text-xs
            font-medium text-primary
            hover:underline
          "
        >
          <Link2 className="size-3.5 shrink-0" />
          <span className="truncate">{post.linkUrl}</span>
        </a>
      ) : null}

      {post.imageUrl ? (
        <div
          className="
            group/media relative mb-4 overflow-hidden rounded-xl border
            border-border/50
          "
        >
          <Image
            src={post.imageUrl}
            alt="Imagen de la publicación"
            width={980}
            height={520}
            className="
              h-48 w-full object-cover transition-transform duration-500
              group-hover/media:scale-105
              sm:h-64
            "
          />
          <div
            className="
              absolute inset-0 bg-gradient-to-t from-black/30 to-transparent
              opacity-0 transition-opacity duration-300
              group-hover/media:opacity-100
            "
          />
        </div>
      ) : null}

      {post.project?.needsCollaborators ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <span
            className="
              inline-flex items-center gap-1 rounded-full border
              border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1
              text-[11px] font-semibold text-emerald-300
            "
          >
            <Users className="size-3" />
            Busca colaboradores
          </span>
        </div>
      ) : null}

      {/* No post-level like/comment/save/share tables exist yet (only
          project-level ones, which would corrupt project counts if reused
          here), so every control below is disabled rather than wired to
          fake data or a project endpoint — see apply-progress for the
          rationale. */}
      <div
        className="
          relative flex items-center justify-between border-t
          border-border/50 pt-3
        "
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            title="Los me gusta en publicaciones llegarán pronto"
            className="
              action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
              text-sm font-medium text-muted-foreground/50
            "
          >
            <Heart className="size-5" />
          </button>
          <button
            type="button"
            disabled
            title="Los comentarios en publicaciones llegarán pronto"
            className="
              action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
              text-sm font-medium text-muted-foreground/50
            "
          >
            <MessageCircle className="size-5" />
          </button>
          <button
            type="button"
            disabled
            title="Guardar publicaciones llegará pronto"
            className="
              action-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2
              text-sm font-medium text-muted-foreground/50
            "
          >
            <Bookmark className="size-5" />
          </button>
        </div>
        <button
          type="button"
          disabled
          title="Compartir publicaciones llegará pronto"
          className="rounded-xl p-2 text-muted-foreground/50"
        >
          <Share2 className="size-5" />
        </button>
      </div>
    </article>
  );
}
