'use client';

import { useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CodeXml,
  FileBox,
  HelpCircle,
  Layers,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Package,
  Rocket,
  SquareCheckBig,
  Star,
  Target,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { FaCheck, FaCrown, FaProjectDiagram, FaStar } from 'react-icons/fa';
import { MdErrorOutline } from 'react-icons/md';
import { toast } from 'sonner';

import { GuidedProjectBreadcrumb } from '~/components/estudiantes/proyectos/GuidedProjectBreadcrumb';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { enrollInGuidedProject } from '~/server/actions/estudiantes/guided-projects/enrollInGuidedProject';

import type { GuidedObjective, GuidedProject } from '~/types/guided-projects';
import type { ReactNode } from 'react';

type NavKey = 'proyecto' | 'sesiones' | 'recursos' | 'entregables' | 'foro';

interface GuidedProjectDetailsProps {
  project: GuidedProject;
  initialIsEnrolled?: boolean;
}

// Split a free-text field into clean list items (one per line).
const splitLines = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

// Split a free-text field into tags (by comma or newline).
const splitTags = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const isImageUrl = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension ?? '');
};

// Static fallback for the generic "how it works" steps (same for every project).
const HOW_IT_WORKS_STEPS = [
  {
    title: 'Ves la actividad',
    description: 'Un video corto te muestra qué hacer.',
  },
  {
    title: 'Construyes con Artie IA',
    description: 'Te acompaña y te ayuda a continuar mientras programas.',
  },
  {
    title: 'Entregas y recibes retroalimentación',
    description:
      'Artie IA te responde al instante y el educador resuelve tus dudas en el foro.',
  },
  {
    title: 'Revisión profesional final',
    description:
      'Un educador revisa tu proyecto terminado antes de tu constancia.',
  },
];

