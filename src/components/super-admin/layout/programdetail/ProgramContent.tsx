'use client';

import Image from 'next/image';
import Link from 'next/link';

import { StarIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';

import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardFooter,
	CardTitle,
} from '~/components/estudiantes/ui/card';

import type { Program, MateriaWithCourse, Course } from '~/types';

interface ProgramContentProps {
	program: Program;
	isEnrolled: boolean;
}

export function ProgramContent({ program, isEnrolled }: ProgramContentProps) {
	const safeMateriasWithCursos =
		program.materias?.filter(
			(materia): materia is MateriaWithCourse & { curso: Course } =>
				materia.curso !== undefined && 'id' in materia.curso
		) ?? [];

	const courses = safeMateriasWithCursos.map((materia) => materia.curso);

	return (
		<div className="relative rounded-lg border bg-white p-6 shadow-sm">
			<h2 className="mb-6 text-2xl font-bold text-background">
				Cursos del programa
			</h2>

			<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{courses.map((course, index) => (
					<div key={`${course.id}-${index}`} className="group relative">
						<div className="absolute -inset-2 animate-gradient rounded-xl bg-linear-to-r from-black via-[#000B19] to-[#012B4A] opacity-0 blur-[8px] transition-all duration-500 group-hover:opacity-100" />
						<Card className="relative flex h-full zoom-in flex-col justify-between overflow-hidden border-0 bg-gray-800 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02]">
							<CardHeader className="px-6">
								<AspectRatio ratio={16 / 9}>
									<div className="relative size-full">
										<Image
											src={
												course.coverImageKey
													? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
													: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
											}
											alt={course.title || 'Imagen del curso'}
											className="rounded-md object-cover transition-transform duration-300 hover:scale-105"
											fill
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
											quality={75}
										/>
									</div>
								</AspectRatio>
							</CardHeader>

							<CardContent className="-mt-3 flex grow flex-col justify-between space-y-2">
								<CardTitle className="rounded text-lg text-background">
									<div className="font-bold text-primary">{course.title}</div>
								</CardTitle>
								<div className="flex items-center justify-between">
									<Badge
										variant="outline"
										className="border-primary bg-background text-primary hover:bg-black/70"
									>
										{course.category?.name}
									</Badge>
								</div>
								<p className="line-clamp-2 text-sm text-gray-300">
									{course.description}
								</p>
							</CardContent>

							<CardFooter className="flex flex-col items-start justify-between space-y-2">
								<div className="flex w-full justify-between">
									<p className="text-sm font-bold text-gray-300 italic">
										Educador:{' '}
										<span className="font-bold italic">
											{course.instructor}
										</span>
									</p>
									<p className="text-sm font-bold text-red-500">
										{course.modalidad?.name}
									</p>
								</div>
								<div className="flex w-full items-center justify-between">
									<Button
										asChild
										disabled={!isEnrolled}
										className={
											!isEnrolled ? 'cursor-not-allowed opacity-50' : ''
										}
									>
										<Link
											href={
												isEnrolled ? `/estudiantes/cursos/${course.id}` : '#'
											}
											className="group/button relative inline-flex h-10 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary active:scale-95"
											onClick={(e) => !isEnrolled && e.preventDefault()}
										>
											<p className="font-bold">
												{isEnrolled ? 'Ver Curso' : 'Requiere Inscripción'}
											</p>
											<ArrowRightCircleIcon className="ml-1.5 size-5 animate-bounce-right" />
											<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
												<div className="relative h-full w-10 bg-white/30" />
											</div>
										</Link>
									</Button>
									<div className="flex items-center">
										<StarIcon className="size-5 text-yellow-500" />
										<span className="ml-1 text-sm font-bold text-yellow-500">
											{(course.rating ?? 0).toFixed(1)}
										</span>
									</div>
								</div>
							</CardFooter>
						</Card>
					</div>
				))}
			</div>
		</div>
	);
}