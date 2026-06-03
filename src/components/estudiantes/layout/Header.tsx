'use client';
import React, { Suspense, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Show, useAuth, useUser } from '@clerk/nextjs';
import { XMarkIcon as XMarkIconSolid } from '@heroicons/react/24/solid';
import {
  BookOpen,
  CreditCard,
  FolderKanban,
  GraduationCap,
  Home,
  MapPin,
  PanelsTopLeft,
  Search,
  X,
} from 'lucide-react';
import { FaCrown, FaStar } from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';
import useSWR from 'swr';

import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import MiniSignUpModal from '~/components/estudiantes/layout/MiniSignUpModal';
import CourseSearchPreview from '~/components/estudiantes/layout/studentdashboard/CourseSearchPreview';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { ensureCurrentUserStudentRole, getUserRole } from '~/utils/roles';

import { UserButtonWrapper } from '../auth/UserButtonWrapper';

import { NotificationHeader } from './NotificationHeader';

import type { EnrolledCourse } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import type { Course, Program } from '~/types';

import '~/styles/barsicon.css';

export function Header({
  onEspaciosClickAction,
}: {
  onEspaciosClickAction?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
  const [previewPrograms, setPreviewPrograms] = useState<Program[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [showEspaciosModal, setShowEspaciosModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const { isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const userRole = getUserRole(user?.publicMetadata?.role);
  const desktopSignInHref = `/sign-in?redirect_url=${encodeURIComponent(
    pathname || '/'
  )}`;
  const isSignedIn = Boolean(user);

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/estudiantes', label: 'Cursos' },
    { href: '/proyectos', label: 'Proyectos' },
    { href: '/comunidad', label: 'Espacios' },
    { href: '/planes', label: 'Planes' },
  ];
  const mobileNavItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/estudiantes', label: 'Cursos', icon: BookOpen },
    {
      href: '/estudiantes#programas-section',
      label: 'Programas',
      icon: PanelsTopLeft,
    },
    { href: '/proyectos', label: 'Proyectos', icon: FolderKanban },
    { href: '/comunidad', label: 'Espacios', icon: MapPin },
    { href: '/planes', label: 'Planes', icon: CreditCard },
    {
      href: '/estudiantes/myaccount',
      label: 'Mis Cursos',
      icon: GraduationCap,
    },
  ];

  const planType = user?.publicMetadata?.planType as string | undefined;
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as
    | string
    | undefined;
  const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
    | string
    | undefined;

  useEffect(() => {
    if (!user || userRole) return;

    let isCurrent = true;

    void ensureCurrentUserStudentRole().then((updated) => {
      if (updated && isCurrent) {
        void user.reload();
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [user, userRole]);

  const isPlanExpired = () => {
    if (!planType) return false;
    const requiresActive =
      planType === 'Premium' || planType === 'Pro' || planType === 'Enterprise';
    if (!requiresActive) return false;
    if (subscriptionStatus && subscriptionStatus !== 'active') return true;
    if (subscriptionEndDate) {
      const end = new Date(subscriptionEndDate);
      if (!Number.isNaN(end.getTime()) && end < new Date()) return true;
    }
    return false;
  };
  const hasActiveStudentAccess = isSignedIn && !isPlanExpired();
  const visibleMobileNavItems = mobileNavItems.filter(
    (item) => item.href !== '/estudiantes/myaccount' || isSignedIn
  );

  const getPlanBadgeConfig = (type?: string) => {
    if (!type) return null;
    const normalized = type.toLowerCase();
    if (normalized === 'premium') {
      return {
        label: 'Premium',
        icon: FaCrown,
        classes: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
      };
    }
    if (normalized === 'pro') {
      return {
        label: 'Pro',
        icon: FaStar,
        classes: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
      };
    }
    if (normalized === 'enterprise') {
      return {
        label: 'Enterprise',
        icon: FaCrown,
        classes: 'border-indigo-500/30 bg-indigo-500/20 text-indigo-300',
      };
    }
    if (normalized === 'gratuito' || normalized === 'free') {
      return {
        label: 'Gratuito',
        icon: IoGiftOutline,
        classes: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
      };
    }
    return {
      label: type,
      icon: null,
      classes: 'border-slate-500/30 bg-slate-500/20 text-slate-200',
    };
  };

  const renderMobilePlanBadge = () => {
    if (!planType || isPlanExpired()) return null;
    const config = getPlanBadgeConfig(planType);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <span
        className={`
          inline-flex items-center gap-1 rounded-full border px-2 py-0.5
          text-[10px] font-medium
          ${config.classes}
        `}
        title={`Plan ${config.label}`}
      >
        {Icon ? <Icon className="size-3" /> : null}
        {config.label}
      </span>
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateViewport);
      return () => mediaQuery.removeEventListener('change', updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  // Header visibility on scroll removed — header will remain static in flow

  // Debounce para preview de cursos
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setPreviewCourses([]);
      setPreviewPrograms([]);
      setShowPreview(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const [{ searchCoursesPreview }, { searchProgramsPreview }] =
          await Promise.all([
            import('~/server/actions/estudiantes/courses/searchCoursesPreview'),
            import('~/server/actions/estudiantes/programs/searchProgramsPreview'),
          ]);
        const [courseResults, programResults] = await Promise.all([
          searchCoursesPreview(searchQuery),
          searchProgramsPreview(searchQuery),
        ]);
        setPreviewCourses(courseResults);
        setPreviewPrograms(programResults);
        setShowPreview(courseResults.length > 0 || programResults.length > 0);
      } catch (_err) {
        setPreviewCourses([]);
        setPreviewPrograms([]);
        setShowPreview(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || searchInProgress) return;

    setSearchInProgress(true);

    // Emit global search event
    const searchEvent = new CustomEvent('artiefy-search', {
      detail: { query: searchQuery.trim() },
    });
    window.dispatchEvent(searchEvent);

    setSearchQuery('');
    setSearchInProgress(false);
  };

  const renderAuthButton = (variant: 'header' | 'mobileMenu' = 'header') => {
    const isMobileMenu = variant === 'mobileMenu';
    const mobilePlanBadge = renderMobilePlanBadge();
    if (!mounted) {
      return (
        <div className="flex items-center">
          <Icons.spinner className="size-5 text-primary" />
        </div>
      );
    }

    return (
      <>
        {!isAuthLoaded ? (
          <div className="flex items-center">
            <Icons.spinner className="size-5 text-primary" />
          </div>
        ) : (
          <>
            <Show when="signed-out">
              <div className="flex items-center">
                <Button
                  asChild
                  className="
                    ml-2 hidden h-9 items-center justify-center gap-2 rounded-md
                    bg-primary px-3 text-sm font-medium whitespace-nowrap
                    text-black transition-colors
                    hover:bg-primary/90
                    md:inline-flex
                  "
                >
                  <Link href={desktopSignInHref}>Acceder</Link>
                </Button>

                <Button
                  className="
                    relative skew-x-[-15deg] cursor-pointer rounded-none border
                    border-primary bg-primary p-5 text-xl font-light
                    text-background italic transition-all duration-200
                    hover:bg-background hover:text-primary
                    hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)]
                    active:scale-95
                    md:hidden
                  "
                  style={{
                    transition: '0.5s',
                    width: '180px',
                  }}
                  type="button"
                  onClick={handleOpenLoginModal}
                >
                  <span
                    className="
                      relative skew-x-[15deg] overflow-hidden font-semibold
                    "
                  >
                    Iniciar Sesión
                  </span>
                </Button>
              </div>
            </Show>

            <Show when="signed-in">
              {isMobileMenu ? (
                <div className="flex w-full flex-col items-center gap-2">
                  <Suspense
                    fallback={
                      <div
                        className="
                          flex min-w-[180px] items-center justify-start
                        "
                      >
                        <Icons.spinner className="ml-2 size-5 text-primary" />
                      </div>
                    }
                  >
                    <UserButtonWrapper />
                  </Suspense>
                  {mobilePlanBadge ? (
                    <div className="mt-1">{mobilePlanBadge}</div>
                  ) : null}
                  <div
                    className="
                      campana-header relative
                      md:text-white
                    "
                  >
                    <NotificationHeader />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mr-4 hidden items-center gap-3 md:mr-6 md:flex">
                    <Suspense
                      fallback={
                        <div className="flex items-center">
                          <Icons.spinner className="size-5 text-primary" />
                        </div>
                      }
                    >
                      <UserButtonWrapper />
                    </Suspense>
                    <div
                      className="
                        campana-header relative
                        md:text-white
                      "
                    >
                      <NotificationHeader />
                    </div>
                  </div>

                  <div
                    className="
                      flex items-center gap-2
                      md:hidden
                    "
                  >
                    {mobilePlanBadge}
                    <div className="perfil-header">
                      <Suspense
                        fallback={
                          <div
                            className="
                              flex min-w-[180px] items-center justify-start
                            "
                          >
                            <Icons.spinner className="ml-2 size-5 text-primary" />
                          </div>
                        }
                      >
                        <UserButtonWrapper />
                      </Suspense>
                    </div>
                    <div
                      className="
                        campana-header relative
                        md:text-white
                      "
                    >
                      <NotificationHeader />
                    </div>
                  </div>
                </>
              )}
            </Show>
          </>
        )}
      </>
    );
  };

  const getCourseImageUrl = (coverImageKey?: string | null) => {
    if (!coverImageKey || coverImageKey === 'NULL') {
      return 'https://placehold.co/600x400/01152D/3AF4EF?text=Artiefy&font=MONTSERRAT';
    }
    const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`;
    return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
  };

  const coursesFetcher = (url: string) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error('No se pudo cargar los cursos');
      return r.json();
    });

  const { data: enrolledData } = useSWR<{ courses?: EnrolledCourse[] }>(
    isSignedIn ? '/api/enrolled-courses' : null,
    coursesFetcher,
    { revalidateOnFocus: false }
  );
  const enrolledCourses = enrolledData?.courses ?? [];
  const continueCourses = enrolledCourses.slice(0, 3);

  const handleEspaciosClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setShowEspaciosModal(true);
    onEspaciosClickAction?.();
  };

  const handleOpenLoginModal = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.removeEventListener('keydown', handleKeyDown);
      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

  return (
    <nav
      className="
        sticky z-[100] mb-8 w-full border-b bg-[#01152d]
        sm:mb-8
      "
      style={{ top: 'var(--subscription-banner-height, 0px)' }}
    >
      {showEspaciosModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="espacios-modal-title"
        >
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-black/30"
            aria-label="Cerrar modal"
            onClick={() => setShowEspaciosModal(false)}
          />
          <div
            className="
              relative mx-auto flex w-full max-w-md flex-col items-center
              rounded-2xl bg-white p-8 shadow-2xl
            "
          >
            <span
              className="
                mb-4 flex size-16 items-center justify-center rounded-full
                bg-gradient-to-tr from-primary to-blue-400 shadow-lg
              "
            >
              <svg
                className="size-10 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                />
              </svg>
            </span>
            <h2
              id="espacios-modal-title"
              className="mb-2 text-center text-2xl font-bold text-secondary"
            >
              ¡Disponible muy pronto!
            </h2>
            <p className="mb-4 text-center text-gray-600">
              La sección de{' '}
              <span className="font-semibold text-secondary">Espacios</span>{' '}
              estará habilitada próximamente.
              <br />
              ¡Gracias por tu interés!
            </p>
            <button
              className="
                mt-2 rounded bg-secondary px-6 py-2 font-semibold text-white
                shadow transition
                hover:bg-blue-700
              "
              onClick={() => setShowEspaciosModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
      <div
        className="
          container mx-auto flex h-16 max-w-7xl items-center justify-between
          gap-12 px-4
          sm:px-6
        "
      >
        {!isMobileViewport ? (
          <div className="hidden w-full items-center justify-between gap-12 md:flex">
            {/* Logo */}
            <Link
              href="/"
              className="
              ml-0 flex shrink-0 items-center gap-2
              md:-ml-8
            "
            >
              <div className="relative h-8 w-32">
                <Image
                  src="/artiefy-logo.svg"
                  alt="Logo Artiefy"
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="128px"
                />
              </div>
            </Link>

            {/* Search Bar - Hidden on mobile */}
            <form
              onSubmit={handleSearch}
              className="
              hidden max-w-xl flex-1
              md:block
            "
            >
              <div className="relative">
                <input
                  type="search"
                  placeholder="¡Aprende con IA!"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                  w-full rounded-2xl border border-[#1f2937] bg-[#1D283A80] py-3
                  pr-10 pl-4 text-sm text-foreground transition-all
                  placeholder:text-gray-400
                  hover:border-[#334155]
                  focus:border-[#3AF4EF] focus:bg-[#1D283A80] focus:ring-2
                  focus:ring-[#3AF4EF]/50 focus:outline-none
                "
                  autoComplete="off"
                />
                <Search
                  className="
                  absolute top-1/2 right-3 size-4 -translate-y-1/2
                  cursor-pointer text-primary/70 transition-colors
                  hover:text-primary
                "
                  onClick={(e) => {
                    e.preventDefault();
                    if (!searchQuery.trim()) return;
                    handleSearch();
                  }}
                />
                {/* Preview de cursos debajo del input */}
                {showPreview &&
                  (previewCourses.length > 0 || previewPrograms.length > 0) && (
                    <div className="absolute z-50 w-full">
                      <Suspense fallback={null}>
                        <CourseSearchPreview
                          courses={previewCourses}
                          programs={previewPrograms}
                          onSelectCourse={(courseId: number) => {
                            window.location.href = `/estudiantes/cursos/${courseId}`;
                          }}
                          onSelectProgram={(programId: string | number) => {
                            window.location.href = `/estudiantes/programas/${programId}`;
                          }}
                        />
                      </Suspense>
                    </div>
                  )}
              </div>
            </form>

            {/* Navigation & Auth */}
            <div
              className="
              mr-0 flex items-center gap-4
              md:-mr-8
            "
            >
              {/* Desktop Navigation */}
              <ul
                className="
                hidden items-center gap-1
                lg:flex
              "
              >
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      {item.label === 'Cursos' && hasActiveStudentAccess ? (
                        <div className="group relative">
                          <Link
                            href={item.href}
                            className={`
                            inline-flex items-center gap-1 rounded-lg border
                            px-3 py-2 text-sm font-medium transition-colors
                            focus-visible:outline-none
                            ${
                              isActive
                                ? `
                                  border-[#22C4D333] bg-[#22c4d31a]
                                  text-[#22C4D3]
                                `
                                : `
                                  border-transparent text-[#94A3B8]
                                  hover:border-[#22C4D333] hover:bg-[#22c4d31a]
                                  hover:text-[#22C4D3]
                                  focus-visible:border-[#22C4D333]
                                  focus-visible:bg-[#22c4d31a]
                                  focus-visible:text-[#22C4D3]
                                `
                            }
                          `}
                          >
                            {item.label}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="
                              mt-0.5 size-3.5 transition-transform duration-200
                              group-hover:rotate-180
                            "
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </Link>

                          <div
                            className="
                            invisible absolute top-full left-0 z-50 mt-3
                            w-[360px] rounded-xl border border-border/60
                            bg-[#061c37] p-3 opacity-0 shadow-2xl transition-all
                            duration-200
                            group-focus-within:visible
                            group-focus-within:opacity-100
                            group-hover:visible group-hover:opacity-100
                          "
                          >
                            <div className="space-y-1">
                              <Link
                                href="/estudiantes/myaccount"
                                className="
                                group/item flex items-center gap-3 rounded-lg
                                px-3 py-2.5 transition-colors
                                hover:bg-primary/10
                              "
                              >
                                <div
                                  className="
                                  flex size-8 items-center justify-center
                                  rounded-lg bg-primary/15 transition-colors
                                  group-hover/item:bg-primary/25
                                "
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-4 text-primary"
                                  >
                                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                                    <path d="M22 10v6" />
                                    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                                  </svg>
                                </div>
                                <div>
                                  <p
                                    className="
                                    text-sm font-medium text-foreground
                                  "
                                  >
                                    Mis Cursos
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Cursos y programas inscritos
                                  </p>
                                </div>
                              </Link>

                              <div className="mx-2 my-1 h-px bg-border/40" />

                              <p
                                className="
                                px-3 pt-1 pb-1.5 text-[10px] font-semibold
                                tracking-wider text-muted-foreground uppercase
                              "
                              >
                                Continuar viendo
                              </p>

                              {continueCourses.length > 0 ? (
                                continueCourses.map((course) => {
                                  const targetLessonId =
                                    course.lastUnlockedLessonId ??
                                    course.continueLessonId ??
                                    course.firstLessonId ??
                                    null;
                                  const courseHref = targetLessonId
                                    ? `/estudiantes/clases/${targetLessonId}`
                                    : `/estudiantes/cursos/${course.id}`;
                                  const progress = Math.min(
                                    Math.max(
                                      Math.round(course.progress ?? 0),
                                      0
                                    ),
                                    100
                                  );
                                  return (
                                    <Link
                                      key={course.id}
                                      href={courseHref}
                                      className="
                                      group/item flex items-center gap-3
                                      rounded-lg px-3 py-2 transition-colors
                                      hover:bg-secondary/60
                                    "
                                    >
                                      <div
                                        className="
                                        size-10 shrink-0 overflow-hidden
                                        rounded-lg border border-border/30
                                      "
                                      >
                                        <Image
                                          src={getCourseImageUrl(
                                            course.coverImageKey
                                          )}
                                          alt={course.title ?? 'Curso'}
                                          width={40}
                                          height={40}
                                          className="size-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className="
                                          truncate text-xs font-medium
                                          text-foreground
                                        "
                                        >
                                          {course.title ?? 'Curso'}
                                        </p>
                                        <div
                                          className="
                                          mt-0.5 flex items-center gap-2
                                        "
                                        >
                                          <div
                                            className="
                                            h-1 flex-1 overflow-hidden
                                            rounded-full bg-muted
                                          "
                                          >
                                            <div
                                              className="
                                              h-full rounded-full bg-primary
                                            "
                                              style={{ width: `${progress}%` }}
                                            />
                                          </div>
                                          <span
                                            className="
                                            text-[10px] text-muted-foreground
                                          "
                                          >
                                            {progress}%
                                          </span>
                                        </div>
                                      </div>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="
                                        size-3.5 text-primary opacity-0
                                        transition-opacity
                                        group-hover/item:opacity-100
                                      "
                                      >
                                        <polygon points="6 3 20 12 6 21 6 3" />
                                      </svg>
                                    </Link>
                                  );
                                })
                              ) : (
                                <div
                                  className="
                                  px-3 py-2 text-xs text-muted-foreground
                                "
                                >
                                  Aún no tienes cursos en progreso.
                                </div>
                              )}

                              <div className="mx-2 my-1 h-px bg-border/40" />

                              <Link
                                href="/estudiantes/myaccount"
                                className="
                                flex items-center justify-center gap-1.5
                                rounded-lg px-3 py-2 text-xs font-medium
                                text-primary transition-colors
                                hover:bg-primary/10
                              "
                              >
                                Ver todos mis cursos
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="size-3 -rotate-90"
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`
                          rounded-lg border px-3 py-2 text-sm font-medium
                          transition-colors
                          focus-visible:outline-none
                          ${
                            isActive
                              ? `
                                border-[#22C4D333] bg-[#22c4d31a] text-[#22C4D3]
                              `
                              : `
                                border-transparent text-[#94A3B8]
                                hover:border-[#22C4D333] hover:bg-[#22c4d31a]
                                hover:text-[#22C4D3]
                                focus-visible:border-[#22C4D333]
                                focus-visible:bg-[#22c4d31a]
                                focus-visible:text-[#22C4D3]
                              `
                          }
                        `}
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Auth Button */}
              {renderAuthButton()}
            </div>
          </div>
        ) : null}

        {isMobileViewport ? (
          <div
            className="
              fixed inset-x-0 top-[var(--subscription-banner-height,0px)]
              z-[100000] flex h-16 items-center justify-between overflow-hidden
              border-b border-[#1d283a] bg-[#01152d] px-5
              md:hidden
            "
          >
            <div className="flex min-w-16 items-center justify-start">
              <div className="campana-header mobile-notification-shell relative">
                <NotificationHeader />
              </div>
            </div>

            <Link
              href="/"
              aria-label="Ir al inicio"
              className="
              absolute left-1/2 flex size-9 -translate-x-1/2 items-center
              justify-center
            "
            >
              <Image
                src="/artiefy-icon.png"
                alt="Artiefy"
                width={36}
                height={36}
                priority
                className="size-9 object-contain"
              />
            </Link>

            <div className="flex min-w-16 items-center justify-end gap-3">
              <button
                type="button"
                aria-label={
                  showMobileSearch ? 'Cerrar búsqueda' : 'Abrir búsqueda'
                }
                aria-expanded={showMobileSearch}
                className="
                inline-flex size-10 items-center justify-center rounded-full
                text-white transition
                hover:bg-white/10 hover:text-primary
                focus-visible:ring-2 focus-visible:ring-primary
                focus-visible:outline-none
              "
                onClick={() => {
                  setShowMobileSearch((prev) => !prev);
                  setMobileMenuOpen(false);
                }}
              >
                <Search className="size-5" />
              </button>
              <button
                type="button"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="
                inline-flex size-10 items-center justify-center rounded-full
                text-white transition
                hover:bg-white/10 hover:text-primary
                focus-visible:ring-2 focus-visible:ring-primary
                focus-visible:outline-none
              "
                onClick={() => {
                  setMobileMenuOpen((prev) => {
                    const next = !prev;
                    if (next) setShowMobileSearch(false);
                    return next;
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="7" y2="7" />
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="17" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {isMobileViewport && showMobileSearch && (
        <div
          className="
            fixed inset-x-0
            top-[calc(var(--subscription-banner-height,0px)+4rem)] z-[99999] border-b border-gray-700 bg-[#01152d] p-4
            md:hidden
          "
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
              setShowMobileSearch(false);
            }}
            className="relative w-full"
          >
            <input
              type="search"
              placeholder="¡Aprende con IA!"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full rounded-2xl border border-[#1f2937] bg-[#1D283A80] px-10
                py-3 text-sm text-foreground transition-all
                placeholder:text-gray-400
                hover:border-[#334155]
                focus:border-[#3AF4EF] focus:bg-[#1D283A80] focus:ring-2
                focus:ring-[#3AF4EF]/50 focus:outline-none
              "
              autoComplete="off"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => {
                if (!searchQuery.trim()) return;
                handleSearch();
                setShowMobileSearch(false);
              }}
              aria-label="Buscar"
            >
              <Search className="size-4 text-primary/70" />
            </button>
            <button
              type="button"
              className="absolute top-1/2 left-3 -translate-y-1/2"
              onClick={() => setShowMobileSearch(false)}
              aria-label="Cerrar búsqueda"
            >
              <X className="size-4 text-primary/70" />
            </button>
            {showPreview &&
              (previewCourses.length > 0 || previewPrograms.length > 0) && (
                <div className="mt-3 w-full">
                  <Suspense fallback={null}>
                    <CourseSearchPreview
                      courses={previewCourses}
                      programs={previewPrograms}
                      onSelectCourse={(courseId: number) => {
                        window.location.href = `/estudiantes/cursos/${courseId}`;
                      }}
                      onSelectProgram={(programId: string | number) => {
                        window.location.href = `/estudiantes/programas/${programId}`;
                      }}
                    />
                  </Suspense>
                </div>
              )}
          </form>
        </div>
      )}
      {isMobileViewport && mobileMenuOpen ? (
        <div
          className="
            fixed inset-0 z-[99999] overscroll-contain
            md:hidden
          "
        >
          <button
            type="button"
            className="
              fixed inset-0 cursor-default appearance-none border-0 bg-black/55
              p-0
            "
            aria-label="Cerrar menú"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            tabIndex={-1}
            className="
              fixed inset-y-0 right-0 z-[99999] flex h-[100svh] max-h-[100svh]
              w-[min(86vw,22rem)] flex-col overflow-hidden bg-[#01152d] px-6
              pt-[calc(env(safe-area-inset-top)+1.5rem)] shadow-2xl
              sm:w-[80%] sm:max-w-sm sm:px-7
            "
          >
            <div className="mb-6 flex w-full items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Image
                  src="/artiefy-icon.png"
                  alt="Artiefy"
                  width={36}
                  height={36}
                  className="size-9 object-contain"
                />
                <span className="text-xl font-bold text-primary">Artiefy</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="
                rounded-full p-1 text-slate-300 transition
                hover:bg-white/10 hover:text-white
                focus:outline-none
                focus-visible:ring-2 focus-visible:ring-primary
              "
                aria-label="Close menu"
              >
                <XMarkIconSolid className="size-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="relative">
                <Search
                  className="
                  absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400
                "
                />
                <input
                  type="search"
                  placeholder="Buscar"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch();
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="
                  h-12 w-full rounded-xl border border-white/5 bg-white/7 pr-4
                  pl-12 text-sm text-white outline-none
                  placeholder:text-slate-400
                  focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                "
                />
              </div>
              {showPreview &&
                (previewCourses.length > 0 || previewPrograms.length > 0) && (
                  <div className="mt-3 max-h-[42dvh] overflow-y-auto rounded-xl">
                    <Suspense fallback={null}>
                      <CourseSearchPreview
                        courses={previewCourses}
                        programs={previewPrograms}
                        onSelectCourse={(courseId: number) => {
                          setMobileMenuOpen(false);
                          window.location.href = `/estudiantes/cursos/${courseId}`;
                        }}
                        onSelectProgram={(programId: string | number) => {
                          setMobileMenuOpen(false);
                          window.location.href = `/estudiantes/programas/${programId}`;
                        }}
                      />
                    </Suspense>
                  </div>
                )}
            </div>
            <div
              className="
              min-h-0 flex-1 overflow-y-auto overscroll-contain
              pb-[clamp(1rem,3dvh,1.75rem)]
            "
            >
              <nav>
                <ul className="space-y-2.5">
                  {visibleMobileNavItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/' &&
                        !item.href.includes('#') &&
                        pathname.startsWith(item.href));
                    const Icon = item.icon;
                    if (item.label === 'Espacios') {
                      return (
                        <li key={item.href}>
                          <button
                            type="button"
                            className={`
                            flex w-full items-center gap-4 rounded-xl px-4
                            py-2.5
                            text-left text-base font-semibold transition
                            outline-none
                            active:scale-95
                            ${
                              isActive
                                ? 'bg-primary/12 text-primary'
                                : `
                                  text-slate-400
                                  hover:bg-white/7 hover:text-white
                                `
                            }
                          `}
                            onClick={(e) => {
                              setMobileMenuOpen(false);
                              handleEspaciosClick(e);
                            }}
                          >
                            <Icon className="size-5 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    }
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`
                          flex w-full items-center gap-4 rounded-xl px-4
                          py-2.5
                          text-base font-semibold transition
                          active:scale-95
                          ${
                            isActive
                              ? 'bg-primary/12 text-primary'
                              : `
                                text-slate-400
                                hover:bg-white/7 hover:text-white
                              `
                          }
                        `}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="size-5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              {!isSignedIn ? (
                <button
                  type="button"
                  onClick={handleOpenLoginModal}
                  className="
                    mt-6 flex h-12 w-full items-center justify-center rounded-xl
                    bg-primary text-sm font-semibold text-[#01152d] transition
                    hover:bg-primary/90
                    active:scale-95
                  "
                >
                  Acceder
                </button>
              ) : null}
            </div>
            {isSignedIn ? (
              <div
                className="
                  shrink-0 border-t border-white/8 pt-4
                  pb-[calc(env(safe-area-inset-bottom)+1.25rem)]
                "
              >
                <div className="flex min-h-12 items-center justify-center">
                  <Suspense
                    fallback={<Icons.spinner className="size-5 text-primary" />}
                  >
                    <UserButtonWrapper />
                  </Suspense>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      <MiniLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => setShowLoginModal(false)}
        redirectUrl={pathname || '/'}
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          setShowSignUpModal(true);
        }}
      />

      <MiniSignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSignUpSuccess={() => setShowSignUpModal(false)}
        redirectUrl={pathname || '/'}
        onSwitchToLogin={() => {
          setShowSignUpModal(false);
          setShowLoginModal(true);
        }}
      />
    </nav>
  );
}
