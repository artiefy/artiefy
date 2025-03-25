'use client';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import { FaUserGraduate, FaCalendar, FaCheck } from 'react-icons/fa';

import { AspectRatio } from '~/components/estudiantes/layout/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/layout/ui/badge';
import { Button } from '~/components/estudiantes/layout/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
} from '~/components/estudiantes/layout/ui/card';
import { Icons } from '~/components/estudiantes/layout/ui/icons';
import { blurDataURL } from '~/lib/blurDataUrl';

import { ProgramContent } from './ProgramContent';

import type { Program } from '~/types';

interface ProgramHeaderProps {
	program: Program;
	totalStudents: number;
	isEnrolled: boolean;
	isEnrolling: boolean;
	isUnenrolling: boolean;
	isSubscriptionActive: boolean;
	subscriptionEndDate: string | null;
	onEnroll: () => Promise<void>;
	onUnenroll: () => Promise<void>;
}

export function ProgramHeader({
	program,
	totalStudents,
	isEnrolled,
	isEnrolling,
	isUnenrolling,
	isSubscriptionActive,
	subscriptionEndDate: _subscriptionEndDate, // Change here: rename in destructuring
	onEnroll,
	onUnenroll,
}: ProgramHeaderProps) {
	const { user } = useUser();

	// Verificar plan Premium
	const isPremium = user?.publicMetadata?.planType === 'Premium';
	const canEnroll = isSubscriptionActive && isPremium;

	const formatDate = (
		dateString: string | number | Date | null | undefined
	) => {
		if (!dateString) return 'Fecha no disponible';
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<Card className="overflow-hidden p-0">
			<CardHeader className="px-0">
				<AspectRatio ratio={16 / 6}>
					<Image
						src={
							program.coverImageKey
								? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
								: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
						}
						alt={program.title}
						fill
						className="object-cover"
						priority
						sizes="100vw"
						placeholder="blur"
						blurDataURL={blurDataURL}
					/>
					<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-6">
						<h1 className="text-3xl font-bold text-white">{program.title}</h1>
					</div>
				</AspectRatio>
			</CardHeader>

			<CardContent className="mx-6 space-y-4">
				{/* Program metadata */}
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center space-x-4">
						<Badge
							variant="outline"
							className="border-primary bg-background text-primary hover:bg-black/70"
						>
							{program.category?.name ?? 'Sin categoría'}
						</Badge>
						<div className="flex items-center">
							<FaCalendar className="mr-2 text-gray-600" />
							<span className="text-sm text-gray-600">
								Creado: {formatDate(program.createdAt)}
							</span>
						</div>
					</div>
					<div className="flex items-center space-x-6">
						<div className="flex items-center">
							<FaUserGraduate className="mr-2 text-blue-600" />
							<span className="text-background">
								{totalStudents} Estudiantes
							</span>
						</div>
						<div className="flex items-center">
							{Array.from({ length: 5 }).map((_, index) => (
								<StarIcon
									key={index}
									className={`h-5 w-5 ${index < Math.floor(program.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
								/>
							))}
							<span className="ml-2 text-lg font-semibold text-yellow-400">
								{program.rating?.toFixed(1)}
							</span>
						</div>
					</div>
				</div>

				{/* Program description */}
				<div className="prose max-w-none">
					<p className="leading-relaxed text-gray-700">
						{program.description ?? 'No hay descripción disponible.'}
					</p>
				</div>

				{/* Program courses */}
				<ProgramContent program={program} isEnrolled={isEnrolled} />

				<div className="flex justify-center pt-4">
					<div className="relative h-32 w-64">
						{isEnrolled ? (
							<div className="flex w-full flex-col space-y-4">
								<Button
									className="h-12 w-64 justify-center border-white/20 bg-primary text-lg font-semibold text-background transition-colors hover:bg-primary/90 active:scale-95"
									disabled={true}
								>
									<FaCheck className="mr-2" /> Suscrito Al Programa
								</Button>
								<Button
									className="h-12 w-64 justify-center border-white/20 bg-red-500 text-lg font-semibold hover:bg-red-600"
									onClick={onUnenroll}
									disabled={isUnenrolling}
								>
									{isUnenrolling ? (
										<Icons.spinner className="animate-spin text-white" />
									) : (
										'Cancelar Suscripción'
									)}
								</Button>
							</div>
						) : (
							<Button
								onClick={onEnroll}
								disabled={isEnrolling || !canEnroll}
								className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px leading-6 font-semibold text-white shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50"
							>
								<span className="absolute inset-0 rounded-xl bg-linear-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
								<span className="relative z-10 block rounded-xl bg-gray-950 px-6 py-3">
									<div className="relative z-10 flex items-center justify-center space-x-2">
										{isEnrolling ? (
											<Icons.spinner
												className="animate-spin text-white"
												style={{ width: '25px', height: '25px' }}
											/>
										) : (
											<>
												<span className="transition-all duration-500 group-hover:translate-x-1">
													{!canEnroll
														? 'Requiere Plan Premium'
														: 'Inscribirse al programa'}
												</span>
												<svg
													className="size-6 transition-transform duration-500 group-hover:translate-x-1"
													data-slot="icon"
													aria-hidden="true"
													fill="currentColor"
													viewBox="0 0 20 20"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														clipRule="evenodd"
														d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
														fillRule="evenodd"
													/>
												</svg>
											</>
										)}
									</div>
								</span>
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
