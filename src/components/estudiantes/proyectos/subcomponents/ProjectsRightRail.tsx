import Image from 'next/image';
import Link from 'next/link';

import { Flame, Sparkles, Users, Zap } from 'lucide-react';

import type { ProjectSocialCollaborator, ProjectSocialItem } from '../types';
import type { LucideIcon } from 'lucide-react';

interface ProjectsRightRailProps {
  trending: ProjectSocialItem[];
  collaborators: ProjectSocialCollaborator[];
}

export function ProjectsRightRail({
  trending,
  collaborators,
}: ProjectsRightRailProps) {
  const spacesActions: Array<{ label: string; icon: LucideIcon }> = [
    { label: 'Comunidad', icon: Sparkles },
    { label: 'Mentorías', icon: Users },
    { label: 'Foros', icon: Flame },
  ];

  return (
    <aside
      className="
        hidden w-80 shrink-0
        xl:block
      "
    >
      <div className="sticky top-24 space-y-4">
        <div
          className="
            glass-panel relative overflow-hidden rounded-2xl border
            border-border/50 bg-card/60 p-4
          "
        >
          <div
            className="
              absolute top-0 right-0 size-32 bg-gradient-to-br
              from-orange-500/10 to-rose-500/10 blur-3xl
            "
          />
          <div className="relative mb-4 flex items-center gap-2">
            <span
              className="
                rounded-xl bg-gradient-to-r from-orange-500/20 to-rose-500/20
                p-2
              "
            >
              <Flame className="size-5 text-orange-400" />
            </span>
            <h3 className="font-bold text-foreground">Trending ahora</h3>
          </div>
          <div className="space-y-2">
            {trending.slice(0, 5).map((project, index) => (
              <Link
                key={project.id}
                href={`/proyectos/${project.id}`}
                className="
                  group flex items-start gap-3 rounded-xl p-3 transition-all
                  duration-300
                  hover:bg-[#1A2333]/60
                "
              >
                <div
                  className="
                    flex size-7 shrink-0 items-center justify-center rounded-lg
                    bg-gradient-to-br from-amber-400 to-yellow-500 text-xs
                    font-bold text-black
                  "
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate text-sm font-semibold text-foreground
                      group-hover:text-primary
                    "
                  >
                    {project.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {project.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div
          className="
            glass-panel relative overflow-hidden rounded-2xl border
            border-border/50 bg-card/60 p-4
          "
        >
          <div
            className="
              absolute top-0 right-0 size-32 bg-gradient-to-br
              from-emerald-500/10 to-teal-500/10 blur-3xl
            "
          />
          <div className="relative mb-4 flex items-center gap-2">
            <span
              className="
                rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20
                p-2
              "
            >
              <Users className="size-5 text-emerald-400" />
            </span>
            <h3 className="font-bold text-foreground">Buscan colaboradores</h3>
          </div>
          <div className="space-y-2">
            {collaborators.length > 0 ? (
              collaborators.slice(0, 4).map((collaborator) => (
                <Link
                  key={collaborator.userId}
                  href={`/proyectos/colaboradores/${collaborator.userId}`}
                  className={`
                    group block cursor-pointer rounded-xl border
                    border-transparent bg-gradient-to-r from-[#1A2333]/50
                    to-[#1A2333]/30 p-3 transition-all duration-300
                    hover:border-emerald-500/30 hover:from-emerald-500/10
                    hover:to-teal-500/10
                  `}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Image
                      src={
                        collaborator.imageUrl ??
                        `https://i.pravatar.cc/150?u=${collaborator.userId}`
                      }
                      alt={collaborator.name}
                      width={28}
                      height={28}
                      className={`
                        size-7 rounded-full ring-2 ring-emerald-500/20
                        transition-all
                        group-hover:ring-emerald-500/40
                      `}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {collaborator.name}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p
                className="
                  rounded-xl bg-[#1A2333]/30 p-3 text-xs text-muted-foreground
                "
              >
                No hay colaboradores visibles por ahora.
              </p>
            )}
          </div>
        </div>

        <div
          className="
            glass-panel relative overflow-hidden rounded-2xl border
            border-border/50 bg-card/60 p-4
          "
        >
          <div
            className="
              absolute top-0 right-0 size-32 bg-gradient-to-br from-primary/10
              to-cyan-500/10 blur-3xl
            "
          />
          <div className="relative mb-4 flex items-center gap-2">
            <span
              className="
                rounded-xl bg-gradient-to-r from-primary/20 to-cyan-500/20 p-2
              "
            >
              <Zap className="size-5 text-primary" />
            </span>
            <h3 className="font-bold text-foreground">Espacios Artiefy</h3>
          </div>
          <div className="space-y-2 text-sm">
            {spacesActions.map((action) => (
              <button
                key={action.label}
                className="
                  flex w-full items-center gap-3 rounded-xl p-3 text-left
                  transition-colors
                  hover:bg-[#1A2333]/60
                "
              >
                <span className="rounded-xl bg-[#1A2333]/70 p-2">
                  <action.icon className="size-4 text-primary" />
                </span>
                <span className="font-medium text-foreground">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
