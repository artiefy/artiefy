'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { ProgramHeader } from '~/components/super-admin/layout/programdetail/ProgramHeader';
import {
    enrollInProgram,
    isUserEnrolledInProgram,
} from '~/server/actions/superAdmin/program/enrollInProgram';
import { unenrollFromProgram } from '~/server/actions/superAdmin/program/unenrollFromProgram';
import { getProgramById } from '~/server/actions/superAdmin/program/getProgramById'; // Import the function to get program details

import type { Program } from '~/types';

interface ProgramDetailsProps {
    programId: string; // Change to programId
}

export default function ProgramDetails({
    programId,
}: ProgramDetailsProps) {
    const [program, setProgram] = useState<Program | null>(null);
    const totalStudents = program?.enrollmentPrograms?.length ?? 0;
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isUnenrolling, setIsUnenrolling] = useState(false);
    const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

    const { isSignedIn, userId } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchProgramDetails = async () => {
            try {
                const programData = await getProgramById(programId);
                setProgram(programData);
            } catch (error) {
                console.error('Error fetching program details:', error);
                toast.error('Error al obtener los detalles del programa');
            }
        };

        if (programId) {
            void fetchProgramDetails();
        }
    }, [programId]);

    useEffect(() => {
        const checkEnrollmentAndSubscription = async () => {
            if (userId && program) {
                const enrolled = await isUserEnrolledInProgram(
                    parseInt(program.id),
                    userId
                );
                setIsEnrolled(enrolled);

                const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
                const planType = user?.publicMetadata?.planType;
                const subscriptionEndDate = user?.publicMetadata
                    ?.subscriptionEndDate as string | null;

                const isSubscriptionActive =
                    subscriptionStatus === 'active' &&
                    planType === 'Premium' &&
                    (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

                setIsSubscriptionActive(isSubscriptionActive);

                console.log('Subscription Status:', subscriptionStatus);
                console.log('Plan Type:', planType);
                console.log('Subscription End Date:', subscriptionEndDate);
                console.log('Is Subscription Active:', isSubscriptionActive);
            }
        };

        void checkEnrollmentAndSubscription();
    }, [userId, program, user]);

    const handleEnroll = async () => {
        if (!isSignedIn) {
            toast.error('Debes iniciar sesión');
            void router.push(`/sign-in?redirect_url=${pathname}`);
            return;
        }

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
            if (!program) {
                toast.error('El programa no está disponible.');
                setIsEnrolling(false);
                return;
            }
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
            if (!program) {
                toast.error('El programa no está disponible.');
                setIsUnenrolling(false);
                return;
            }
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
                {program && (
                    <ProgramHeader
                        program={program}
                        isEnrolled={isEnrolled}
                        isEnrolling={isEnrolling}
                        isUnenrolling={isUnenrolling}
                        isSubscriptionActive={isSubscriptionActive}
                        onEnroll={handleEnroll}
                        onUnenroll={handleUnenroll}
                        totalStudents={totalStudents}
                        subscriptionEndDate={
                            (user?.publicMetadata?.subscriptionEndDate as string) ?? null
                        }
                    />
                )}
            </main>
        </div>
    );
}