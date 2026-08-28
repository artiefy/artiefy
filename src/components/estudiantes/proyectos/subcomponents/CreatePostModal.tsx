'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  ChevronDown,
  Flame,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Link2,
  Search,
  Send,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';

import type { CommunityFeedPost } from '../types';
import type { PublishableProject } from '~/server/actions/project/getPublishableProjects';

type PostKind = 'none' | 'update' | 'milestone' | 'request';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  // When set, the modal edits this post instead of creating a new one
  // (pre-filled fields, saved via `PATCH /api/community-posts/[id]`).
  editingPost?: CommunityFeedPost | null;
}

const KIND_OPTIONS: Array<{
  value: PostKind;
  label: string;
  icon?: typeof Zap;
}> = [
  { value: 'none', label: 'Ninguno' },
  { value: 'update', label: 'Actualización', icon: Zap },
  { value: 'milestone', label: 'Hito', icon: Flame },
  { value: 'request', label: 'Solicitud', icon: Users },
];

const GENERAL_LABEL = 'Proyectos (publicación general)';

/**
 * "Crear publicación" modal for the `/proyectos` community feed. Opened from
 * the desktop "Crear" dropdown and the mobile bottom-sheet (create mode) or
 * from a post's own "..." menu (edit mode, via `editingPost`).
 * `Previsualizar` doesn't publish directly — it opens a preview dialog; the
 * actual write only happens when the user confirms `Publicar` there.
 */
