'use client';

import {
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  Layers3,
  Rocket,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import { Icons } from '~/components/estudiantes/ui/icons';

import type {
  CatalogResultKind,
  CatalogSearchResult,
} from '~/server/actions/estudiantes/search/searchCatalogPreview';

interface ArtieSearchDropdownProps {
  query: string;
  results: CatalogSearchResult[];
  isLoading: boolean;
  onCreate: () => void;
  onSelect: (result: CatalogSearchResult) => void;
  /** "Modo avanzado": open the project creation modal with the query. */
  onAdvanced: () => void;
  className?: string;
}

const KIND_STYLES: Record<
  CatalogResultKind,
  { label: string; icon: typeof BookOpen; iconClass: string; badge: string }
> = {
  course: {
    label: 'Curso',
    icon: BookOpen,
    iconClass: 'text-primary',
    badge: 'bg-primary/15 text-primary',
  },
  guided: {
    label: 'Proyecto guiado',
    icon: Rocket,
    iconClass: 'text-primary',
    badge: 'bg-cyan-900/40 text-cyan-200/80',
  },
  program: {
    label: 'Programa',
    icon: Layers3,
    iconClass: 'text-primary',
    badge: 'bg-white/10 text-foreground',
  },
};

export function ArtieSearchDropdown({
  query,
  results,
  isLoading,
  onCreate,
  onSelect,
  onAdvanced,
  className = '',
}: ArtieSearchDropdownProps) {
  const trimmed = query.trim();
  const showExplore = trimmed.length >= 2;

  return (
    <div
      className={`
        absolute top-full left-1/2 z-50 mt-2 w-[min(720px,calc(100vw-2rem))]
        -translate-x-1/2 overflow-hidden rounded-xl border border-primary/30
        bg-[#01152d]/95 text-left shadow-2xl backdrop-blur-xl
        ${className}
      `}
    >
      <p
        className="
          px-4 py-2 text-xs font-medium text-muted-foreground uppercase
        "
      >
        Crear con Artie
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="
          flex w-full items-center border-l-2 border-primary bg-primary/10 px-4
          py-3 text-left transition-colors
          hover:bg-primary/15
        "
      >
        <Sparkles className="mr-4 size-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold break-words text-foreground">
            Crear un proyecto: <span className="text-primary">“{trimmed}”</span>
          </span>
          <span className="block text-sm text-muted-foreground">
            Artie te pregunta cómo y lo construye contigo
          </span>
        </span>
        <span
          className="
            ml-3 hidden items-center gap-1 rounded-md border border-primary/40
            px-2 py-1 text-xs text-primary
            sm:flex
          "
        >
          Enter <CornerDownLeft className="size-3" />
        </span>
      </button>

      {showExplore && (
        <div className="border-t border-border/50 px-4 pt-4 pb-2">
          <p
            className="
              mb-2 text-xs font-medium text-muted-foreground uppercase
            "
          >
            O explora lo que ya existe
          </p>

          {isLoading && results.length === 0 ? (
            <div
              className="
                flex items-center gap-2 px-1 py-3 text-sm text-muted-foreground
              "
            >
              <Icons.spinner className="size-4" />
              Buscando cursos, proyectos y programas…
            </div>
          ) : results.length === 0 ? (
            <p className="px-1 py-3 text-sm text-muted-foreground">
              No encontramos coincidencias. Crea tu proyecto con Artie.
            </p>
          ) : (
            <div
              className="
                max-h-[32vh] space-y-1 overflow-y-auto
                md:max-h-[50vh]
              "
            >
              {results.map((result) => {
                const style = KIND_STYLES[result.kind];
                const Icon = style.icon;

                return (
                  <button
                    key={`${result.kind}-${result.id}`}
                    type="button"
                    disabled={result.isComingSoon}
                    onClick={() => onSelect(result)}
                    className="
                      flex w-full items-center gap-4 rounded-md px-1 py-2.5
                      text-left transition-colors
                      hover:bg-white/5
                      disabled:cursor-default disabled:opacity-60
                      disabled:hover:bg-transparent
                    "
                  >
                    <Icon className={`size-5 shrink-0 ${style.iconClass}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">
                        {result.title}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {result.isComingSoon ? 'Próximamente' : result.meta}
                      </span>
                    </span>
                    <span
                      className={`
                        shrink-0 rounded-md px-2 py-1 text-xs font-medium
                        ${style.badge}
                      `}
                    >
                      {style.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onAdvanced}
        className="
          flex w-full items-center gap-4 border-t border-border/50 px-4 py-3
          text-left transition-colors
          hover:bg-white/5
          focus-visible:bg-white/5 focus-visible:outline-none
        "
      >
        <SlidersHorizontal className="size-5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-foreground">
            Modo avanzado
          </span>
          <span className="block text-sm text-muted-foreground">
            Define cada paso de tu proyecto tú mismo
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-primary" />
      </button>
    </div>
  );
}
