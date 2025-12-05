'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightCircleIcon, StarIcon } from '@heroicons/react/24/solid';

import { EnrollmentCount } from '~/components/estudiantes/layout/EnrollmentCount';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '~/components/estudiantes/ui/card';
import { blurDataURL } from '~/lib/blurDataUrl';
import { type Program } from '~/types';

interface StudenProgramProps {
  program: Program;
}

export function StudentProgram({ program }: StudenProgramProps) {
  return (
    <div className="group/card relative m-2 sm:m-2">
      <div className="animate-gradient absolute -inset-1.5 rounded-4xl bg-gradient-to-r from-violet-600 via-violet-400 to-violet-800 opacity-0 blur-[4px] transition duration-500 group-hover/card:opacity-100" />
      <Card className="relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 text-white">
        <CardHeader className="-mb-2">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={
                program.coverImageKey && program.coverImageKey !== 'NULL'
                  ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
                  : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
              }
              alt={program.title}
              fill
              className="rounded-lg object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={85}
              placeholder="blur"
              blurDataURL={blurDataURL}
            />
          </div>
        </CardHeader>

        <CardContent className="flex grow flex-col justify-between space-y-0.5 px-6 sm:space-y-4">
          <div className="flex min-h-[90px] flex-col space-y-2 sm:min-h-[120px] sm:space-y-4">
            <div>
              <h3
                className="text-primary line-clamp-2 text-xs font-bold sm:-mb-2 sm:text-lg"
                title={program.title}
              >
                {program.title}
              </h3>
            </div>
            <div>
              <p
                className="line-clamp-2 text-xs text-gray-300 sm:text-sm"
                title={program.description ?? ''}
              >
                {program.description}
              </p>
            </div>
          </div>

          <div className="-mt-2 flex items-center justify-between space-y-0 sm:-mt-4">
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className="border-primary bg-background text-xs sm:text-sm"
              >
                {program.category?.name ?? 'Sin categoría'}
              </Badge>
            </div>
            <div className="flex items-center">
              <div className="hidden sm:flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon
                    key={index}
                    className={`h-4 w-4 ${
                      index < Math.floor(program.rating ?? 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex sm:hidden">
                <StarIcon className="h-4 w-4 text-yellow-400" />
              </div>
              <span className="ml-1 text-sm font-bold text-yellow-500 sm:text-base">
                {program.rating?.toFixed(1) ?? '0.0'}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="-mt-4 px-6 pt-1 sm:-mt-2 sm:px-6">
          <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex-shrink-0">
              <EnrollmentCount programId={parseInt(program.id)} />
            </div>
            <Button asChild className="w-full flex-shrink-0 sm:w-auto">
              <Link
                href={`/estudiantes/programas/${program.id}`}
                className="group/button bg-secondary relative inline-flex h-7 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-white/20 px-3 text-white active:scale-95 sm:h-10 sm:px-4"
              >
                <p className="text-sm font-bold whitespace-nowrap sm:text-sm">
                  Ver Programa
                </p>
                <ArrowRightCircleIcon className="animate-bounce-right ml-1 size-4 sm:size-5" />
                <div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
                  <div className="relative h-full w-10 bg-white/30" />
                </div>
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
