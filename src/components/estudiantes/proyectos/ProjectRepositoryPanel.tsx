'use client';

import { useState } from 'react';

import { Loader2 } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

import { RepositoryExplorer } from '~/components/projects/repository/RepositoryExplorer';

interface ProjectRepositoryPanelProps {
  projectId: number;
  repositoryUrl: string | null;
  /** The owner can link, change or remove the repository. */
  canEdit: boolean;
}

/**
 * The user project's GitHub repository: the owner links it here, and anyone
 * who can see the project browses it with the shared explorer.
 */
export function ProjectRepositoryPanel({
  projectId,
  repositoryUrl: initialUrl,
  canEdit,
}: ProjectRepositoryPanelProps) {
  const [repositoryUrl, setRepositoryUrl] = useState(initialUrl);
  const [draft, setDraft] = useState(initialUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Visitors only see the section once there is something to browse.
  if (!canEdit && !repositoryUrl) return null;

  const saveRepositoryUrl = async (value: string | null) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/repository`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryUrl: value }),
      });
      const data = (await res.json()) as {
        repositoryUrl?: string | null;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo guardar el repositorio');
        return;
      }
      const saved = data.repositoryUrl ?? null;
      setRepositoryUrl(saved);
      setDraft(saved ?? '');
      toast.success(saved ? 'Repositorio vinculado' : 'Repositorio quitado');
    } catch {
      toast.error('No se pudo guardar el repositorio');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="project-repository-title"
      className="mt-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <FaGithub className="size-5 text-primary" />
        <h2
          id="project-repository-title"
          className="text-xl font-bold text-foreground"
        >
          Repositorio
        </h2>
      </div>

      {canEdit ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void saveRepositoryUrl(draft.trim() || null);
          }}
          className="rounded-2xl border border-border/50 bg-card/70 p-4 sm:p-5"
        >
          <label
            htmlFor="project-repository-url"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Link del repositorio de GitHub
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="project-repository-url"
              type="url"
              inputMode="url"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="https://github.com/usuario/repositorio"
              className="
                h-10 w-full rounded-lg border border-border/60 bg-background/60
                px-3 text-sm text-foreground
                placeholder:text-muted-foreground
                focus:border-primary focus:outline-none
              "
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="submit"
                disabled={isSaving || draft.trim() === (repositoryUrl ?? '')}
                className="
                  inline-flex h-10 items-center justify-center gap-1.5 rounded-lg
                  bg-primary px-4 text-sm font-semibold text-[#080c16]
                  transition-colors
                  hover:bg-primary/90
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar
              </button>
              {repositoryUrl ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void saveRepositoryUrl(null)}
                  className="
                    inline-flex h-10 items-center justify-center rounded-lg border
                    border-border/60 px-4 text-sm font-semibold text-foreground
                    transition-colors
                    hover:bg-white/5
                    disabled:opacity-50
                  "
                >
                  Quitar
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Pega el link de un repositorio público para explorarlo aquí mismo.
          </p>
        </form>
      ) : null}

      {repositoryUrl ? (
        <RepositoryExplorer
          key={repositoryUrl}
          source="project"
          projectId={projectId}
          repositoryUrl={repositoryUrl}
        />
      ) : null}
    </section>
  );
}
