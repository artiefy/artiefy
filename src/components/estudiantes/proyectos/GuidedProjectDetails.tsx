'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  FaCheck,
  FaComments,
  FaCrown,
  FaProjectDiagram,
  FaStar,
} from 'react-icons/fa';
import { MdErrorOutline, MdOutlineVideocam } from 'react-icons/md';
import { toast } from 'sonner';

import { GuidedProjectActivities } from '~/components/estudiantes/proyectos/GuidedProjectActivities';
import { GuidedProjectBreadcrumb } from '~/components/estudiantes/proyectos/GuidedProjectBreadcrumb';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { enrollInGuidedProject } from '~/server/actions/estudiantes/guided-projects/enrollInGuidedProject';

import type { GuidedProject } from '~/types/guided-projects';
import type { ReactNode } from 'react';

type NavKey = 'proyecto' | 'actividades' | 'foro';

interface GuidedProjectDetailsProps {
  project: GuidedProject;
  initialIsEnrolled?: boolean;
}

export function GuidedProjectDetails({
  project,
  initialIsEnrolled = false,
}: GuidedProjectDetailsProps) {
  const [isEnrolled, setIsEnrolled] = useState(initialIsEnrolled);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [activePill, setActivePill] = useState<NavKey>('proyecto');
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Lógica de Suscripción (Clonada de cursos)
  const userPlanType = user?.publicMetadata?.planType as string | undefined;
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as
    | string
    | undefined;
  const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
    | string
    | null
    | undefined;

  const isSubscriptionValid =
    subscriptionStatus === 'active' &&
    (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

  const hasValidPlan =
    userPlanType === 'Pro' ||
    userPlanType === 'Premium' ||
    userPlanType === 'Enterprise';

  const navItems: Array<{
    key: NavKey;
    label: string;
    icon: ReactNode;
  }> = [
    {
      key: 'proyecto',
      label: 'Proyecto',
      icon: <MdOutlineVideocam className="size-4" />,
    },
    {
      key: 'actividades',
      label: 'Actividades',
      icon: <FaProjectDiagram className="size-4" />,
    },
    {
      key: 'foro',
      label: 'Foro',
      icon: <FaComments className="size-4" />,
    },
  ];

  const handlePillClick = (key: NavKey) => {
    setActivePill(key);
  };

  const handleStartNow = async () => {
    if (!isSignedIn) {
      toast.info('Debes iniciar sesión para inscribirte');
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`
      );
      return;
    }

    if (!isSubscriptionValid || !hasValidPlan) {
      toast.error('Se requiere una suscripción Pro o Premium activa.');
      router.push('/planes');
      return;
    }

    if (!project?.id) {
      toast.error('Proyecto guiado inválido');
      return;
    }

    setIsEnrolling(true);
    try {
      const result = await enrollInGuidedProject(project.id);
      if (result.success) {
        toast.success(result.message);
        setIsEnrolled(true);
        setActivePill('actividades');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error al inscribirse en proyecto guiado:', error);
      toast.error('Error al procesar la inscripción');
    } finally {
      setIsEnrolling(false);
    }
  };

  const s3Base = process.env.NEXT_PUBLIC_AWS_S3_URL?.replace(/\/$/, '') ?? '';
  const coverImageUrl = project.coverImageKey
    ? `${s3Base}/${String(project.coverImageKey).replace(/^\/+/, '')}`
    : undefined;
  const coverVideoUrl = project.coverVideoKey
    ? `${s3Base}/${String(project.coverVideoKey).replace(/^\/+/, '')}`
    : undefined;

  const isImageUrl = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
      extension || ''
    );
  };

  const renderAccessGuard = (label: string) => {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#22C4D3] bg-[#061c37] p-6 text-center">
        <h3 className="text-xl font-semibold text-white">Acceso restringido</h3>
        <p className="text-sm text-[#94A3B8]">
          {!isSignedIn
            ? `Inicia sesión e inscríbete para acceder a ${label}.`
            : !isSubscriptionValid || !hasValidPlan
              ? `Necesitas un plan Pro o Premium activo para inscribirte y ver ${label}.`
              : `Inscríbete en el proyecto para ver ${label}.`}
        </p>
        <button
          type="button"
          onClick={handleStartNow}
          disabled={isEnrolling}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#22c4d3] px-5 text-sm font-semibold text-[#080c16] transition hover:bg-[#1fb0be] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
        >
          {isEnrolling
            ? 'Inscribiendo...'
            : !isSubscriptionValid || !hasValidPlan
              ? 'Ver Planes'
              : 'Inscribirme'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto -mt-6 max-w-7xl px-4 py-2 sm:-mt-0 md:px-6 md:py-8 lg:px-8">
        <GuidedProjectBreadcrumb title={project.title} />

        {/* Banner de Suscripción Expirada */}
        {isEnrolled && (!isSubscriptionValid || !hasValidPlan) && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            <div className="flex items-center gap-3">
              <MdErrorOutline className="size-6 shrink-0 text-red-400" />
              <p className="text-sm font-medium">
                Tu suscripción ha expirado o no es válida para este proyecto.
                Puedes ver el contenido, pero no podrás marcar actividades como
                completadas.
              </p>
            </div>
            <button
              onClick={() => router.push('/planes')}
              className="ml-4 shrink-0 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600"
            >
              Renovar Plan
            </button>
          </div>
        )}

        <div
          className="relative rounded-2xl border p-2 shadow-xl shadow-black/20 backdrop-blur-sm md:p-8"
          style={{
            backgroundColor: '#010b17',
            borderColor: '#061c37cc',
            backgroundImage: coverImageUrl
              ? `url(${coverImageUrl})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-background via-background/95 to-background/80"></div>

          <div className="relative z-10 space-y-6">
            <div
              className={`grid grid-cols-1 gap-8 ${isEnrolled ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}
            >
              {/* Mobile Title */}
              <div className="space-y-3 lg:hidden">
                <h1 className="font-display max-w-full text-2xl leading-tight font-bold text-balance break-words text-foreground sm:text-3xl">
                  {project.title}
                </h1>
              </div>

              {/* Mobile CTA Card */}
              <div className="lg:hidden">
                <div
                  className="relative overflow-hidden rounded-2xl border border-border bg-[#061c37]"
                  style={{ borderColor: '#1d283a' }}
                >
                  <AspectRatio ratio={16 / 9}>
                    <div className="group relative size-full overflow-hidden">
                      {coverVideoUrl ? (
                        isImageUrl(coverVideoUrl) ? (
                          <Image
                            src={coverVideoUrl}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="100vw"
                          />
                        ) : (
                          <video
                            className="size-full object-cover"
                            src={coverVideoUrl}
                            poster={coverImageUrl}
                            playsInline
                          />
                        )
                      ) : (
                        coverImageUrl && (
                          <Image
                            src={coverImageUrl}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="100vw"
                          />
                        )
                      )}
                    </div>
                  </AspectRatio>
                  <div className="relative z-20 space-y-5 p-5">
                    {isEnrolled ? (
                      !isSubscriptionValid || !hasValidPlan ? (
                        <button
                          onClick={() => router.push('/planes')}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-base font-semibold text-red-400"
                        >
                          <MdErrorOutline className="size-5" /> Renovar Plan
                        </button>
                      ) : (
                        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#10b9814d] bg-emerald-500/20 px-4 py-2 text-base font-semibold text-emerald-400 disabled:opacity-50">
                          <FaCheck className="size-5" /> Suscrito
                        </button>
                      )
                    ) : (
                      <button
                        onClick={handleStartNow}
                        disabled={isEnrolling}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#22c4d3] px-4 py-2 text-base font-semibold text-[#080c16] hover:bg-[#1fb0be] disabled:opacity-50"
                      >
                        {isEnrolling
                          ? 'Inscribiendo...'
                          : !isSubscriptionValid || !hasValidPlan
                            ? 'Ver Planes'
                            : 'Empezar Proyecto Ahora'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div
                className={`space-y-8 ${isEnrolled ? 'lg:col-span-3' : 'lg:col-span-2'}`}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                  <div className="flex-1 space-y-4">
                    <h1 className="font-display hidden text-3xl leading-tight font-bold text-foreground lg:block lg:text-5xl">
                      {project.title}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-foreground">
                        <FaProjectDiagram className="size-3.5 text-primary" />
                        Proyecto Guiado
                      </span>
                      {isSubscriptionValid && hasValidPlan && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                            userPlanType === 'Premium'
                              ? 'border-amber-500/40 text-amber-400'
                              : 'border-blue-500/40 text-blue-400'
                          }`}
                        >
                          {userPlanType === 'Premium' ? (
                            <FaCrown className="size-3" />
                          ) : (
                            <FaStar className="size-3" />
                          )}
                          Plan {userPlanType} Activo
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-[#94A3B8]">
                      {project.description}
                    </p>
                  </div>

                  {/* Desktop CTA Card (only when enrolled) */}
                  {isEnrolled && (
                    <div className="hidden lg:block lg:w-[340px] lg:flex-shrink-0">
                      <div className="relative w-[340px] overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37]">
                        <AspectRatio ratio={16 / 9}>
                          <div className="relative size-full overflow-hidden">
                            {coverImageUrl && (
                              <Image
                                src={coverImageUrl}
                                alt={project.title}
                                fill
                                className="object-cover"
                                sizes="340px"
                              />
                            )}
                          </div>
                        </AspectRatio>
                        <div className="relative z-20 space-y-5 p-5">
                          {!isSubscriptionValid || !hasValidPlan ? (
                            <button
                              onClick={() => router.push('/planes')}
                              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-base font-semibold text-red-400 transition hover:bg-red-500/20"
                            >
                              <MdErrorOutline className="size-5" /> Renovar Plan
                            </button>
                          ) : (
                            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#10b9814d] bg-emerald-500/20 px-4 py-2 text-base font-semibold text-emerald-400 disabled:opacity-50">
                              <FaCheck className="size-5" /> Suscrito
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="mt-6">
                  {/* Desktop Enrolled View Tabs */}
                  {isEnrolled && (
                    <div className="hidden gap-4 lg:flex lg:w-full lg:justify-start">
                      {navItems.map((item) => {
                        const isActive = activePill === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => handlePillClick(item.key)}
                            className={`flex items-center gap-2 rounded-full border px-[20px] py-[10px] text-sm font-semibold transition-all ${
                              isActive
                                ? 'border-[#1a2f4c] bg-[#061c37] text-white'
                                : 'border-transparent bg-transparent text-white/80 hover:border-[#1a2f4c]/60 hover:bg-[#061c3780]/50 hover:text-white'
                            }`}
                          >
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Mobile or Unenrolled View Tabs */}
                  <div
                    className={`flex w-full items-center gap-2 overflow-hidden ${isEnrolled ? 'lg:hidden' : ''}`}
                  >
                    <div
                      ref={carouselRef}
                      className="flex min-w-0 flex-1 [scrollbar-width:none] gap-2 overflow-x-auto px-2 py-1.5 md:px-3"
                    >
                      {navItems.map((item) => {
                        const isActive = activePill === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => handlePillClick(item.key)}
                            className={`flex shrink-0 items-center gap-2 rounded-full border px-[20px] py-[10px] text-sm font-semibold transition-all ${
                              isActive
                                ? 'border-[#1a2f4c] bg-[#061c37] text-white'
                                : 'border-transparent bg-transparent text-white/80 hover:border-[#1a2f4c]/60 hover:bg-[#061c3780]/50 hover:text-white'
                            }`}
                          >
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Main Content Render */}
                <div className="mt-6">
                  {activePill === 'proyecto' && (
                    <div className="rounded-xl border border-[#1d283a] bg-[#061c37] p-8">
                      <h2 className="mb-4 text-xl font-bold text-white">
                        Información del Proyecto Guiado
                      </h2>
                      <p className="text-[#94A3B8]">{project.description}</p>
                    </div>
                  )}
                  {activePill === 'actividades' &&
                    (isEnrolled ? (
                      <GuidedProjectActivities
                        objectives={project.objectives || []}
                        isEnrolled={isEnrolled}
                        guidedProjectId={project.id}
                        isSubscriptionValid={
                          isSubscriptionValid && hasValidPlan
                        }
                      />
                    ) : (
                      renderAccessGuard('las actividades del proyecto')
                    ))}
                  {activePill === 'foro' &&
                    (isEnrolled ? (
                      <div className="rounded-xl border border-[#1d283a] bg-[#061c37] p-8 text-center text-[#94A3B8]">
                        El foro de este proyecto estará disponible pronto.
                      </div>
                    ) : (
                      renderAccessGuard('el foro')
                    ))}
                </div>
              </div>

              {/* Desktop CTA Card (Unenrolled) */}
              {!isEnrolled && (
                <div className="hidden lg:block">
                  <div className="sticky top-24 max-h-[calc(100vh-8rem)] self-start">
                    <div
                      className="relative overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37]"
                      style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                    >
                      <div className="relative">
                        <AspectRatio ratio={16 / 9}>
                          <div className="group relative size-full overflow-hidden">
                            {coverImageUrl && (
                              <Image
                                src={coverImageUrl}
                                alt={project.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1023px) 0px, 33vw"
                                quality={85}
                              />
                            )}
                            <div
                              className="pointer-events-none absolute inset-0 z-20"
                              style={{
                                background:
                                  'linear-gradient(to bottom, rgba(6, 28, 55, 0) 0%, rgba(6, 28, 55, 0.12) 30%, rgba(6, 28, 55, 0.38) 52%, rgba(6, 28, 55, 0.72) 72%, rgba(6, 28, 55, 0.92) 88%, #061c37 100%)',
                              }}
                            />
                          </div>
                        </AspectRatio>
                      </div>
                      <div className="relative z-20 space-y-5 p-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary">
                          <FaProjectDiagram className="size-3.5" />
                          <span>Proyecto Guiado</span>
                        </div>

                        <p className="text-sm leading-tight font-semibold text-white">
                          {project.title}
                        </p>

                        <div className="space-y-3">
                          {isSubscriptionValid && hasValidPlan && (
                            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#22C4D3]">
                              Incluido en tu plan {userPlanType?.toUpperCase()}
                              {userPlanType === 'Premium' ? (
                                <FaCrown className="size-4 text-amber-400" />
                              ) : (
                                <FaStar className="size-4 text-blue-400" />
                              )}
                            </p>
                          )}
                          <button
                            onClick={handleStartNow}
                            disabled={isEnrolling}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#22c4d3] px-4 py-2 text-base font-semibold text-[#080c16] transition hover:bg-[#1fb0be] disabled:opacity-50"
                          >
                            {isEnrolling
                              ? 'Inscribiendo...'
                              : !isSubscriptionValid || !hasValidPlan
                                ? 'Ver Planes'
                                : 'Empezar Proyecto Ahora'}
                          </button>
                          <p className="text-center text-xs text-[#94A3B8]">
                            Accede a este proyecto guiado con un plan{' '}
                            <span className="font-medium text-white">
                              Pro o Premium
                            </span>
                            .{' '}
                            <a
                              href="/planes"
                              className="text-white hover:underline"
                            >
                              Ver planes
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
