'use client';

import Image from 'next/image';
import Link from 'next/link';

import { DollarSign, Pen, Send, Users } from 'lucide-react';

import type { ProjectSocialItem } from '../types';

interface ProjectWorkspaceCardProps {
  item: ProjectSocialItem;
  onEdit: (item: ProjectSocialItem) => void;
  publishHref: string;
}

const stageBadgeClass: Record<ProjectSocialItem['stage'], string> = {
  Idea: 'border-purple-500/30 bg-purple-500/20 text-purple-400',
  MVP: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
  'En progreso': 'border-amber-500/30 bg-amber-500/20 text-amber-400',
  Lanzado: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
};

export function ProjectWorkspaceCard({
  item,
  onEdit,
  publishHref,
}: ProjectWorkspaceCardProps) {
  const progress = Math.max(0, Math.min(100, item.progressPercentage ?? 0));

  return (
    <article
      className={`
        rounded-2xl border border-border bg-card p-4 transition-all duration-300
        hover:border-primary/30
      `}
    >
      <div className="flex gap-4">
        <div
          className={`
            size-20 shrink-0 overflow-hidden rounded-xl
            sm:size-24
          `}
        >
          {item.coverImageUrl ? (
            <Image
              src={item.coverImageUrl}
              alt={item.title}
              width={160}
              height={160}
              className={`
                size-full object-cover transition-transform duration-300
                group-hover:scale-105
              `}
            />
          ) : (
            <div
              className={`
                flex size-full items-center justify-center bg-[#1A2333] text-xs
                text-muted-foreground
              `}
            >
              Sin portada
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
            <span
              className={`
                shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium
                ${stageBadgeClass[item.stage]}
              `}
            >
              {item.stage}
            </span>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium text-primary">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A2333]">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip px-2 py-0.5 text-[10px]">
              {item.category.name}
            </span>
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={`${item.id}-${tag}`}
                className="chip px-2 py-0.5 text-[10px]"
              >
                {tag}
              </span>
            ))}
            {item.needsCollaborators ? (
              <span
                className={`
                  inline-flex items-center gap-1 rounded-full bg-emerald-500/20
                  px-2 py-0.5 text-[10px] font-medium text-emerald-400
                `}
              >
                <Users className="size-2.5" />
              </span>
            ) : null}
            <span
              className={`
                inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2
                py-0.5 text-[10px] font-medium text-amber-400
              `}
            >
              <DollarSign className="size-2.5" />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <Link
          href={publishHref}
          className={`
            flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary
            px-3 py-1.5 text-xs font-medium text-[#080c16] transition-colors
            hover:bg-primary/90
          `}
        >
          <Send className="size-3.5" />
          Publicar avance
        </Link>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className={`
            flex items-center gap-2 rounded-lg bg-[#1A2333] px-3 py-1.5 text-xs
            font-medium text-foreground transition-colors
            hover:bg-[#1A2333]/80
          `}
        >
          <Pen className="size-3.5" />
          Editar
        </button>
      </div>
    </article>
  );
}
