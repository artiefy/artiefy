'use client';

import Image from 'next/image';
import Link from 'next/link';

import { StarIcon } from '@heroicons/react/24/solid';
import { Award, BookOpen, Clock, Users } from 'lucide-react';

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

  return (
    <Link
      href={`/estudiantes/programas/${program.id}`}
      aria-disabled={!hasCourses}
      tabIndex={hasCourses ? 0 : -1}
      onClick={(event) => {
        if (!hasCourses) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 ${
        hasCourses
          ? 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
          : 'cursor-not-allowed opacity-80'
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={
            program.coverImageKey && program.coverImageKey !== 'NULL'
              ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
              : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
          }
          alt={program.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={85}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {!hasCourses && (
            <div className="inline-flex items-center rounded-full border border-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-900 uppercase shadow-lg shadow-amber-400/40">
              Muy pronto
            </div>
          )}
          {program.certificationType && (
            <div className="inline-flex items-center rounded-full border border-transparent bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-xs font-medium text-white transition-colors hover:bg-primary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
              {program.certificationType.name}
            </div>
          )}
        </div>

        {/* Top Right Award Icon */}
        <div className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/90">
          <Award className="h-5 w-5 text-white" />
        </div>

        {/* Bottom Info on Image */}
        <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {coursesCount} cursos
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {totalHours}h
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <EnrollmentCount
                programId={parseInt(program.id)}
                displayMode="number-only"
              />
            </span>
          </div>
          <div className="flex items-center gap-1">
            <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <p className="mb-1 text-xs font-medium text-primary">
          {program.category?.name ?? 'Sin categoría'}
        </p>

        {/* Title */}
        <h3
          className="mb-2 line-clamp-2 text-lg leading-tight font-semibold text-foreground transition-colors group-hover:text-primary"
          title={program.title}
        >
          {program.title}
        </h3>

        {/* Description */}
        <p
          className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground"
          title={program.description ?? ''}
        >
          {program.description}
        </p>
      </div>
    </Link>
  );
}
