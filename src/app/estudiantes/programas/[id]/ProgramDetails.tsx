'use client';

import { useCallback, useEffect, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { FaCheckCircle } from 'react-icons/fa';
import { toast } from 'sonner';

import { ProgramHeader } from '~/components/estudiantes/layout/programdetail/ProgramHeader';
import { ProgramsBreadcrumbs } from '~/components/estudiantes/layout/programdetail/ProgramsBreadcrumbs';
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
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [courseEnrollments, setCourseEnrollments] = useState<
    Record<number, boolean>
  >({});
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Memoize the subscription check function
  const checkSubscriptionStatus = useCallback(() => {
    const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
    const planType = user?.publicMetadata?.planType;
    const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
      | string
      | null;

    const isValid =
      subscriptionStatus === 'active' &&
      planType === 'Premium' &&
      (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

    setIsSubscriptionActive(isValid);
  }, [user?.publicMetadata]);

  // Initial load effect
  useEffect(() => {
    const initializeProgram = async () => {
      if (!userId) return;

      setIsLoadingEnrollments(true);

      try {
        const enrolledPromise = isUserEnrolledInProgram(
          parseInt(program.id),
          userId
        );
        const enrollmentsPromise = fetch('/api/enrolled-courses').then(
          async (res) => {
            if (!res.ok) return { courses: [] };
            return (await res.json()) as {
              courses: { id: number; progress: number }[];
            };
          }
        );

        const [enrolled, enrollmentsData] = await Promise.all([
          enrolledPromise,
          enrollmentsPromise,
        ]);

        setIsEnrolled(enrolled);

        const enrollmentMap: Record<number, boolean> = {};
        (enrollmentsData.courses || []).forEach((course) => {
          enrollmentMap[course.id] = true;
        });
        setCourseEnrollments(enrollmentMap);

        checkSubscriptionStatus();
      } catch (error) {
        console.error('Error initializing program:', error);
      } finally {
        setIsCheckingEnrollment(false);
        setIsLoadingEnrollments(false);
      }
    };

    void initializeProgram();
  }, [userId, program.id, checkSubscriptionStatus]);

  // Subscription change effect
  useEffect(() => {
    if (user?.publicMetadata) {
      checkSubscriptionStatus();
    }
  }, [user?.publicMetadata, checkSubscriptionStatus]);

  // Visibility change handler - modified to only reload user data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        void user.reload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const handleEnroll = (): Promise<void> => {
    if (!isSignedIn) {
      toast.error('Debes iniciar sesión');
      void router.push(`/sign-in?redirect_url=${pathname}`);
      return Promise.resolve();
    }

    if (!isSubscriptionActive) {
      toast.error('Se requiere plan Premium activo', {
        description:
          'Necesitas una suscripción Premium activa para inscribirte.',
      });
      void router.push('/planes');
      return Promise.resolve();
    }

    // Mostrar modal de requisito antes de inscribir
    setShowRequirementModal(true);
    return Promise.resolve();
  };

  // Nueva función para confirmar inscripción tras aceptar el modal
  const confirmEnroll = async () => {
    setShowRequirementModal(false);
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
      {/* Modal de requisito de 10 meses */}
      {showRequirementModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
          <div className="relative flex w-full max-w-md flex-col items-center rounded-lg bg-white p-8 shadow-xl">
            <FaCheckCircle className="mb-4 text-green-500" size={48} />
            <h2 className="mb-2 text-center text-xl font-bold text-background">
              Requisito de Inscripción
            </h2>
            <p className="mb-6 text-center text-background">
              La inscripción a un programa requiere al menos una estancia de{' '}
              <b>10 meses</b> en Artiefy.
            </p>
            <button
              onClick={confirmEnroll}
              className="mt-2 rounded bg-primary px-6 py-2 font-semibold text-background hover:bg-primary/90 active:scale-95"
            >
              Aceptar y continuar
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <ProgramsBreadcrumbs title={program.title} />
        <ProgramHeader
          program={program}
          isEnrolled={isEnrolled}
          isEnrolling={isEnrolling}
          isUnenrolling={isUnenrolling}
          isSubscriptionActive={isSubscriptionActive}
          onEnrollAction={handleEnroll}
          onUnenrollAction={handleUnenroll}
          subscriptionEndDate={
            (user?.publicMetadata?.subscriptionEndDate as string) ?? null
          }
          isCheckingEnrollment={isCheckingEnrollment}
          courseEnrollments={courseEnrollments}
          isLoadingEnrollments={isLoadingEnrollments}
        />
        {/* Remove ProgramContent since it's already in ProgramHeader */}
      </main>
    </div>
  );
}
