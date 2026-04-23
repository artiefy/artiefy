'use client';

import Image from 'next/image';
import Link from 'next/link';

import { StarIcon } from '@heroicons/react/24/solid';
import { BookOpen, Clock, Users } from 'lucide-react';

import { EnrollmentCount } from '~/components/estudiantes/layout/EnrollmentCount';
import { blurDataURL } from '~/lib/blurDataUrl';
import { type Program } from '~/types';

interface StudenProgramProps {
  program: Program;
}

export function StudentProgram({ program }: StudenProgramProps) {
  const coursesCount = program.coursesCount ?? 0;
  const totalHours = program.totalHours ?? 0;
  const rating = program.rating ?? 0;
  const hasCourses = coursesCount > 0;
  const programImage =
    program.coverImageKey && program.coverImageKey !== 'NULL'
      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
      : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';

  const containerClassName = `group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 ${
    hasCourses
      ? 'opacity-0 animate-fade-up hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.15)]'
      : 'cursor-not-allowed opacity-75'
  }`;

  const cardContent = (
    <>
      <div className="relative h-40 overflow-hidden">
        <Image
          src={programImage}
          alt={program.title}
          fill
          className="
            size-full object-cover transition-transform duration-500
            group-hover:scale-110
          "
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={85}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
        <div
          className="
          absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent
        "
        />

        <div className="absolute top-3 left-3 flex gap-2">
          {!hasCourses && (
            <span
              className="
              rounded-full border border-amber-300/30 bg-amber-400 px-3 py-1
              text-[11px] font-semibold text-slate-950 shadow-sm
            "
            >
              Muy pronto
            </span>
          )}
        </div>

        {program.certificationType && (
          <span
            className="
            absolute bottom-3 left-3 rounded-full border border-primary/30
            bg-primary/20 px-3 py-1 text-[11px] font-semibold text-primary
            backdrop-blur-sm
          "
          >
            {program.certificationType.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className="
            line-clamp-2 text-base leading-snug font-bold text-foreground
            transition-colors duration-200
            group-hover:text-primary
          "
          title={program.title}
        >
          {program.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5 text-primary/60" />
            {coursesCount} cursos
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-primary/60" />
            {totalHours}h
          </span>
        </div>

        <p
          className="line-clamp-2 min-h-10 text-sm text-muted-foreground"
          title={program.description ?? ''}
        >
          {program.description ??
            'Explora este programa y descubre su ruta de aprendizaje.'}
        </p>

        <div
          className="
          mt-auto flex items-center justify-between pt-2 text-xs
          text-muted-foreground
        "
        >
          <span className="flex items-center gap-1">
            <Users className="size-3.5 text-primary/60" />
            <EnrollmentCount
              programId={parseInt(program.id)}
              displayMode="number-only"
            />
            {' estudiantes'}
          </span>

          <div className="flex items-end gap-2">
            <div
              className="
              flex size-8 items-center justify-center overflow-hidden
              rounded-full border border-border/60 bg-secondary/40
            "
            >
              <Image
                src="/artiefy-logo2.png"
                alt="Artiefy"
                width={24}
                height={24}
                className="size-6 object-contain opacity-90"
              />
            </div>
            <span
              className="
              flex items-center gap-1 font-semibold text-[hsl(45,100%,60%)]
            "
            >
              <StarIcon
                className="
                size-3.5 fill-[hsl(45,100%,60%)] text-[hsl(45,100%,60%)]
              "
              />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  if (hasCourses) {
    return (
      <Link
        href={`/estudiantes/programas/${program.id}`}
        className={containerClassName}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={containerClassName} aria-disabled>
      {cardContent}
    </div>
  );
}
