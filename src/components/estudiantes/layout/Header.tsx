'use client';
import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Show, useAuth, useUser } from '@clerk/nextjs';
import { type OAuthStrategy } from '@clerk/shared/types';
import {
  BookOpen,
  ChevronDown,
  CreditCard,
  Folder,
  Home,
  Layers,
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
import {
  getCreateEntryRoute,
  requestCreateEntry,
} from '~/lib/creation/createEntryBus';
import { ensureCurrentUserStudentRole, getUserRole } from '~/utils/roles';

import { UserButtonWrapper } from '../auth/UserButtonWrapper';

import { AnimatedPlaceholder } from './search/AnimatedPlaceholder';
import { ArtieSearchDropdown } from './search/ArtieSearchDropdown';
import { NeonSearchShell } from './search/NeonSearchShell';
import { useArtieSearch } from './search/useArtieSearch';
import { useRotatingPlaceholder } from './search/useRotatingPlaceholder';
import { ComingSoonDialog } from './ComingSoonDialog';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationHeader } from './NotificationHeader';

import type { EnrolledCourse } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import type { CatalogSearchResult } from '~/server/actions/estudiantes/search/searchCatalogPreview';

import '~/styles/barsicon.css';

const SEARCH_PLACEHOLDERS = [
  '¿Qué quieres hacer?',
  '¿Qué quieres crear?',
  '¿Cómo puedo ayudarte?',
] as const;

// Clerk's UserButton can't be opened from an external button, so the real
// trigger is rendered invisible on top of a custom visual and stretched to
// cover it; the click lands on Clerk and opens its menu.
const CLERK_TRIGGER_OVERLAY_CLASS =
  'absolute inset-0 opacity-0 [&_.cl-rootBox]:!size-full [&_.cl-rootBox]:!max-w-full [&_.cl-rootBox]:!min-w-0 [&_.cl-userButtonBox]:!size-full [&_.cl-userButtonBox]:!max-w-full [&_.cl-userButtonBox]:!min-w-0 [&_.cl-userButtonBox]:!justify-center [&_.cl-userButtonOuterIdentifier]:!hidden [&_.cl-userButtonTrigger]:!size-full [&_.cl-userButtonTrigger]:!max-w-full [&_.cl-userButtonTrigger]:!min-w-0 [&_.cl-userButtonTrigger]:!p-0 [&>div]:!size-full';

