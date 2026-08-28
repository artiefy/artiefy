'use client';

import { FileText, Layers } from 'lucide-react';

interface CreateMenuOptionsProps {
  onSelectProject: () => void;
  onSelectPost: () => void;
  className?: string;
}

/**
 * The two "Crear" choices, shared verbatim by the desktop dropdown
 * (`ProjectsLeftRail`) and the mobile bottom sheet (`MobileCreateSheet`) so
 * copy, icons, and behavior never drift between them.
 */
export function CreateMenuOptions({
  onSelectProject,
  onSelectPost,
  className = '',
}: CreateMenuOptionsProps) {
  return (
    <div className={className}>
      <button
        type="button"
        role="menuitem"
        onClick={onSelectProject}
        className="
          flex w-full items-center gap-3 px-4 py-3 text-left text-sm
          font-medium text-foreground transition-colors
          hover:bg-secondary/50
        "
      >
        <div className="rounded-lg bg-primary/15 p-1.5">
          <Layers className="size-4 text-primary" />
        </div>
        <div className="text-left">
          <span className="block">Proyecto</span>
          <span className="text-[11px] text-muted-foreground">
            Crea un nuevo proyecto completo
          </span>
        </div>
      </button>

      <div className="mx-3 h-px bg-border/50" />

      <button
        type="button"
        role="menuitem"
        onClick={onSelectPost}
        className="
          flex w-full items-center gap-3 px-4 py-3 text-left text-sm
          font-medium text-foreground transition-colors
          hover:bg-secondary/50
        "
      >
        <div className="rounded-lg bg-accent/15 p-1.5">
          <FileText className="size-4 text-accent" />
        </div>
        <div className="text-left">
          <span className="block">Post</span>
          <span className="text-[11px] text-muted-foreground">
            Comparte una actualización
          </span>
        </div>
      </button>
    </div>
  );
}
