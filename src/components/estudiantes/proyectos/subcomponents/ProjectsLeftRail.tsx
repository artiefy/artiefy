'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Bookmark,
  ChevronDown,
  Compass,
  FolderKanban,
  Plus,
  UserCheck,
  Users,
} from 'lucide-react';

import { CreateMenuOptions } from './CreateMenuOptions';

export type SocialView =
  'explorar' | 'mis' | 'colabs' | 'favoritos' | 'seguidos';

interface ProjectsLeftRailProps {
  favorites: number;
  following: number;
  activeView: SocialView;
  onChangeView: (view: SocialView) => void;
  onCreateProject?: () => void;
  onCreatePost?: () => void;
}

const railItems = [
  { key: 'explorar', label: 'Explorar', icon: Compass },
  { key: 'mis', label: 'Mis proyectos', icon: FolderKanban },
  { key: 'colabs', label: 'Colaboraciones', icon: Users },
  { key: 'favoritos', label: 'Favoritos', icon: Bookmark },
  { key: 'seguidos', label: 'Proyectos que sigo', icon: UserCheck },
] as const;

export function ProjectsLeftRail({
  favorites,
  following,
  activeView,
  onChangeView,
  onCreateProject,
  onCreatePost,
}: ProjectsLeftRailProps) {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCreateMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCreateMenuOpen(false);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (!createMenuRef.current?.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreateMenuOpen]);

  return (
    <aside
      className={`
        hidden w-56 shrink-0
        lg:block
      `}
    >
      <div className="sticky top-24 space-y-3">
        <div ref={createMenuRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isCreateMenuOpen}
            onClick={() => setIsCreateMenuOpen((prev) => !prev)}
            className={`
              group relative flex w-full items-center gap-3 overflow-hidden
              rounded-xl px-4 py-3 text-sm font-semibold text-[#080c16]
              transition-all duration-300
              hover:scale-[1.02] hover:shadow-[0_0_25px_hsl(185_72%_48%/0.35)]
            `}
          >
            <div
              className={`
                absolute inset-0 animate-[shimmerGradient_3s_linear_infinite]
                bg-gradient-to-r from-primary via-cyan-500 to-primary
                bg-[length:200%_100%]
              `}
            />
            <span className="relative flex items-center gap-3">
              <span className="rounded-lg bg-white/20 p-1.5">
                <Plus className="size-4" />
              </span>
              Crear
            </span>
            {/* Points down when closed, up when open, so the control reads as
                a menu rather than a plain button. */}
            <ChevronDown
              aria-hidden="true"
              className={`
                relative ml-auto size-4 transition-transform duration-200
                ${isCreateMenuOpen ? 'rotate-180' : ''}
              `}
            />
          </button>

          {isCreateMenuOpen ? (
            <div
              role="menu"
              aria-label="Crear"
              className={`
                animate-in fade-in slide-in-from-top-2 absolute top-full
                right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border
                border-border/50 bg-card shadow-xl duration-200
              `}
            >
              <CreateMenuOptions
                onSelectProject={() => {
                  setIsCreateMenuOpen(false);
                  onCreateProject?.();
                }}
                onSelectPost={() => {
                  setIsCreateMenuOpen(false);
                  onCreatePost?.();
                }}
              />
            </div>
          ) : null}
        </div>

        <div
          className={`
            h-px bg-gradient-to-r from-transparent via-border to-transparent
          `}
        />

        <nav className="space-y-1">
          {railItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onChangeView(item.key)}
              className={`
                relative flex w-full items-center gap-3 rounded-xl px-4 py-3
                text-sm font-medium transition-all duration-300
                ${
                  activeView === item.key
                    ? 'text-[#080c16]'
                    : `
                      text-muted-foreground
                      hover:bg-[#1A2333]/50 hover:text-foreground
                    `
                }
              `}
            >
              {activeView === item.key ? (
                <div
                  className={`
                    absolute inset-0 rounded-xl bg-gradient-to-r from-primary/90
                    to-cyan-500/90 shadow-[0_0_20px_hsl(185_72%_48%/0.25)]
                  `}
                />
              ) : null}
              <span className="relative flex items-center gap-3">
                <span
                  className={`
                    rounded-lg p-1.5
                    ${
                      activeView === item.key
                        ? 'bg-white/20'
                        : 'bg-[#1A2333]/50'
                    }
                  `}
                >
                  <item.icon className="size-4" />
                </span>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="rounded-xl border border-border/50 bg-[#1A2333]/30 p-4">
          <p className="mb-2 text-xs text-muted-foreground">Tu actividad</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <button
              type="button"
              onClick={() => onChangeView('favoritos')}
              className="
                rounded-lg p-2 transition-colors
                hover:bg-[#1A2333]/60
              "
            >
              <p className="text-lg font-bold text-foreground">{favorites}</p>
              <p className="text-xs text-muted-foreground">Favoritos</p>
            </button>
            <button
              type="button"
              onClick={() => onChangeView('seguidos')}
              className="
                rounded-lg p-2 transition-colors
                hover:bg-[#1A2333]/60
              "
            >
              <p className="text-lg font-bold text-foreground">{following}</p>
              <p className="text-xs text-muted-foreground">Seguidos</p>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