export function CreatePostModal({
  isOpen,
  onClose,
  editingPost = null,
}: CreatePostModalProps) {
  const router = useRouter();
  const isEditing = Boolean(editingPost);

  const [content, setContent] = useState('');
  const [kind, setKind] = useState<PostKind>('none');
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [projects, setProjects] = useState<PublishableProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<PublishableProject | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState('');

  // Fresh state on every open — mirrors the `isOpen`-keyed reset effect
  // `ModalResumen` uses so a previous draft never leaks into the next open.
  // In edit mode, pre-fills from `editingPost` instead of resetting to blank.
  useEffect(() => {
    if (!isOpen) return;

    if (editingPost) {
      setContent(editingPost.content);
      setKind(editingPost.kind);
      setLinkUrl(editingPost.linkUrl ?? '');
      setIsLinkInputOpen(Boolean(editingPost.linkUrl));
      setImageKey(editingPost.imageKey);
      setImageFileName(editingPost.imageKey ? 'Imagen actual' : null);
      setImagePreviewUrl(editingPost.imageUrl ?? null);
      setSelectedProject(
        editingPost.project
          ? {
              id: editingPost.project.id,
              name: editingPost.project.name,
              isOwner: true,
            }
          : null
      );
    } else {
      setContent('');
      setKind('none');
      setLinkUrl('');
      setIsLinkInputOpen(false);
      setImageKey(null);
      setImageFileName(null);
      setImagePreviewUrl(null);
      setSelectedProject(null);
    }
    setIsSelectorOpen(false);
    setProjectQuery('');
    setIsPreviewOpen(false);
  }, [isOpen, editingPost]);

  // Revokes the previous blob preview URL whenever it's replaced or the
  // modal unmounts. Never touches a real (non-blob) URL from `editingPost`.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingProjects(true);
    fetch('/api/community-posts/publishable-projects')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar los proyectos');
        return res.json() as Promise<PublishableProject[]>;
      })
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((error) => {
        console.error('Error al cargar proyectos publicables:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProjects(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const filteredProjects = useMemo(() => {
    const normalized = projectQuery.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(normalized)
    );
  }, [projectQuery, projects]);

  const destinationLabel = selectedProject?.name ?? GENERAL_LABEL;

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    setImageFileName(file.name);

    setIsUploadingImage(true);
    try {
      // Uploaded through the server (not a browser->S3 presigned POST): that
      // cross-origin request fails with a bare `TypeError: Failed to fetch`
      // whenever the bucket's CORS policy doesn't allow it.
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/community-posts/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? 'No se pudo subir la imagen');
      }

      const data = (await res.json()) as { key: string };
      setImageKey(data.key);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo subir la imagen. Inténtalo de nuevo.'
      );
      setImageKey(null);
      setImageFileName(null);
      setImagePreviewUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageKey(null);
    setImageFileName(null);
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const openPreview = () => {
    if (!content.trim() || isSubmitting) return;
    setIsPreviewOpen(true);
  };

  const handlePublish = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        editingPost
          ? `/api/community-posts/${editingPost.id}`
          : '/api/community-posts',
        {
          method: editingPost ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: trimmedContent,
            kind,
            projectId: selectedProject?.id,
            imageKey: imageKey ?? undefined,
            linkUrl: linkUrl.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          data?.error ??
            (isEditing
              ? 'No se pudo editar la publicación'
              : 'No se pudo crear la publicación')
        );
      }

      setIsPreviewOpen(false);
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error al publicar:', error);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo publicar'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar publicación' : 'Crear publicación'}
            </DialogTitle>
            <DialogDescription>
              Comparte un avance, hito o solicitud con la comunidad
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
            >
              Tú
            </span>
            <span className="text-sm font-medium text-foreground">Tú</span>

            <div className="relative ml-auto">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isSelectorOpen}
                onClick={() => setIsSelectorOpen((prev) => !prev)}
                className="
                  flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5
                  text-xs font-medium text-foreground transition-colors
                  hover:bg-secondary
                "
              >
                <Globe className="size-3.5 text-muted-foreground" />
                <span className="max-w-40 truncate">
                  Publicando en {destinationLabel}
                </span>
                <ChevronDown
                  className={`
                    size-3.5 text-muted-foreground transition-transform
                    ${isSelectorOpen ? 'rotate-180' : ''}
                  `}
                />
              </button>

              {isSelectorOpen ? (
                <div
                  role="menu"
                  aria-label="Elegir dónde publicar"
                  className="
                    absolute top-full right-0 z-10 mt-2 w-72 overflow-hidden
                    rounded-xl border border-border/50 bg-card shadow-xl
                  "
                >
                  <div className="border-b border-border/50 p-2">
                    <div className="relative">
                      <Search
                        className={`
                          absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2
                          text-muted-foreground
                        `}
                      />
                      <input
                        type="text"
                        value={projectQuery}
                        onChange={(event) =>
                          setProjectQuery(event.target.value)
                        }
                        placeholder="Buscar proyecto..."
                        className="
                          w-full rounded-lg bg-secondary/40 py-1.5 pr-2 pl-8
                          text-xs text-foreground
                          placeholder:text-muted-foreground
                          focus:outline-none
                        "
                      />
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSelectedProject(null);
                        setIsSelectorOpen(false);
                      }}
                      className="
                        flex w-full items-center gap-2 px-3 py-2 text-left
                        text-sm text-foreground transition-colors
                        hover:bg-secondary/50
                      "
                    >
                      <Globe className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{GENERAL_LABEL}</span>
                    </button>

                    {isLoadingProjects ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        Cargando proyectos...
                      </p>
                    ) : (
                      filteredProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSelectedProject(project);
                            setIsSelectorOpen(false);
                          }}
                          className="
                            flex w-full items-center gap-2 px-3 py-2 text-left
                            text-sm text-foreground transition-colors
                            hover:bg-secondary/50
                          "
                        >
                          <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {KIND_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                aria-pressed={kind === option.value}
                className={`
                  flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs
                  font-medium transition-colors
                  ${
                    kind === option.value
                      ? 'bg-primary text-[#080c16]'
                      : `
                        bg-secondary/50 text-muted-foreground
                        hover:text-foreground
                      `
                  }
                `}
              >
                {option.icon ? <option.icon className="size-3.5" /> : null}
                {option.label}
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="¿Qué quieres compartir con la comunidad?"
            className="
              min-h-[120px] w-full resize-none rounded-xl bg-secondary/30 p-3
              text-sm text-foreground
              placeholder:text-muted-foreground
              focus:ring-2 focus:ring-primary/50 focus:outline-none
            "
          />

          {imageFileName ? (
            <div
              className={`
                flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2
                text-xs text-muted-foreground
              `}
            >
              <ImageIcon className="size-3.5 shrink-0" />
              <span className="truncate">{imageFileName}</span>
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Quitar imagen"
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null}

          {isLinkInputOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://..."
                className="
                  w-full rounded-lg bg-secondary/30 px-3 py-2 text-sm
                  text-foreground
                  placeholder:text-muted-foreground
                  focus:ring-2 focus:ring-primary/50 focus:outline-none
                "
              />
              <button
                type="button"
                onClick={() => {
                  setLinkUrl('');
                  setIsLinkInputOpen(false);
                }}
                aria-label="Quitar enlace"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          <div
            className={`
              flex items-center justify-between border-t border-border/50 pt-4
            `}
          >
            <div className="flex items-center gap-2">
              <label
                className={`
                  flex cursor-pointer items-center gap-1.5 rounded-lg p-2
                  text-muted-foreground transition-colors
                  hover:bg-secondary/50 hover:text-foreground
                  aria-disabled:pointer-events-none aria-disabled:opacity-50
                `}
                aria-disabled={isUploadingImage}
              >
                <ImageIcon className="size-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setIsLinkInputOpen((prev) => !prev)}
                aria-pressed={isLinkInputOpen}
                aria-label="Adjuntar enlace"
                className={`
                  rounded-lg p-2 text-muted-foreground transition-colors
                  hover:bg-secondary/50 hover:text-foreground
                `}
              >
                <Link2 className="size-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={openPreview}
              disabled={!content.trim() || isSubmitting || isUploadingImage}
              className={`
                rounded-lg bg-primary px-4 py-2 text-sm font-semibold
                text-[#080c16] transition-colors
                hover:bg-primary/90
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              Previsualizar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          if (!open) setIsPreviewOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Previsualizar publicación</DialogTitle>
            <DialogDescription>
              Revisa cómo se verá tu post antes de publicarlo
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
            >
              Tú
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Tú</p>
              {selectedProject ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderKanban className="size-3.5 shrink-0" />
                  <span>
                    Publicando en{' '}
                    <span
                      className={`
                        bg-gradient-to-r from-primary to-cyan-400 bg-clip-text
                        font-semibold text-transparent
                      `}
                    >
                      {selectedProject.name}
                    </span>
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <p className="text-sm whitespace-pre-wrap text-foreground">
            {content}
          </p>

          {imagePreviewUrl ? (
            <div
              className={`
                relative h-56 w-full overflow-hidden rounded-xl border
                border-border/50
              `}
            >
              <Image
                src={imagePreviewUrl}
                alt="Vista previa de la imagen"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className={`
                rounded-lg border border-border/60 px-4 py-2 text-sm
                font-semibold text-foreground transition-colors
                hover:bg-secondary/50
              `}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className={`
                inline-flex items-center justify-center gap-2 rounded-lg
                bg-primary px-4 py-2 text-sm font-semibold text-[#080c16]
                transition-colors
                hover:bg-primary/90
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              <Send className="size-4" />
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
