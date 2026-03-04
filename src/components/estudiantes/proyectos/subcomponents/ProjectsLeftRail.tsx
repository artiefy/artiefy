import { Compass, FolderKanban, Plus, Users } from 'lucide-react';

export type SocialView = 'explorar' | 'mis' | 'colabs';

interface ProjectsLeftRailProps {
  total: number;
  collaborators: number;
  activeView: SocialView;
  onChangeView: (view: SocialView) => void;
  onCreateProject?: () => void;
}

const railItems = [
  { key: 'explorar', label: 'Explorar', icon: Compass },
  { key: 'mis', label: 'Mis proyectos', icon: FolderKanban },
  { key: 'colabs', label: 'Colaboraciones', icon: Users },
] as const;

export function ProjectsLeftRail({
  total,
  collaborators,
  activeView,
  onChangeView,
  onCreateProject,
}: ProjectsLeftRailProps) {
  return (
    <aside
      className={`
      hidden w-56 shrink-0
      lg:block
    `}
    >
      <div className="sticky top-24 space-y-3">
        <button
          type="button"
          onClick={onCreateProject}
          className={`
            group relative flex w-full items-center gap-3 overflow-hidden
            rounded-xl px-4 py-3 text-sm font-semibold text-[#080c16]
            transition-all duration-300
            hover:scale-[1.02] hover:shadow-[0_0_25px_hsl(185_72%_48%/0.35)]
          `}
        >
          <div
            className={`
            absolute inset-0 animate-[shimmerGradient_3s_linear_infinite] bg-gradient-to-r from-primary
            via-cyan-500 to-primary
            bg-[length:200%_100%]
          `}
          />
          <span className="relative flex items-center gap-3">
            <span className="rounded-lg bg-white/20 p-1.5">
              <Plus className="size-4" />
            </span>
            Nuevo proyecto
          </span>
        </button>

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
            <div>
              <p className="text-lg font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">Proyectos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {collaborators}
              </p>
              <p className="text-xs text-muted-foreground">Colabs</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
