'use client';

import Image from 'next/image';
import Link from 'next/link';

import { StarIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';

import { EnrollmentCount } from '~/components/estudiantes/layout/EnrollmentCount';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardFooter,
} from '~/components/estudiantes/ui/card';
import { blurDataURL } from '~/lib/blurDataUrl';
import { type Program } from '~/types';

interface StudenProgramProps {
	program: Program;
}

export function StudentProgram({ program }: StudenProgramProps) {
	return (
		<div className="group relative mx-3">
			<div className="absolute -inset-1.5 animate-gradient rounded-lg bg-gradient-to-r from-violet-600 via-violet-400 to-violet-800 opacity-0 blur-[4px] transition duration-500 group-hover:opacity-100" />
			<Card className="relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 text-white">
				<CardHeader className="px-6">
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

				<CardContent className="flex grow flex-col justify-between space-y-4 px-6">
					<div className="flex min-h-[120px] flex-col justify-between">
						<div className="min-h-[56px]">
							<h3 className="mb-3 line-clamp-2 text-xl font-bold text-primary sm:text-lg">
								{program.title}
							</h3>
							<p className="line-clamp-2 text-base text-gray-300 sm:text-base">
								{program.description}
							</p>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<Badge
								variant="outline"
								className="border-primary bg-background text-base lg:text-sm"
							>
								{program.category?.name ?? 'Sin categoría'}
							</Badge>
						</div>
						<div className="flex items-center">
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
							<span className="ml-1 text-base font-bold text-yellow-500">
								{program.rating?.toFixed(1) ?? '0.0'}
							</span>
						</div>
					</div>
				</CardContent>

				<CardFooter className="px-6 pt-2">
					<div className="flex w-full items-center justify-between gap-4">
						<div className="flex-shrink-0">
							<EnrollmentCount programId={parseInt(program.id)} />
						</div>
						<Button asChild className="flex-shrink-0">
							<Link
								href={`/estudiantes/programas/${program.id}`}
								className="group/button relative inline-flex h-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-white/20 bg-secondary px-3 text-white active:scale-95 sm:h-8"
							>
								<p className="text-base font-bold sm:text-sm">Ver Programa</p>
								<ArrowRightCircleIcon className="ml-1 size-5 animate-bounce-right sm:size-4" />
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
