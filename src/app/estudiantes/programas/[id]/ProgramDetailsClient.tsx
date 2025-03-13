'use client';

import Image from 'next/image';
import Link from 'next/link';

import { blurDataURL } from '~/lib/blurDataUrl';

import type { Program } from '~/types';

interface ProgramDetailsClientProps {
	program: Program;
}

export default function ProgramDetailsClient({
	program,
}: ProgramDetailsClientProps) {
	return (
		<div className="container mx-auto px-8 sm:px-12 lg:px-16">
			<div className="flex flex-col space-y-12 sm:space-y-16">
				<div className="relative h-64 w-full md:h-96">
					<Image
						src={
							program.coverImageKey && program.coverImageKey !== 'NULL'
								? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
								: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
						}
						alt={program.title}
						fill
						className="rounded-lg object-cover"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						quality={85}
						placeholder="blur"
						blurDataURL={blurDataURL}
					/>
				</div>

				<div className="space-y-6">
					<h1 className="text-3xl font-bold text-primary">{program.title}</h1>
					<p className="text-gray-600">{program.description}</p>

					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-primary">
							Cursos del Programa
						</h2>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{program.courses.map((course) => (
								<div key={course.id} className="relative h-48 w-full md:h-64">
									<Image
										src={
											course.coverImageKey && course.coverImageKey !== 'NULL'
												? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
												: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
										}
										alt={course.title}
										fill
										className="rounded-lg object-cover"
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
										quality={85}
										placeholder="blur"
										blurDataURL={blurDataURL}
									/>
									<div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-white">
										<Link href={`/estudiantes/cursos/${course.id}`}>
											<h3 className="text-lg font-bold hover:underline active:scale-95">
												{course.title}
											</h3>
										</Link>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
