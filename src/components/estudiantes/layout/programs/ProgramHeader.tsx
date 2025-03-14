'use client';

import Image from 'next/image';

import { StarIcon } from '@heroicons/react/24/solid';
import { FaUserGraduate, FaCalendar, FaCheck } from 'react-icons/fa';

import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
} from '~/components/estudiantes/ui/card';
import { Icons } from '~/components/estudiantes/ui/icons';
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
				<ProgramContent program={program} />

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
								disabled={isEnrolling || !isSubscriptionActive}
								className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px font-semibold text-white shadow-2xl"
							>
								{!isSubscriptionActive ? (
									'Requiere Plan Premium'
								) : isEnrolling ? (
									<Icons.spinner className="animate-spin text-white" />
								) : (
									'Inscribirse al Programa'
								)}
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
