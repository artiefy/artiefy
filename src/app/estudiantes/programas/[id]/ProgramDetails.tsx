'use client';

import { useState, useEffect } from 'react';

import { useRouter, usePathname } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import { ProgramHeader } from '~/components/estudiantes/layout/programdetail/ProgramHeader';
// Remove ProgramContent import since it's used in ProgramHeader
import {
	enrollInProgram,
	isUserEnrolledInProgram,
} from '~/server/actions/estudiantes/programs/enrollInProgram';
import { unenrollFromProgram } from '~/server/actions/estudiantes/programs/unenrollFromProgram';

import type { Program } from '~/types';

interface ProgramDetailsProps {
	program: Program;
}

export default function ProgramDetails({
	program: initialProgram,
}: ProgramDetailsProps) {
	const [program] = useState(initialProgram);
	// Remove totalStudents since we're using EnrollmentCount now
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [isEnrolling, setIsEnrolling] = useState(false);
	const [isUnenrolling, setIsUnenrolling] = useState(false);
	const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

	const { isSignedIn, userId } = useAuth();
	const { user } = useUser();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const checkEnrollmentAndSubscription = async () => {
			if (userId) {
				const enrolled = await isUserEnrolledInProgram(
					parseInt(program.id),
					userId
				);
				setIsEnrolled(enrolled);

				// Verificar tanto el estado de la suscripción como el tipo de plan
				const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
				const planType = user?.publicMetadata?.planType;
				const subscriptionEndDate = user?.publicMetadata
					?.subscriptionEndDate as string | null;

				const isSubscriptionActive =
					subscriptionStatus === 'active' &&
					planType === 'Premium' &&
					(!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

				setIsSubscriptionActive(isSubscriptionActive);

				// Debug logs
				console.log('Subscription Status:', subscriptionStatus);
				console.log('Plan Type:', planType);
				console.log('Subscription End Date:', subscriptionEndDate);
				console.log('Is Subscription Active:', isSubscriptionActive);
			}
		};

		void checkEnrollmentAndSubscription();
	}, [userId, program.id, user]);

	const handleEnroll = async () => {
		if (!isSignedIn) {
			toast.error('Debes iniciar sesión');
			void router.push(`/sign-in?redirect_url=${pathname}`);
			return;
		}

		// Verificar suscripción antes de intentar inscribirse
		const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
		const planType = user?.publicMetadata?.planType;
		const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
			| string
			| null;

		const isSubscriptionValid =
			subscriptionStatus === 'active' &&
			planType === 'Premium' &&
			(!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

		if (!isSubscriptionValid) {
			toast.error('Se requiere plan Premium activo', {
				description:
					'Necesitas una suscripción Premium activa para inscribirte.',
			});
			void router.push('/planes');
			return;
		}

		setIsEnrolling(true);
		try {
			const result = await enrollInProgram(parseInt(program.id));
			if (result.success) {
				setIsEnrolled(true);
				toast.success('¡Te has inscrito exitosamente al programa!');
			} else {
				toast.error(result.message);
			}
		} catch (err) {
			console.error('Error enrolling:', err);
			toast.error('Error al inscribirse en el programa');
		} finally {
			setIsEnrolling(false);
		}
	};

	const handleUnenroll = async () => {
		setIsUnenrolling(true);
		try {
			const result = await unenrollFromProgram(parseInt(program.id));
			if (result.success) {
				setIsEnrolled(false);
				toast.success('Has cancelado tu inscripción al programa');
			} else {
				toast.error(result.message);
			}
		} catch (err) {
			console.error('Error unenrolling:', err);
			toast.error('Error al cancelar la inscripción');
		} finally {
			setIsUnenrolling(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
				<ProgramHeader
					program={program}
					isEnrolled={isEnrolled}
					isEnrolling={isEnrolling}
					isUnenrolling={isUnenrolling}
					isSubscriptionActive={isSubscriptionActive}
					onEnroll={handleEnroll}
					onUnenroll={handleUnenroll}
					subscriptionEndDate={
						(user?.publicMetadata?.subscriptionEndDate as string) ?? null
					}
				/>
				{/* Remove ProgramContent since it's already in ProgramHeader */}
			</main>
		</div> 
	);
}
