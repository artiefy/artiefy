'use client';
import React, { Suspense, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  useUser,
} from '@clerk/nextjs';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon as XMarkIconSolid } from '@heroicons/react/24/solid';
import { Search, X } from 'lucide-react';

import CourseSearchPreview from '~/components/estudiantes/layout/studentdashboard/CourseSearchPreview';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

import { UserButtonWrapper } from '../auth/UserButtonWrapper';

import { NotificationHeader } from './NotificationHeader';

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

  const { isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/estudiantes', label: 'Cursos' },
    { href: '/proyectos', label: 'Proyectos' },
    { href: '/comunidad', label: 'Espacios' },
    { href: '/planes', label: 'Planes' },
  ];

  const planType = user?.publicMetadata?.planType as string | undefined;
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as
    | string
    | undefined;
  const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
    | string
    | undefined;

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

  const getMobilePlanBadgeStyle = (
    type?: string,
    expired?: boolean
  ): { bg: string; textColor: string; label: string } => {
    if (!type) {
      return { bg: 'bg-gray-200', textColor: 'text-gray-800', label: 'Plan' };
    }
    switch (type) {
      case 'Premium':
        return {
          bg: expired ? 'bg-gray-500' : 'bg-purple-500',
          textColor: 'text-white',
          label: 'Premium',
        };
      case 'Pro':
        return {
          bg: expired ? 'bg-gray-500' : 'bg-orange-500',
          textColor: 'text-white',
          label: 'Pro',
        };
      case 'Enterprise':
        return {
          bg: expired ? 'bg-gray-500' : 'bg-blue-800',
          textColor: 'text-white',
          label: 'Enterprise',
        };
      default:
        return { bg: 'bg-gray-300', textColor: 'text-gray-900', label: type };
    }
  };

  const renderMobilePlanBadge = () => {
    if (!planType) return null;
    const expired = isPlanExpired();
    const style = getMobilePlanBadgeStyle(planType, expired);
    return (
      <span
        className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${style.bg} ${style.textColor}`}
        title={expired ? 'Suscripcion vencida' : `${style.label} activo`}
      >
        {style.label}
      </span>
    );
  };

  useEffect(() => {
    setMounted(true);
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

  const renderAuthButton = () => {
    if (!mounted) {
      return (
        <div className="flex items-center">
          <Icons.spinner className="h-5 w-5 text-primary" />
        </div>
      );
    }

    return (
      <>
        {!isAuthLoaded ? (
          <div className="flex items-center">
            <Icons.spinner className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <>
            <SignedOut>
              <SignInButton>
                <div className="flex items-center">
                  <Button className="ml-2 hidden h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium whitespace-nowrap text-black transition-colors hover:bg-primary/90 md:inline-flex">
                    Acceder
                  </Button>

                  <Button
                    className="relative skew-x-[-15deg] cursor-pointer rounded-none border border-primary bg-primary p-5 text-xl font-light text-background italic transition-all duration-200 hover:bg-background hover:text-primary hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] active:scale-95 md:hidden"
                    style={{
                      transition: '0.5s',
                      width: '180px',
                    }}
                  >
                    <span className="relative skew-x-[15deg] overflow-hidden font-semibold">
                      Iniciar Sesión
                    </span>
                  </Button>
                </div>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="mr-4 hidden items-center gap-3 md:mr-6 md:flex">
                <Suspense
                  fallback={
                    <div className="flex items-center">
                      <Icons.spinner className="h-5 w-5 text-primary" />
                    </div>
                  }
                >
                  <UserButtonWrapper />
                </Suspense>
                <div className="campana-header relative md:text-white">
                  <NotificationHeader />
                </div>
              </div>

              <div className="flex items-center gap-2 md:hidden">
                {renderMobilePlanBadge()}
                <div className="perfil-header">
                  <Suspense
                    fallback={
                      <div className="flex min-w-[180px] items-center justify-start">
                        <Icons.spinner className="ml-2 h-5 w-5 text-primary" />
                      </div>
                    }
                  >
                    <UserButtonWrapper />
                  </Suspense>
                </div>
                <div className="campana-header relative md:text-white">
                  <NotificationHeader />
                </div>
              </div>
            </SignedIn>
          </>
        )}
      </>
    );
  };

  const handleEspaciosClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setShowEspaciosModal(true);
    onEspaciosClickAction?.();
  };

  return (
    <nav className="sticky top-0 z-[100] mb-8 w-full border-b bg-[#01152d] backdrop-blur-md sm:mb-8">
      <Dialog
        open={showEspaciosModal}
        onClose={() => setShowEspaciosModal(false)}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        <div className="fixed inset-0" aria-hidden="true" />
        <DialogPanel className="relative mx-auto flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-8 shadow-2xl">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 shadow-lg">
            <svg
              className="h-10 w-10 text-white"
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
          <h2 className="mb-2 text-center text-2xl font-bold text-secondary">
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
            className="mt-2 rounded bg-secondary px-6 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
            onClick={() => setShowEspaciosModal(false)}
          >
            Cerrar
          </button>
        </DialogPanel>
      </Dialog>
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-12 px-4 sm:px-6">
        <div className="hidden w-full items-center justify-between gap-12 md:flex">
          {/* Logo */}
          <Link
            href="/"
            className="ml-0 flex shrink-0 items-center gap-2 md:-ml-8"
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
            className="hidden max-w-xl flex-1 md:block"
          >
            <div className="relative">
              <input
                type="search"
                placeholder="¡Aprende con IA!"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#1f2937] bg-[#1D283A80] py-3 pr-10 pl-4 text-sm text-foreground transition-all placeholder:text-gray-400 hover:border-[#334155] focus:border-[#3AF4EF] focus:bg-[#1D283A80] focus:ring-2 focus:ring-[#3AF4EF]/50 focus:outline-none"
                autoComplete="off"
              />
              <Search
                className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 cursor-pointer text-primary/70 transition-colors hover:text-primary"
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
          <div className="mr-0 flex items-center gap-4 md:-mr-8">
            {/* Desktop Navigation */}
            <ul className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#1D283A80] text-white hover:bg-[#1D283A80] focus:bg-[#1D283A80]'
                          : 'text-[#94A3B8] hover:bg-[#1D283A80] focus:bg-[#1D283A80]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Auth Button */}
            {renderAuthButton()}
          </div>
        </div>

        <div className="relative flex w-full items-center justify-between md:hidden">
          <Link href="/">
            <div className="relative size-[110px] md:size-[150px]">
              <Image
                src="/artiefy-logo.png"
                alt="Logo Artiefy"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 110px, 150px"
              />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buscar"
              className="rounded-full p-1 text-white transition hover:text-orange-500"
              onClick={() => {
                setShowMobileSearch((prev) => !prev);
                setMobileMenuOpen(false);
              }}
            >
              <Search className="h-5 w-5" />
            </button>
            <label className="hamburger flex h-8 w-8 items-center justify-center md:h-12 md:w-12">
              <input
                type="checkbox"
                checked={mobileMenuOpen}
                onChange={(e) => {
                  setMobileMenuOpen(e.target.checked);
                  if (e.target.checked) setShowMobileSearch(false);
                }}
              />
              <svg viewBox="0 0 32 32">
                <path
                  className="line line-top-bottom"
                  d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
                />
                <path className="line" d="M7 16 27 16" />
              </svg>
            </label>
          </div>
        </div>
      </div>
      {showMobileSearch && (
        <div className="absolute top-full right-0 left-0 z-50 w-full border-b border-gray-700 bg-[#01152d] p-4 md:hidden">
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
              className="w-full rounded-2xl border border-[#1f2937] bg-[#1D283A80] py-3 pr-10 pl-10 text-sm text-foreground transition-all placeholder:text-gray-400 hover:border-[#334155] focus:border-[#3AF4EF] focus:bg-[#1D283A80] focus:ring-2 focus:ring-[#3AF4EF]/50 focus:outline-none"
              autoComplete="off"
              autoFocus
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
              <Search className="h-4 w-4 text-primary/70" />
            </button>
            <button
              type="button"
              className="absolute top-1/2 left-3 -translate-y-1/2"
              onClick={() => setShowMobileSearch(false)}
              aria-label="Cerrar búsqueda"
            >
              <X className="h-4 w-4 text-primary/70" />
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
      <Dialog
        as="div"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        className="fixed inset-0 z-[99999] md:hidden"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <DialogPanel className="fixed inset-y-0 right-0 z-[99999] flex h-full min-h-[100dvh] w-[80%] max-w-sm flex-col overflow-hidden bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-xl">
          <div className="relative mt-3 mb-2 flex w-full items-center justify-center">
            <div className="mx-auto mt-16 w-fit">
              <Link href="/">
                <div className="relative h-10 w-36">
                  <Image
                    src="/artiefy-logo2.png"
                    alt="Logo Artiefy Mobile"
                    fill
                    unoptimized
                    className="object-contain"
                    sizes="144px"
                  />
                </div>
              </Link>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 rounded-full text-gray-600 transition-all duration-200 hover:bg-gray-100 focus:outline-none active:bg-gray-200"
              aria-label="Close menu"
            >
              <XMarkIconSolid className="size-8" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain pb-12">
            <nav className="mt-4 pt-4">
              <ul className="space-y-6">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));
                  const activeClass = isActive
                    ? 'text-orange-500 after:block after:h-0.5 after:bg-orange-500 after:w-full after:mx-auto after:mt-1 after:rounded-full'
                    : '';
                  if (item.label === 'Proyectos') {
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`mx-auto block w-fit text-lg transition-colors active:scale-95 ${isActive ? activeClass : 'text-gray-900 hover:text-orange-500'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="relative">{item.label}</span>
                        </Link>
                      </li>
                    );
                  }
                  if (item.label === 'Espacios') {
                    return (
                      <li key={item.href}>
                        <button
                          type="button"
                          className={`mx-auto block w-fit cursor-pointer border-0 bg-transparent text-left text-lg transition-colors outline-none active:scale-95 ${isActive ? activeClass : 'text-gray-900 hover:text-orange-500'}`}
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            handleEspaciosClick(e);
                          }}
                        >
                          <span className="relative">{item.label}</span>
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`mx-auto block w-fit text-lg transition-colors active:scale-95 ${isActive ? activeClass : 'text-gray-900 hover:text-orange-500'}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="relative">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="div-auth mt-14 flex items-center justify-center">
              <Suspense
                fallback={
                  <div className="flex min-w-[180px] items-center justify-start">
                    <Icons.spinner className="h-5 w-5 text-background" />
                  </div>
                }
              >
                {renderAuthButton()}
              </Suspense>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </nav>
  );
}
