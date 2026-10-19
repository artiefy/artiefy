import Image from 'next/image';
import Link from 'next/link';

import { getWorkHref } from '../projectHrefs';

import type { ProjectSocialItem } from '../types';

const STAGE_BADGE_CLASS: Record<ProjectSocialItem['stage'], string> = {
  Idea: 'text-purple-300 ring-purple-400/45',
  MVP: 'text-blue-300 ring-blue-400/45',
  'En progreso': 'text-amber-300 ring-amber-400/45',
  Lanzado: 'text-emerald-300 ring-emerald-400/45',
};

const clampProgress = (value: number | undefined) =>
  Math.min(Math.max(Math.round(value ?? 0), 0), 100);

/** One project in the `/proyectos` grid: cover, progress and stage. */
export function ProjectHomeCard({ item }: { item: ProjectSocialItem }) {
  const progress = clampProgress(item.progressPercentage);

  return (
    <Link
      href={getWorkHref(item)}
      aria-label={`Abrir ${item.title}`}
      className="
        group relative flex w-full flex-col rounded-2xl text-left
        focus:outline-none
        focus-visible:ring-2 focus-visible:ring-ring/60
      "
    >
      <div
        className="
          relative h-40 overflow-hidden rounded-2xl ring-1 ring-white/10
          transition-[box-shadow,--tw-ring-color] duration-300
          group-hover:shadow-[0_8px_40px_-8px_hsl(198_100%_62%/0.45)]
          group-hover:ring-neon/60
          sm:h-44
        "
      >
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="
              object-cover transition-transform duration-500 ease-out
              group-hover:scale-[1.06]
            "
          />
        ) : (
          // Generic cover: the white Artiefy "A" on the brand's dark blue. The
          // icon is dark on white, so it is inverted and screened onto the
          // blue, which leaves only the white letter.
          <div aria-hidden="true" className="relative size-full bg-[#01142B]">
            <Image
              src="/artiefy-icon.png"
              alt=""
              fill
              sizes="160px"
              className="object-contain p-8 mix-blend-screen invert"
            />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute right-0 bottom-0 left-0 z-10 h-[3px] bg-white/10"
        >
          <div
            className="
              relative h-full bg-neon
              shadow-[0_0_8px_1px_hsl(198_100%_62%/0.9),0_0_16px_4px_hsl(198_100%_62%/0.35)]
            "
            style={{ width: `${progress}%` }}
          />
        </div>
        <span
          className="
            absolute right-2.5 bottom-2.5 z-20 text-[14px] font-bold
            tracking-tight text-[rgb(71,231,245)] tabular-nums
            [text-shadow:rgba(4,8,16,0.85)_0_1px_6px,rgba(4,8,16,0.5)_0_0_3px]
          "
        >
          <span className="sr-only">Progreso: </span>
          {progress}%
        </span>

        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0 bg-gradient-to-t
            from-background/60 via-transparent to-transparent opacity-0
            transition-opacity duration-300
            group-hover:opacity-100
          "
        />
        <span
          className={`
            absolute top-2 right-2 z-20 inline-flex items-center rounded-full
            bg-background/45 px-2.5 py-0.5 text-[10px] font-semibold ring-1
            backdrop-blur-md ring-inset
            ${STAGE_BADGE_CLASS[item.stage]}
          `}
        >
          {item.stage}
        </span>
      </div>

      <div className="px-0.5 pt-3">
        <h3
          className="
            truncate font-semibold text-foreground transition-colors
            duration-300
            group-hover:text-neon
          "
        >
          {item.title}
        </h3>
        <p
          className="
            mt-1 line-clamp-2 text-sm text-muted-foreground transition-colors
            duration-300
            group-hover:text-foreground/70
          "
        >
          {item.description}
        </p>
      </div>
    </Link>
  );
}