export function GuidedProjectDetails({
  project,
  initialIsEnrolled = false,
}: GuidedProjectDetailsProps) {
  const [isEnrolled, setIsEnrolled] = useState(initialIsEnrolled);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [activePill, setActivePill] = useState<NavKey>('proyecto');
  const [expandedObjective, setExpandedObjective] = useState<number | null>(
    null
  );
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

  const navItems: { key: NavKey; label: string; icon: ReactNode }[] = [
    {
      key: 'proyecto',
      label: 'Proyecto',
      icon: <Rocket className="size-4 shrink-0" />,
    },
    {
      key: 'sesiones',
      label: 'Sesiones',
      icon: <Layers className="size-4 shrink-0" />,
    },
    {
      key: 'recursos',
      label: 'Recursos',
      icon: <FileBox className="size-4 shrink-0" />,
    },
    {
      key: 'entregables',
      label: 'Entregables',
      icon: <SquareCheckBig className="size-4 shrink-0" />,
    },
    {
      key: 'foro',
      label: 'Foro',
      icon: <MessageSquare className="size-4 shrink-0" />,
    },
  ];

  const handlePillClick = (key: NavKey) => setActivePill(key);

  const scrollNav = (direction: 'left' | 'right') => {
    const node = carouselRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === 'left' ? -200 : 200,
      behavior: 'smooth',
    });
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
        setActivePill('sesiones');
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
  const buildS3Url = (key?: string | null) =>
    key ? `${s3Base}/${String(key).replace(/^\/+/, '')}` : undefined;

  // Profile/cover keys may be a full URL (e.g. avatar provider) or an S3 key.
  const resolveMediaUrl = (key?: string | null) => {
    const trimmed = key?.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return buildS3Url(trimmed);
  };

  const coverImageUrl = resolveMediaUrl(project.coverImageKey);
  const coverVideoUrl = resolveMediaUrl(project.coverVideoKey);
  const instructorImageUrl = resolveMediaUrl(project.instructorProfileImageKey);
  // External avatar hosts may not be whitelisted for the image optimizer.
  const instructorImageIsExternal = /^https?:\/\//i.test(
    project.instructorProfileImageKey?.trim() ?? ''
  );

  // Derived stats
  const objectives = useMemo(
    () => project.objectives ?? [],
    [project.objectives]
  );
  const totalActivities = useMemo(
    () => objectives.reduce((acc, o) => acc + (o.activities?.length ?? 0), 0),
    [objectives]
  );
  const ratingValue =
    typeof project.rating === 'number' && project.rating > 0
      ? project.rating
      : null;
  const studentsCount =
    typeof project.studentsCount === 'number' && project.studentsCount > 0
      ? project.studentsCount
      : null;
  const contentHours =
    typeof project.contentHours === 'number' && project.contentHours > 0
      ? project.contentHours
      : null;
  const nivelLabel = project.nivelName?.trim() ?? null;

  const prerequisites = splitLines(project.prerequisites);
  const techStack = splitTags(project.techStack);
  const deliverables = splitLines(project.deliverablesDescription);
  const howItWorksText = project.howItWorks?.trim() ?? '';

  const hasEducatorInfo = Boolean(
    project.instructorName ||
    project.instructorProfesion ||
    project.instructorDescripcion ||
    instructorImageUrl
  );

  // Renders the cover media for the CTA cards: video prevails over the image
  // when a real video file is present (mirrors the course detail validation).
  const renderCoverMedia = (sizes: string) => {
    if (coverVideoUrl && !isImageUrl(coverVideoUrl)) {
      return (
        <video
          className="size-full object-cover"
          src={coverVideoUrl}
          poster={coverImageUrl}
          controls
          playsInline
        />
      );
    }
    const imageSrc =
      coverVideoUrl && isImageUrl(coverVideoUrl)
        ? coverVideoUrl
        : coverImageUrl;
    return imageSrc ? (
      <Image
        src={imageSrc}
        alt={project.title}
        fill
        className="object-cover"
        sizes={sizes}
        quality={85}
      />
    ) : null;
  };

  const renderComingSoon = (message: string) => (
    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
      {message}
    </div>
  );

  const sectionClass =
    'rounded-2xl border border-[#1d283a] bg-[#061c37] p-6 md:p-8';
  const sectionIconClass =
    'flex size-8 items-center justify-center rounded-lg border border-[#22C4D3]/30 bg-[#22C4D3]/15 text-[#22C4D3]';

  const renderObjectiveAccordion = (
    objective: GuidedObjective,
    idx: number
  ) => {
    const activities = objective.activities ?? [];
    const isOpen = expandedObjective === objective.id;
    return (
      <div
        key={objective.id}
        className="overflow-hidden rounded-lg border border-[#1d283a]"
      >
        <button
          type="button"
          onClick={() => setExpandedObjective(isOpen ? null : objective.id)}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0d2a4d] text-xs font-medium text-[#94A3B8]">
            {idx + 1}
          </div>
          <span className="flex-1 text-sm text-[#94A3B8]">
            {objective.title}
          </span>
          {activities.length > 0 && (
            <span className="mr-2 hidden text-xs text-[#94A3B8] sm:inline">
              {activities.filter((a) => a.isCompleted).length}/
              {activities.length} actividades
            </span>
          )}
          {activities.length > 0 ? (
            <ChevronDown
              className={`size-4 text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          ) : (
            <ChevronRight className="size-4 text-[#94A3B8]" />
          )}
        </button>
        {isOpen && activities.length > 0 && (
          <div className="border-t border-[#1d283a] bg-[#04101f]">
            {activities.map((activity, aIdx) => (
              <div
                key={activity.id}
                className="border-b border-[#1d283a]/60 p-4 last:border-b-0"
              >
                <span className="text-xs text-[#94A3B8]">
                  Actividad {aIdx + 1}
                </span>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <h4 className="text-sm font-medium text-white">
                      {activity.name}
                    </h4>
                    {activity.weekNumber != null && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                        <Clock className="size-3" />
                        Semana {activity.weekNumber}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-[#94A3B8]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* El problema */}
      {project.problemStatement?.trim() && (
        <section className={sectionClass}>
          <div className="mb-4 flex items-center gap-2">
            <div className={sectionIconClass}>
              <TriangleAlert className="size-4" />
            </div>
            <h2 className="text-xl font-bold text-white">El problema</h2>
          </div>
          <p className="leading-relaxed whitespace-pre-line text-[#94A3B8]">
            {project.problemStatement}
          </p>
        </section>
      )}

      {/* Cómo funciona */}
      <section className={sectionClass}>
        <div className="mb-4 flex items-center gap-2">
          <div className={sectionIconClass}>
            <Lightbulb className="size-4" />
          </div>
          <h2 className="text-xl font-bold text-white">Cómo funciona</h2>
        </div>
        {howItWorksText ? (
          <p className="leading-relaxed whitespace-pre-line text-[#94A3B8]">
            {howItWorksText}
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm leading-relaxed text-[#94A3B8]">
              No es un curso que ves. Es un proyecto que construyes con
              acompañamiento real.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-[#1d283a]/60 bg-[#0a1f3a]/40 p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#22C4D3]/30 bg-[#22C4D3]/15 text-sm font-bold text-[#22C4D3]">
                      {i + 1}
                    </div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[#94A3B8]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Lo que vas a construir */}
      {(project.whatYouWillBuild?.trim() || objectives.length > 0) && (
        <section className={sectionClass}>
          <div className="mb-4 flex items-center gap-2">
            <div className={sectionIconClass}>
              <Target className="size-4" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Lo que vas a construir
            </h2>
          </div>
          {project.whatYouWillBuild?.trim() && (
            <p className="mb-6 text-sm leading-relaxed whitespace-pre-line text-[#94A3B8]">
              {project.whatYouWillBuild}
            </p>
          )}
          {objectives.length > 0 && (
            <div className="space-y-3">
              {objectives.map((objective, idx) =>
                renderObjectiveAccordion(objective, idx)
              )}
            </div>
          )}
        </section>
      )}

      {/* Requisitos previos */}
      {prerequisites.length > 0 && (
        <section className={sectionClass}>
          <div className="mb-4 flex items-center gap-2">
            <div className={sectionIconClass}>
              <ListChecks className="size-4" />
            </div>
            <h2 className="text-xl font-bold text-white">Requisitos previos</h2>
          </div>
          <ul className="space-y-2">
            {prerequisites.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-[#94A3B8]"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#22C4D3]" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Stack tecnológico */}
      {techStack.length > 0 && (
        <section className={sectionClass}>
          <div className="mb-4 flex items-center gap-2">
            <div className={sectionIconClass}>
              <CodeXml className="size-4" />
            </div>
            <h2 className="text-xl font-bold text-white">Stack tecnológico</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[#22C4D3]/30 bg-[#22C4D3]/10 px-3 py-1.5 font-mono text-xs text-[#22C4D3]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Qué vas a entregar */}
      {deliverables.length > 0 && (
        <section className={sectionClass}>
          <div className="mb-4 flex items-center gap-2">
            <div className={sectionIconClass}>
              <Package className="size-4" />
            </div>
            <h2 className="text-xl font-bold text-white">Qué vas a entregar</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {deliverables.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-[#22C4D3]/20 bg-[#22C4D3]/5 p-4"
              >
                <Package className="mt-0.5 size-5 shrink-0 text-[#22C4D3]" />
                <span className="text-sm leading-relaxed text-white/90">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sobre el educador */}
      {hasEducatorInfo && (
        <section className={sectionClass}>
          <h2 className="font-display mb-6 text-xl font-bold text-white md:text-2xl">
            Sobre el educador
          </h2>
          <div className="flex items-start gap-4 sm:gap-6">
            {instructorImageUrl ? (
              <Image
                src={instructorImageUrl}
                alt={project.instructorName ?? 'Educador'}
                width={80}
                height={80}
                unoptimized={instructorImageIsExternal}
                className="size-16 shrink-0 rounded-xl border-2 border-[#22C4D3]/20 object-cover sm:size-20"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border-2 border-[#22C4D3]/20 bg-[#0d2a4d] text-2xl font-bold text-[#22C4D3] sm:size-20">
                {(project.instructorName ?? 'E').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white">
                {project.instructorName}
              </h3>
              {project.instructorProfesion && (
                <p className="mt-0.5 text-sm font-medium text-[#22C4D3]">
                  {project.instructorProfesion}
                </p>
              )}
              {project.instructorDescripcion && (
                <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                  {project.instructorDescripcion}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Fallback cuando aún no hay contenido enriquecido cargado */}
      {!project.problemStatement?.trim() &&
        !project.whatYouWillBuild?.trim() &&
        objectives.length === 0 &&
        prerequisites.length === 0 &&
        techStack.length === 0 &&
        deliverables.length === 0 && (
          <section className={sectionClass}>
            <div className="mb-4 flex items-center gap-2">
              <div className={sectionIconClass}>
                <HelpCircle className="size-4" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Información del Proyecto Guiado
              </h2>
            </div>
            <p className="text-[#94A3B8]">{project.description}</p>
          </section>
        )}
    </div>
  );

  const stats = [
    ratingValue !== null
      ? {
          icon: <Star className="size-4 fill-amber-400 text-amber-400" />,
          label: ratingValue.toFixed(1),
          highlight: true,
        }
      : null,
    studentsCount !== null
      ? {
          icon: <Users className="size-4" />,
          label: `${studentsCount.toLocaleString('es-CO')} estudiantes`,
        }
      : null,
  ].filter(Boolean) as {
    icon: ReactNode;
    label: string;
    highlight?: boolean;
  }[];

  const chips = [
    totalActivities > 0
      ? {
          icon: <Layers className="size-3.5 text-primary" />,
          label: `${totalActivities} actividades`,
        }
      : null,
    contentHours !== null
      ? {
          icon: <Clock className="size-3.5 text-primary" />,
          label: `${contentHours}h Contenido`,
        }
      : null,
    nivelLabel
      ? {
          icon: <BarChart3 className="size-3.5 text-primary" />,
          label: nivelLabel,
        }
      : null,
  ].filter(Boolean) as { icon: ReactNode; label: string }[];

  const renderStatsAndChips = () => (
    <>
      {stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 ${stat.highlight ? 'font-semibold text-amber-400' : 'text-[#94A3B8]'}`}
            >
              {stat.icon}
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {chip.icon}
              {chip.label}
            </span>
          ))}
        </div>
      )}
    </>
  );

  const renderCtaButton = (extraClass = '') => {
    if (isEnrolled) {
      return !isSubscriptionValid || !hasValidPlan ? (
        <button
          onClick={() => router.push('/planes')}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-base font-semibold text-red-400 transition hover:bg-red-500/20 ${extraClass}`}
        >
          <MdErrorOutline className="size-5" /> Renovar Plan
        </button>
      ) : (
        <button
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#10b9814d] bg-emerald-500/20 px-4 py-2 text-base font-semibold text-emerald-400 disabled:opacity-50 ${extraClass}`}
        >
          <FaCheck className="size-5" /> Suscrito
        </button>
      );
    }
    return (
      <button
        onClick={handleStartNow}
        disabled={isEnrolling}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#22c4d3] px-4 py-2 text-base font-semibold text-[#080c16] transition hover:bg-[#1fb0be] disabled:opacity-50 ${extraClass}`}
      >
        {isEnrolling
          ? 'Inscribiendo...'
          : !isSubscriptionValid || !hasValidPlan
            ? 'Ver Planes'
            : 'Empezar Proyecto Ahora'}
      </button>
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
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-background via-background/95 to-background/80" />

          <div className="relative z-10 space-y-6">
            <div
              className={`grid grid-cols-1 gap-8 ${isEnrolled ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}
            >
              {/* Mobile Title + stats */}
              <div className="space-y-4 lg:hidden">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#22C4D3]/40 bg-[#22C4D3]/15 px-3 py-1.5 text-[#22C4D3]">
                  <FaProjectDiagram className="size-3.5" />
                  <span className="text-xs font-semibold tracking-wide">
                    Proyecto Guiado
                  </span>
                </div>
                <h1 className="font-display max-w-full text-2xl leading-tight font-bold text-balance break-words text-foreground sm:text-3xl">
                  {project.title}
                </h1>
                {(project.subtitle ?? project.description) && (
                  <p className="text-base text-[#94A3B8]">
                    {project.subtitle ?? project.description}
                  </p>
                )}
                {renderStatsAndChips()}
              </div>

              {/* Mobile CTA Card */}
              <div className="lg:hidden">
                <div className="relative overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37]">
                  <AspectRatio ratio={16 / 9}>
                    <div className="group relative size-full overflow-hidden">
                      {renderCoverMedia('100vw')}
                    </div>
                  </AspectRatio>
                  <div className="relative z-20 space-y-5 p-5">
                    {renderCtaButton()}
                    <p className="text-center text-xs text-[#94A3B8]">
                      Incluido en tu suscripción anual o cómpralo individual
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div
                className={`space-y-8 ${isEnrolled ? 'lg:col-span-3' : 'lg:col-span-2'}`}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="hidden lg:inline-flex lg:items-center lg:gap-2 lg:rounded-full lg:border lg:border-[#22C4D3]/40 lg:bg-[#22C4D3]/15 lg:px-3 lg:py-1.5 lg:text-[#22C4D3]">
                      <FaProjectDiagram className="size-3.5" />
                      <span className="text-xs font-semibold tracking-wide">
                        Proyecto Guiado
                      </span>
                    </div>
                    <h1 className="font-display hidden text-3xl leading-tight font-bold text-foreground lg:block lg:text-5xl">
                      {project.title}
                    </h1>
                    {(project.subtitle ?? project.description) && (
                      <p className="hidden text-lg text-[#94A3B8] lg:block">
                        {project.subtitle ?? project.description}
                      </p>
                    )}
                    <div className="hidden lg:block lg:space-y-4">
                      {renderStatsAndChips()}
                    </div>
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

                  {/* Desktop CTA Card (only when enrolled) */}
                  {isEnrolled && (
                    <div className="hidden lg:block lg:w-[340px] lg:flex-shrink-0">
                      <div className="relative w-[340px] overflow-hidden rounded-2xl border border-[#1d283a] bg-[#061c37]">
                        <AspectRatio ratio={16 / 9}>
                          <div className="relative size-full overflow-hidden">
                            {renderCoverMedia('340px')}
                          </div>
                        </AspectRatio>
                        <div className="relative z-20 space-y-5 p-5">
                          {renderCtaButton()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs (carousel nav, Lovable style) */}
                <div className="group relative mt-6">
                  <button
                    type="button"
                    aria-label="Anterior"
                    onClick={() => scrollNav('left')}
                    className="absolute top-1/2 left-0 z-10 flex size-8 -translate-y-1/2 scale-90 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 hover:bg-card"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <nav
                    ref={carouselRef}
                    className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-10"
                  >
                    {navItems.map((item) => {
                      const isActive = activePill === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => handlePillClick(item.key)}
                          className={`relative flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 md:px-5 ${
                            isActive
                              ? 'border border-border/50 bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
                          }`}
                        >
                          {item.icon}
                          <span
                            className={isActive ? 'inline' : 'hidden md:inline'}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                  <button
                    type="button"
                    aria-label="Siguiente"
                    onClick={() => scrollNav('right')}
                    className="absolute top-1/2 right-0 z-10 flex size-8 -translate-y-1/2 scale-90 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 hover:bg-card"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* Main Content Render */}
                <div className="mt-6">
                  {activePill === 'proyecto' && renderOverview()}
                  {activePill === 'sesiones' &&
                    renderComingSoon(
                      'Las sesiones del proyecto estarán disponibles pronto.'
                    )}
                  {activePill === 'recursos' &&
                    renderComingSoon(
                      'Los recursos del proyecto estarán disponibles pronto.'
                    )}
                  {activePill === 'entregables' &&
                    renderComingSoon(
                      'Los entregables del proyecto estarán disponibles pronto.'
                    )}
                  {activePill === 'foro' &&
                    renderComingSoon(
                      'El foro de este proyecto estará disponible pronto.'
                    )}
                </div>
              </div>

              {/* Desktop CTA Card (Unenrolled) - sticky */}
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
                            {renderCoverMedia('(max-width: 1023px) 0px, 33vw')}
                            {(!coverVideoUrl || isImageUrl(coverVideoUrl)) && (
                              <div
                                className="pointer-events-none absolute inset-0 z-20"
                                style={{
                                  background:
                                    'linear-gradient(to bottom, rgba(6, 28, 55, 0) 0%, rgba(6, 28, 55, 0.12) 30%, rgba(6, 28, 55, 0.38) 52%, rgba(6, 28, 55, 0.72) 72%, rgba(6, 28, 55, 0.92) 88%, #061c37 100%)',
                                }}
                              />
                            )}
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
                          {renderCtaButton()}
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
