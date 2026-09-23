'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Show, useAuth, useUser } from '@clerk/nextjs';
import { type OAuthStrategy } from '@clerk/shared/types';
import {
  ChevronDown,
  CreditCard,
  Home,
  LogIn,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { FaCrown } from 'react-icons/fa';
import { IoSettingsOutline } from 'react-icons/io5';
import useSWR from 'swr';

import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import MiniSignUpModal from '~/components/estudiantes/layout/MiniSignUpModal';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { ensureCurrentUserStudentRole, getUserRole } from '~/utils/roles';

import { UserButtonWrapper } from '../auth/UserButtonWrapper';

import { ArtieSearchDropdown } from './search/ArtieSearchDropdown';
import { NeonSearchShell } from './search/NeonSearchShell';
import { useArtieSearch } from './search/useArtieSearch';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationHeader } from './NotificationHeader';

import type { EnrolledCourse } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import type { CatalogSearchResult } from '~/server/actions/estudiantes/search/searchCatalogPreview';

import '~/styles/barsicon.css';

export function Header({
  onEspaciosClickAction,
}: {
  onEspaciosClickAction?: () => void;
}) {
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isLoading: searchLoading,
    isOpen: isSearchOpen,
    open: openSearch,
    reset: resetSearch,
    containerRef: searchContainerRef,
  } = useArtieSearch();
  const [showEspaciosModal, setShowEspaciosModal] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [activeAuthModal, setActiveAuthModal] = useState<
    'login' | 'signup' | null
  >(null);
  const [oauthSignUpStrategy, setOauthSignUpStrategy] =
    useState<OAuthStrategy | null>(null);
  // Snapshot of "now" for the subscription-expiry check below, captured
  // once instead of calling Date.now() during render.
  const [now] = useState(() => Date.now());

  const { isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const userRole = getUserRole(user?.publicMetadata?.role);
  const desktopSignInHref = `/sign-in?redirect_url=${encodeURIComponent(
    pathname || '/'
  )}`;
  const isSignedIn = Boolean(user);

  // `href: null` items are shown but have no destination yet.
  const leftNavItems = [
    { href: '/', label: 'Inicio' },
    { href: '/estudiantes', label: 'Explorar' },
    { href: '/proyectos', label: 'Proyectos' },
    { href: null, label: 'Educación' },
  ];
  const rightNavItems = [
    { href: '/planes', label: 'Planes' },
    { href: '/comunidad', label: 'Espacios' },
  ];
  const brandMenuRef = useRef<HTMLDivElement>(null);

  const planType = user?.publicMetadata?.planType as string | undefined;
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as
    string | undefined;
  const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
    string | undefined;

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

  const profileName =
    user?.fullName ?? user?.firstName ?? user?.username ?? 'Mi perfil';
  const subscriptionEndTime = subscriptionEndDate
    ? new Date(subscriptionEndDate).getTime()
    : null;
  const hasActivePremiumPlan =
    planType?.toLowerCase() === 'premium' &&
    subscriptionStatus === 'active' &&
    (subscriptionEndTime === null ||
      (!Number.isNaN(subscriptionEndTime) && subscriptionEndTime > now));

  const renderProfileLink = () => (
    <Link
      href="/estudiantes/perfil"
      aria-label={`Ir al perfil de ${profileName}`}
      className="
        flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1
        text-muted-foreground transition-all duration-200
        hover:bg-muted/50 hover:text-foreground
        focus-visible:ring-2 focus-visible:ring-primary
        focus-visible:outline-none
      "
    >
      {user?.imageUrl ? (
        <Image
          src={user.imageUrl}
          alt=""
          width={28}
          height={28}
          className="
            size-7 shrink-0 rounded-full border border-border/30 object-cover
            shadow-[0_0_10px_rgb(34_196_211/0.15)]
          "
        />
      ) : (
        <span
          aria-hidden="true"
          className="
            flex size-7 shrink-0 items-center justify-center rounded-full border
            border-border/30 bg-primary/15 text-xs font-semibold text-primary
          "
        >
          {profileName.charAt(0).toUpperCase()}
        </span>
      )}
      <span
        className="
          hidden max-w-[96px] truncate text-xs font-medium
          xl:block
        "
      >
        {profileName}
      </span>
      {hasActivePremiumPlan ? (
        <FaCrown
          className="size-3 shrink-0 text-amber-400"
          aria-label="Premium"
        />
      ) : null}
    </Link>
  );

  const renderAccountMenuButton = (floating = false) => (
    <div
      className={`
        group/account relative flex shrink-0 items-center justify-center
        overflow-hidden transition-colors
        focus-within:ring-2 focus-within:ring-primary
        focus-within:ring-offset-2 focus-within:ring-offset-background
        ${
          floating
            ? `
              liquid-glass mobile-header-floating-control size-10 rounded-full
              border border-white/10 !bg-[#01152d]/55 !backdrop-blur-2xl
              !backdrop-saturate-150
              hover:!border-primary hover:!bg-primary
            `
            : `
              size-7 rounded-lg
              hover:bg-muted/50
            `
        }
      `}
      title="Abrir menú de cuenta"
    >
      <span
        className={`
          pointer-events-none absolute inset-0 z-[1] flex items-center
          justify-center text-muted-foreground transition-colors
          ${
            floating
              ? 'group-hover/account:text-slate-950'
              : 'group-hover/account:text-foreground'
          }
        `}
      >
        <IoSettingsOutline
          className={floating ? 'size-[22px]' : 'size-4'}
          aria-hidden="true"
        />
      </span>
      <div className="absolute inset-0 opacity-0 [&_.cl-rootBox]:!size-full [&_.cl-rootBox]:!max-w-full [&_.cl-rootBox]:!min-w-0 [&_.cl-userButtonBox]:!size-full [&_.cl-userButtonBox]:!max-w-full [&_.cl-userButtonBox]:!min-w-0 [&_.cl-userButtonBox]:!justify-center [&_.cl-userButtonOuterIdentifier]:!hidden [&_.cl-userButtonTrigger]:!size-full [&_.cl-userButtonTrigger]:!max-w-full [&_.cl-userButtonTrigger]:!min-w-0 [&_.cl-userButtonTrigger]:!p-0 [&>div]:!size-full">
        <Suspense fallback={null}>
          <UserButtonWrapper hidePlanBadge />
        </Suspense>
      </div>
    </div>
  );

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

  // Enter / "Crear un proyecto" hands the idea to Artie through the global
  // search event, the same contract the /estudiantes search uses.
  const handleCreateWithArtie = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    window.dispatchEvent(
      new CustomEvent('artiefy-search', { detail: { query } })
    );
    resetSearch();
    setShowMobileSearch(false);
  };

  const handleSelectResult = (result: CatalogSearchResult) => {
    if (result.isComingSoon) return;
    resetSearch();
    setShowMobileSearch(false);
    router.push(result.href);
  };

  const navLinkClass = (isActive: boolean) => `
    group/nav relative block whitespace-nowrap rounded-md px-2 py-1.5 text-xs
    font-medium transition-colors duration-200
    hover:text-foreground
    focus-visible:text-foreground focus-visible:outline-none
    ${isActive ? 'text-primary' : 'text-muted-foreground'}
  `;

  const navUnderline = (
    <span
      aria-hidden="true"
      className="
        absolute inset-x-2 -bottom-0.5 h-px scale-x-0 bg-primary
        transition-transform duration-200
        group-hover/nav:scale-x-100 group-focus-visible/nav:scale-x-100
      "
    />
  );

  const renderNavItem = (item: { href: string | null; label: string }) => {
    const { href } = item;
    if (!href) {
      return (
        <li key={item.label}>
          <button
            type="button"
            aria-disabled="true"
            title="Próximamente"
            className={navLinkClass(false)}
          >
            {item.label}
            {navUnderline}
          </button>
        </li>
      );
    }

    const isActive =
      pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
      <li key={item.label}>
        {item.label === 'Explorar' && hasActiveStudentAccess ? (
          <div className="group relative">
            <Link
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={navLinkClass(isActive)}
            >
              {item.label}
              {navUnderline}
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
                      Math.max(Math.round(course.progress ?? 0), 0),
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
                            src={getCourseImageUrl(course.coverImageKey)}
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
                                style={{
                                  width: `${progress}%`,
                                }}
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
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={navLinkClass(isActive)}
          >
            {item.label}
            {navUnderline}
          </Link>
        )}
      </li>
    );
  };

  const renderAuthButton = () => {
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
                {/* Wide screens: a plain brand pill. Both variants call the
                    same handler, which opens the modal on phones and routes to
                    the sign-in page on desktop. */}
                <Button
                  className="
                    ml-2 hidden h-10 cursor-pointer items-center justify-center
                    gap-2 rounded-full border border-primary bg-primary px-5
                    text-sm font-semibold whitespace-nowrap text-background
                    transition-all duration-200
                    hover:bg-background hover:text-primary
                    hover:shadow-[0_0_24px_2px_rgba(0,189,216,0.55)]
                    active:scale-95
                    md:inline-flex
                  "
                  type="button"
                  onClick={handleOpenLoginModal}
                >
                  <LogIn className="size-4" />
                  Iniciar sesión
                </Button>

                {/* Phones keep the skewed neon treatment. */}
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
              <div className="hidden shrink-0 items-center gap-0.5 md:flex">
                <div className="relative">
                  <NotificationHeader compact />
                </div>
                {renderAccountMenuButton()}
                {renderProfileLink()}
              </div>
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
    setBrandMenuOpen(false);
    setShowMobileSearch(false);

    if (isMobileViewport) {
      setOauthSignUpStrategy(null);
      setActiveAuthModal('login');
      return;
    }

    router.push(desktopSignInHref);
  };

  const handleSwitchToSignUp = (strategy?: OAuthStrategy) => {
    setOauthSignUpStrategy(strategy ?? null);
    setActiveAuthModal('signup');
  };

  const handleSwitchToLogin = () => {
    setOauthSignUpStrategy(null);
    setActiveAuthModal('login');
  };

  useEffect(() => {
    if (!brandMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBrandMenuOpen(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (!brandMenuRef.current?.contains(event.target as Node)) {
        setBrandMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [brandMenuOpen]);

  return (
    <>
      <nav
        className="
        fixed inset-x-0 z-[100] mb-0 w-full bg-transparent
        md:border-b md:border-border/30 md:bg-background/60
        md:backdrop-blur-md
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
          aria-hidden="true"
          className="
          absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r
          from-transparent via-primary/60 to-transparent
          md:block
        "
        />
        <div
          className="
          container mx-auto flex h-16 max-w-screen-2xl items-center px-4
          sm:px-6
          md:h-14
        "
        >
          {!isMobileViewport ? (
            <div
              className="
              hidden w-full grid-cols-[minmax(max-content,1fr)_minmax(220px,430px)_minmax(max-content,1fr)]
              items-center gap-5
              md:grid
            "
            >
              <div className="flex min-w-0 items-center gap-1">
                <Link href="/" className="mr-2 flex shrink-0 items-center">
                  <Image
                    src="/artiefy-logo.svg"
                    alt="Artiefy"
                    width={96}
                    height={24}
                    unoptimized
                    className="h-6 w-auto"
                  />
                </Link>
                <ul
                  className="
                hidden min-w-0 items-center gap-0.5
                lg:flex
              "
                >
                  {leftNavItems.map(renderNavItem)}
                </ul>
              </div>

              <form
                ref={searchContainerRef}
                onSubmit={handleCreateWithArtie}
                className="relative w-full"
              >
                <NeonSearchShell>
                  <Search
                    aria-hidden="true"
                    className="
                  size-3.5 shrink-0 text-muted-foreground transition-colors
                  duration-300
                  group-focus-within:text-primary
                "
                  />
                  <input
                    type="search"
                    placeholder="¿Qué quieres hacer?"
                    aria-label="Buscar o crear con Artie"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      openSearch();
                    }}
                    onFocus={openSearch}
                    className="
                  neon-search-input ml-2.5 size-full bg-transparent text-xs
                  text-foreground outline-none
                  placeholder:text-muted-foreground
                "
                    autoComplete="off"
                  />
                </NeonSearchShell>
                {isSearchOpen && (
                  <ArtieSearchDropdown
                    query={searchQuery}
                    results={searchResults}
                    isLoading={searchLoading}
                    onCreate={() => handleCreateWithArtie()}
                    onSelect={handleSelectResult}
                  />
                )}
              </form>

              <div className="flex min-w-0 items-center justify-end gap-0.5">
                <ul
                  className="
                mr-1 hidden min-w-0 items-center gap-0.5
                lg:flex
              "
                >
                  {rightNavItems.map(renderNavItem)}
                </ul>

                {renderAuthButton()}
              </div>
            </div>
          ) : null}

          {/* Solid backdrop behind the floating top row: only when the mobile
              search is open, so the header + search read as a single panel
              instead of letting the hero show between the floating buttons. */}
          {isMobileViewport && showMobileSearch ? (
            <div
              aria-hidden
              className="
              pointer-events-none fixed inset-x-0
              top-[var(--subscription-banner-height,0px)]
              z-[99990] h-[calc(env(safe-area-inset-top,0px)+4rem)]
              bg-[#01152d]
              md:hidden
            "
            />
          ) : null}
          {isMobileViewport ? (
            <div
              className="
              pointer-events-none fixed inset-x-0
              top-[calc(var(--subscription-banner-height,0px)+env(safe-area-inset-top,0px)+0.75rem)]
              z-[100000] flex h-16 items-center justify-between gap-2
              bg-transparent px-4
              md:hidden
            "
            >
              {/* Brand button: opens a small dropdown (Inicio / Espacios / Planes) */}
              <div ref={brandMenuRef} className="pointer-events-auto relative">
                <button
                  type="button"
                  aria-label="Menú Artiefy"
                  aria-expanded={brandMenuOpen}
                  aria-controls="mobile-brand-menu"
                  className="
                  liquid-glass mobile-header-floating-control flex items-center
                  gap-2 rounded-full !bg-[#01152d]/55 py-1.5 pr-3
                  pl-1.5 !backdrop-blur-2xl !backdrop-saturate-150 transition-transform active:scale-95
                "
                  onClick={() => {
                    setBrandMenuOpen((prev) => {
                      const next = !prev;
                      if (next) setShowMobileSearch(false);
                      return next;
                    });
                  }}
                >
                  <span
                    className="
                    flex size-7 items-center justify-center rounded-full
                    bg-[#22c4d3]
                    shadow-[0_0_10px_rgba(34,196,211,0.4)]
                  "
                  >
                    <span className="text-sm leading-none font-bold text-[#080c16]">
                      A
                    </span>
                  </span>
                  <span
                    className="
                    bg-gradient-to-r from-primary to-[#3AF4EF] bg-clip-text
                    text-sm font-bold text-transparent
                  "
                  >
                    Artiefy
                  </span>
                  <ChevronDown
                    className={`
                    size-3.5 text-muted-foreground transition-transform
                    ${brandMenuOpen ? 'rotate-180' : ''}
                  `}
                  />
                </button>

                {brandMenuOpen ? (
                  <div
                    id="mobile-brand-menu"
                    role="menu"
                    className="
                    absolute top-full left-0 z-50 mt-2 min-w-[180px]
                    rounded-2xl border border-white/10 bg-[rgba(1,21,45,0.7)]
                    p-1.5 shadow-2xl backdrop-blur-lg backdrop-saturate-150
                  "
                  >
                    <Link
                      href="/"
                      role="menuitem"
                      onClick={() => setBrandMenuOpen(false)}
                      className="
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
                      font-medium text-foreground transition-colors
                      hover:bg-primary/10 hover:text-primary
                    "
                    >
                      <Home className="size-4" />
                      Inicio
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={(e) => {
                        setBrandMenuOpen(false);
                        handleEspaciosClick(e);
                      }}
                      className="
                      flex w-full items-center gap-3 rounded-xl px-3 py-2.5
                      text-left text-sm font-medium text-foreground
                      transition-colors
                      hover:bg-primary/10 hover:text-primary
                    "
                    >
                      <MapPin className="size-4" />
                      Espacios
                    </button>
                    <Link
                      href="/planes"
                      role="menuitem"
                      onClick={() => setBrandMenuOpen(false)}
                      className="
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
                      font-medium text-foreground transition-colors
                      hover:bg-primary/10 hover:text-primary
                    "
                    >
                      <CreditCard className="size-4" />
                      Planes
                    </Link>
                  </div>
                ) : null}
              </div>

              {/* Auth area */}
              {!mounted || !isAuthLoaded ? (
                <Icons.spinner className="size-5 text-primary" />
              ) : (
                <>
                  <Show when="signed-out">
                    <button
                      type="button"
                      aria-label="Iniciar sesión"
                      className="
                      pointer-events-auto flex h-10 items-center gap-2
                      rounded-full bg-[#22c4d3] px-4 text-[#080c16]
                      transition-all active:scale-95
                    "
                      style={{
                        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.22)',
                      }}
                      onClick={handleOpenLoginModal}
                    >
                      <LogIn className="size-4" />
                      <span className="text-sm font-medium">
                        Iniciar sesión
                      </span>
                    </button>
                  </Show>

                  <Show when="signed-in">
                    <div className="pointer-events-auto flex items-center gap-2">
                      <div
                        className="
                        campana-header liquid-glass
                        mobile-header-floating-control relative
                        flex
                        size-10 items-center justify-center rounded-full
                        !bg-[#01152d]/55 !backdrop-blur-2xl !backdrop-saturate-150
                      "
                      >
                        <NotificationHeader />
                      </div>
                      {renderAccountMenuButton(true)}
                    </div>
                  </Show>
                </>
              )}
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
              ref={searchContainerRef}
              onSubmit={handleCreateWithArtie}
              className="relative w-full"
            >
              <NeonSearchShell>
                <button
                  type="button"
                  className="shrink-0"
                  onClick={() => {
                    resetSearch();
                    setShowMobileSearch(false);
                  }}
                  aria-label="Cerrar búsqueda"
                >
                  <X className="size-4 text-primary/70" />
                </button>
                <input
                  type="search"
                  placeholder="¿Qué quieres hacer?"
                  aria-label="Buscar o crear con Artie"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    openSearch();
                  }}
                  onFocus={openSearch}
                  className="
                  neon-search-input mx-2.5 size-full bg-transparent text-sm
                  text-foreground outline-none
                  placeholder:text-muted-foreground
                "
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="shrink-0"
                  aria-label="Crear con Artie"
                >
                  <Search className="size-4 text-primary/70" />
                </button>
              </NeonSearchShell>
              {isSearchOpen && (
                <ArtieSearchDropdown
                  query={searchQuery}
                  results={searchResults}
                  isLoading={searchLoading}
                  onCreate={() => handleCreateWithArtie()}
                  onSelect={handleSelectResult}
                />
              )}
            </form>
          </div>
        )}
        <MiniLoginModal
          isOpen={isMobileViewport && activeAuthModal === 'login'}
          onClose={() => setActiveAuthModal(null)}
          onLoginSuccess={() => setActiveAuthModal(null)}
          redirectUrl={pathname || '/'}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
        <MiniSignUpModal
          isOpen={isMobileViewport && activeAuthModal === 'signup'}
          onClose={() => {
            setActiveAuthModal(null);
            setOauthSignUpStrategy(null);
          }}
          onSignUpSuccess={() => {
            setActiveAuthModal(null);
            setOauthSignUpStrategy(null);
          }}
          redirectUrl={pathname || '/'}
          autoStartOAuthStrategy={oauthSignUpStrategy}
          onAutoStartOAuthHandled={() => setOauthSignUpStrategy(null)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </nav>
      {/* Global mobile spacer: tops up the clearance every route needs for the
          floating header's safe-area + offset, so content is never covered on
          initial load. Pure CSS (md:hidden) so it's SSR-stable; the header
          itself stays fixed and scrolls normally. */}
      <div
        aria-hidden
        className="h-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:hidden"
      />
      {isMobileViewport ? (
        <MobileBottomNav
          isSignedIn={isSignedIn}
          onSearchClick={() => {
            // Toggle: the same magnifier opens and closes the mobile search.
            setShowMobileSearch((prev) => !prev);
            setBrandMenuOpen(false);
          }}
          onLoginClick={handleOpenLoginModal}
        />
      ) : null}
    </>
  );
}
