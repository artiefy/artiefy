'use client';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs';
import { FaTrophy, FaDownload } from 'react-icons/fa';

import { Button } from '~/components/estudiantes/ui/button';
import { formatDate } from '~/lib/utils2';

import type { Course } from '~/types';

interface StudentCertificationProps {
	course: Course;
	userId: string | null;
}

export function CertificationStudent({
	course,
	userId,
}: StudentCertificationProps) {
	const { user } = useUser();

	if (!user || !userId) return null;

	const today = new Date();

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-8 text-center">
				<h1 className="mb-2 text-4xl font-bold text-primary">
					Certificado de Finalización
				</h1>
				<p className="text-lg text-gray-600">
					¡Felicitaciones por completar el curso exitosamente!
				</p>
			</div>

			<div className="relative mb-8 overflow-hidden rounded-lg border-8 border-amber-200 bg-white p-8 shadow-2xl">
				{/* Certificate Content */}
				<div className="relative z-10 text-center">
					<FaTrophy className="mx-auto mb-4 text-6xl text-yellow-500" />
					<h2 className="mb-6 text-3xl font-bold">Certificado de Logro</h2>
					<p className="mb-4 text-xl">Este certificado es otorgado a</p>
					<p className="mb-8 text-2xl font-bold text-primary">
						{user.firstName} {user.lastName}
					</p>
					<p className="mb-4 text-xl">Por completar exitosamente el curso</p>
					<p className="mb-8 text-2xl font-bold text-primary">
						{course?.title || 'Curso no encontrado'}
					</p>
					<p className="mb-4 text-lg">Finalizado el {formatDate(today)}</p>
					<div className="mt-8 flex justify-center gap-4">
						<Image
							src="/logo.png"
							alt="Artiefy Logo"
							width={100}
							height={100}
							className="rounded-full"
						/>
					</div>
				</div>

				{/* Decorative Background */}
				<div className="absolute inset-0 opacity-5">
					<div className="absolute inset-0 bg-gradient-to-r from-primary via-amber-500 to-primary" />
				</div>
			</div>

			{/* Download Button */}
			<div className="text-center">
				<Button
					className="bg-primary text-white hover:bg-primary/90"
					onClick={() => window.print()}
				>
					<FaDownload className="mr-2" />
					Descargar Certificado
				</Button>
			</div>
		</div>
	);
}