/** Scroll distance after which the header gets its background. */
const HEADER_SOLID_AFTER_PX = 8;

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};
const getIsScrolled = () => window.scrollY > HEADER_SOLID_AFTER_PX;
// The server renders the page at the top, so the header starts transparent.
const getIsScrolledOnServer = () => false;

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
  const searchPlaceholder = useRotatingPlaceholder(SEARCH_PLACEHOLDERS);
  const placeholderOverlay = searchQuery ? null : (
    <AnimatedPlaceholder
      text={searchPlaceholder.text}
      phase={searchPlaceholder.phase}
    />
  );
  const [showEspaciosModal, setShowEspaciosModal] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [activeAuthModal, setActiveAuthModal] = useState<
    'login' | 'signup' | null
  >(null);
  const [oauthSignUpStrategy, setOauthSignUpStrategy] =
    useState<OAuthStrategy | null>(null);
  // "Now" for the subscription-expiry check below. Read after hydration, never
  // during render: with Cache Components, Date.now() while prerendering a
  // Client Component aborts the build.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const { isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const userRole = getUserRole(user?.publicMetadata?.role);
  const desktopSignInHref = `/sign-in?redirect_url=${encodeURIComponent(
    pathname || '/'
  )}`;
  const isSignedIn = Boolean(user);

  // Shared by the desktop bar and the mobile brand menu, so both always show
  // the same names and routes. The icons are only drawn on mobile.
  const leftNavItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/proyectos', label: 'Proyectos', icon: Folder },
    { href: '/explorar', label: 'Explorar', icon: Layers },
    { href: '/estudiantes', label: 'Educación', icon: BookOpen },
  ];
  const rightNavItems = [
    { href: '/planes', label: 'Planes', icon: CreditCard },
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
      (!Number.isNaN(subscriptionEndTime) &&
        now !== null &&
        subscriptionEndTime > now));

  const renderProfileMenuButton = () => (
    <div
      title="Abrir menú de cuenta"
      className="
        group/profile relative flex min-w-0 items-center rounded-lg
        transition-all duration-200
        focus-within:ring-2 focus-within:ring-primary
        hover:bg-muted/50
      "
    >
      <span
        className="
          pointer-events-none flex min-w-0 items-center gap-2 px-1.5 py-1
          text-muted-foreground transition-colors
          group-hover/profile:text-foreground
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
              flex size-7 shrink-0 items-center justify-center rounded-full
              border border-border/30 bg-primary/15 text-xs font-semibold
              text-primary
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
      </span>
      <div className={CLERK_TRIGGER_OVERLAY_CLASS}>
        <Suspense fallback={null}>
          <UserButtonWrapper hidePlanBadge />
        </Suspense>
      </div>
    </div>
  );

  const renderMobileAccountMenuButton = () => (
    <div
      className="
        group/account liquid-glass mobile-header-floating-control relative flex
        size-10 shrink-0 items-center justify-center overflow-hidden
        rounded-full border border-white/10 !bg-[#01152d]/55
        !backdrop-blur-2xl !backdrop-saturate-150 transition-colors
        focus-within:ring-2 focus-within:ring-primary
        focus-within:ring-offset-2 focus-within:ring-offset-background
        hover:!border-primary hover:!bg-primary
      "
      title="Abrir menú de cuenta"
    >
      <span
        className="
          pointer-events-none absolute inset-0 z-[1] flex items-center
          justify-center text-muted-foreground transition-colors
          group-hover/account:text-slate-950
        "
      >
        <IoSettingsOutline className="size-[22px]" aria-hidden="true" />
      </span>
      <div className={CLERK_TRIGGER_OVERLAY_CLASS}>
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

  // Transparent at the top of the page; the background and border fade in
  // once the page scrolls, so the hero shows through until then.
  const isScrolled = useSyncExternalStore(
    subscribeToScroll,
    getIsScrolled,
    getIsScrolledOnServer
  );

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

  // "Modo avanzado": the creation modals live on /proyectos, so the request
  // goes through the same bus as the mobile "+" sheet, carrying what was
  // typed as the project idea.
  const handleAdvancedCreate = () => {
    const idea = searchQuery.trim();
    resetSearch();
    setShowMobileSearch(false);

    if (isAuthLoaded && !user) {
      handleOpenLoginModal();
      return;
    }

    requestCreateEntry('project', { idea });
    const target = getCreateEntryRoute('project', pathname);
    if (target) router.push(target);
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
    ${isActive ? 'text-foreground' : 'text-muted-foreground'}
  `;

  // The current route keeps the underline the others only show on hover.
  const navUnderline = (isActive: boolean) => (
    <span
      aria-hidden="true"
      className={`
        absolute inset-x-2 -bottom-0.5 h-px bg-primary transition-transform
        duration-200
        group-hover/nav:scale-x-100 group-focus-visible/nav:scale-x-100
        ${isActive ? 'scale-x-100' : 'scale-x-0'}
      `}
    />
  );

  // Whole segments only, so '/proyectos' never lights up on a sibling route.
  const isNavActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  const renderNavItem = (item: { href: string; label: string }) => {
    const { href } = item;
    const isActive = isNavActive(href);

    return (
      <li key={item.label}>
        {item.label === 'Educación' && hasActiveStudentAccess ? (
          <div className="group relative">
            <Link
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={navLinkClass(isActive)}
            >
              {item.label}
              {navUnderline(isActive)}
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
            {navUnderline(isActive)}
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
                    transition-[transform,box-shadow] duration-200 ease-out
                    hover:scale-105
                    hover:shadow-[0_0_24px_2px_rgba(0,189,216,0.55)]
                    active:scale-95
                    motion-reduce:transition-none
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
                {renderProfileMenuButton()}
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
        className={`
          fixed inset-x-0 z-[100] mb-0 w-full border-b border-transparent
          bg-transparent transition-[background-color,border-color] duration-300
          ${
            isScrolled
              ? `
                md:border-border/30 md:bg-background/60 md:backdrop-blur-md
              `
              : ''
          }
        `}
        style={{ top: 'var(--subscription-banner-height, 0px)' }}
      >
        {/* Espacios is listed but not built yet: it only opens this notice. */}
        <ComingSoonDialog
          open={showEspaciosModal}
          onOpenChange={setShowEspaciosModal}
          feature="Espacios"
        />
        <div
          aria-hidden="true"
          className={`
          absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r
          from-transparent via-primary/60 to-transparent transition-opacity
          duration-300
          md:block
          ${isScrolled ? 'opacity-100' : 'opacity-0'}
        `}
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
                  <div className="relative ml-2.5 flex h-full min-w-0 flex-1 items-center text-xs">
                    <input
                      type="search"
                      aria-label="Buscar o crear con Artie"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        openSearch();
                      }}
                      onFocus={openSearch}
                      className="
                    neon-search-input size-full bg-transparent text-xs
                    text-foreground outline-none
                  "
                      autoComplete="off"
                    />
                    {placeholderOverlay}
                  </div>
                </NeonSearchShell>
                {isSearchOpen && (
                  <ArtieSearchDropdown
                    query={searchQuery}
                    results={searchResults}
                    isLoading={searchLoading}
                    onCreate={() => handleCreateWithArtie()}
                    onSelect={handleSelectResult}
                    onAdvanced={handleAdvancedCreate}
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
                  <li>
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={handleEspaciosClick}
                      className={navLinkClass(false)}
                    >
                      Espacios
                      {navUnderline(false)}
                    </button>
                  </li>
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
              {/* Brand button: opens the mobile menu with the same routes as
                  the desktop bar, plus Planes and Espacios. */}
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
                    {[...leftNavItems, ...rightNavItems].map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => setBrandMenuOpen(false)}
                          className={`
                            flex items-center gap-3 rounded-xl px-3 py-2.5
                            text-sm font-medium transition-colors
                            hover:bg-primary/10 hover:text-primary
                            ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground'}
                          `}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      role="menuitem"
                      aria-haspopup="dialog"
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
                      {renderMobileAccountMenuButton()}
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
                <div className="relative mx-2.5 flex h-full min-w-0 flex-1 items-center text-sm">
                  <input
                    type="search"
                    aria-label="Buscar o crear con Artie"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      openSearch();
                    }}
                    onFocus={openSearch}
                    className="
                    neon-search-input size-full bg-transparent text-sm
                    text-foreground outline-none
                  "
                    autoComplete="off"
                  />
                  {placeholderOverlay}
                </div>
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
                  onAdvanced={handleAdvancedCreate}
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
