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

import type { Course } from '~/types';

import '~/styles/barsicon.css';
import '~/styles/searchBar.css';
import '~/styles/headerSearchBar.css';
import '~/styles/headerMenu.css';

export function Header2({
  onEspaciosClickAction,
}: {
  onEspaciosClickAction?: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  // Debounce para evitar demasiadas llamadas
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setPreviewCourses([]);
      setShowPreview(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { searchCoursesPreview } =
          await import('~/server/actions/estudiantes/courses/searchCoursesPreview');
        const results = await searchCoursesPreview(searchQuery);
        setPreviewCourses(results);
        setShowPreview(true);
      } catch (_err) {
        setPreviewCourses([]);
        setShowPreview(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  // New state to track if activity modal is open
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  // New state to track scroll direction
  const [isScrollingDown, setIsScrollingDown] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  void isScrollingDown;

  // MODAL DISPONIBLE MUY PRONTO
  // Solo para Espacios
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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Listen for activity modal open/close events
  useEffect(() => {
    const handleModalOpen = () => {
      setIsActivityModalOpen(true);
    };

    const handleModalClose = () => {
      setIsActivityModalOpen(false);
    };

    window.addEventListener('activity-modal-open', handleModalOpen);
    window.addEventListener('activity-modal-close', handleModalClose);

    return () => {
      window.removeEventListener('activity-modal-open', handleModalOpen);
      window.removeEventListener('activity-modal-close', handleModalClose);
    };
  }, []);

  // Enhanced scroll handling for direction detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine scroll direction
      const isDown = currentScrollY > lastScrollY;
      setIsScrollingDown(isDown);

      // Show header if scrolling down, hide if scrolling up
      if (currentScrollY > 100) {
        setIsHeaderVisible(isDown);
      } else {
        setIsHeaderVisible(true); // Always show header at the top of the page
      }

      // Update last scroll position
      setLastScrollY(currentScrollY);

      // Original scroll behavior for visual changes
      setIsScrolled(currentScrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.header-menu')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignInClick = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!searchQuery.trim() || searchInProgress) return;

    setSearchInProgress(true);

    // Emit global search event
    const searchEvent = new CustomEvent('artiefy-search', {
      detail: { query: searchQuery.trim() },
    });
    window.dispatchEvent(searchEvent);

    // Clear the search input
    setSearchQuery('');
    setSearchInProgress(false);
  };

  const renderAuthButton = () => {
    if (!mounted) {
      return (
        <div className="flex w-[180px] items-center justify-start">
          <Icons.spinner className="text-primary h-5 w-5" />
        </div>
      );
    }

    return (
      <div className="flex min-w-[180px] items-center justify-end">
        {!isAuthLoaded ? (
          <div className="flex min-w-[180px] items-center justify-start">
            <Icons.spinner className="text-primary h-5 w-5" />
          </div>
        ) : (
          <>
            <SignedOut>
              <SignInButton>
                <Button
                  className="border-primary bg-primary text-background hover:bg-background hover:text-primary relative skew-x-[-15deg] cursor-pointer rounded-none border p-5 text-xl font-light italic transition-all duration-200 hover:shadow-[0_0_30px_5px_rgba(0,189,216,0.815)] active:scale-95"
                  style={{
                    transition: '0.5s',
                    width: '180px',
                  }}
                  onClick={handleSignInClick}
                >
                  <span className="relative skew-x-[15deg] overflow-hidden font-semibold">
                    {isLoading ? (
                      <Icons.spinner className="size-6" />
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </span>
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="hidden items-center gap-2 md:flex">
                <div className="perfil-header">
                  <Suspense
                    fallback={
                      <div className="flex min-w-[180px] items-center justify-start">
                        <Icons.spinner className="text-primary ml-2 h-5 w-5" />
                      </div>
                    }
                  >
                    <UserButtonWrapper />
                  </Suspense>
                </div>
                {/* Solo contorno negro en mobile, blanco en desktop */}
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
                        <Icons.spinner className="text-primary ml-2 h-5 w-5" />
                      </div>
                    }
                  >
                    <UserButtonWrapper />
                  </Suspense>
                </div>
                {/* Solo contorno negro en mobile, blanco en desktop */}
                <div className="campana-header relative md:text-white">
                  <NotificationHeader />
                </div>
              </div>
            </SignedIn>
          </>
        )}
      </div>
    );
  };

  const handleEspaciosClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setShowEspaciosModal(true);
    onEspaciosClickAction?.();
  };

  return (
    <>
      {/* Modal "Disponible muy pronto" solo para Espacios */}
      <Dialog
        open={showEspaciosModal}
        onClose={() => setShowEspaciosModal(false)}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <DialogPanel className="relative mx-auto flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-8 shadow-2xl">
          <span className="from-primary mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr to-blue-400 shadow-lg">
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
          <h2 className="text-secondary mb-2 text-center text-2xl font-bold">
            ¡Disponible muy pronto!
          </h2>
          <p className="mb-4 text-center text-gray-600">
            La sección de{' '}
            <span className="text-secondary font-semibold">Espacios</span>{' '}
            estará habilitada próximamente.
            <br />
            ¡Gracias por tu interés!
          </p>
          <button
            className="bg-secondary mt-2 rounded px-6 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
            onClick={() => setShowEspaciosModal(false)}
          >
            Cerrar
          </button>
        </DialogPanel>
      </Dialog>
      <header
        className={`sticky top-0 mt-0 w-full border-b border-gray-700 bg-[#00152B] transition-all duration-300 sm:mt-12 md:border-none md:bg-transparent ${
          isScrolled
            ? 'bg-opacity-80 bg-[#01142B] shadow-md backdrop-blur-sm'
            : 'md:py-3'
        } ${!isHeaderVisible ? '-translate-y-full' : 'translate-y-0'} div-header-nav ${
          isActivityModalOpen ? 'z-40' : 'z-[9999]'
        }`}
      >
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="hidden w-full items-center md:flex md:justify-between">
            {!isScrolled ? (
              <div className="flex w-full items-center justify-between">
                <div className="shrink-0">
                  <Link href="/estudiantes">
                    <div className="relative size-[150px]">
                      <Image
                        src="/artiefy-logo.svg"
                        alt="Logo Artiefy"
                        fill
                        unoptimized
                        className="object-contain"
                        sizes="150px"
                      />
                    </div>
                  </Link>
                </div>
                <div className="div-header-nav flex gap-24">
                  {navItems.map((item) => {
                    const extraClass = `div-header-${item.label.toLowerCase()}`;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/' && pathname.startsWith(item.href));
                    const activeClass = isActive
                      ? 'border-b-2 border-orange-500 text-orange-500'
                      : '';
                    if (item.label === 'Proyectos') {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`text-lg font-light tracking-wide whitespace-nowrap transition-colors active:scale-95 ${extraClass} ${isActive ? activeClass : 'text-white hover:text-orange-500'}`}
                        >
                          {item.label}
                        </Link>
                      );
                    }
                    if (item.label === 'Espacios') {
                      return (
                        <button
                          key={item.href}
                          type="button"
                          className={`text-lg font-light tracking-wide whitespace-nowrap transition-colors active:scale-95 ${extraClass} cursor-pointer border-0 bg-transparent outline-none ${isActive ? activeClass : 'text-white hover:text-orange-500'}`}
                          onClick={handleEspaciosClick}
                        >
                          {item.label}
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`text-lg font-light tracking-wide whitespace-nowrap transition-colors active:scale-95 ${extraClass} ${isActive ? activeClass : 'text-white hover:text-orange-500'}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="flex justify-end">{renderAuthButton()}</div>
              </div>
            ) : (
              <div className="flex w-full items-center">
                <div className="shrink-0">
                  <Link href="/estudiantes">
                    <div className="relative size-[150px]">
                      <Image
                        src="/artiefy-logo.svg"
                        alt="Logo Artiefy"
                        fill
                        unoptimized
                        className="object-contain"
                        sizes="150px"
                      />
                    </div>
                  </Link>
                </div>
                <div className="flex flex-1 justify-center gap-6">
                  <form onSubmit={handleSearch} className="relative w-[700px]">
                    <div className="header-search-container relative">
                      <input
                        type="search"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="header-input border-primary"
                        autoComplete="off"
                      />
                      <svg
                        viewBox="0 0 24 24"
                        className="header-search__icon"
                        onClick={handleSearch}
                      >
                        <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
                      </svg>
                      {showPreview && previewCourses.length > 0 && (
                        <div className="z-50 w-full">
                          <Suspense fallback={null}>
                            <CourseSearchPreview
                              courses={previewCourses}
                              onSelectCourse={(courseId: number) => {
                                window.location.href = `/estudiantes/cursos/${courseId}`;
                              }}
                            />
                          </Suspense>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                <div className="flex items-center gap-4">
                  <div className="header-menu">
                    <button
                      className="menu-selected"
                      onClick={toggleDropdown}
                      type="button"
                    >
                      Menú
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        className={`menu-arrow ${isDropdownOpen ? 'rotate' : ''}`}
                      >
                        <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                      </svg>
                    </button>
                    <div
                      className={`menu-options ${isDropdownOpen ? 'show' : ''}`}
                    >
                      {navItems.map((item) => {
                        if (item.label === 'Proyectos') {
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="menu-option hover:text-orange-500"
                              onClick={toggleDropdown}
                            >
                              {item.label}
                            </Link>
                          );
                        }
                        if (item.label === 'Espacios') {
                          return (
                            <button
                              key={item.href}
                              type="button"
                              className="menu-option hover:text-orange-500"
                              onClick={handleEspaciosClick}
                            >
                              {item.label}
                            </button>
                          );
                        }
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="menu-option hover:text-orange-500"
                            onClick={toggleDropdown}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end">{renderAuthButton()}</div>
                </div>
              </div>
            )}
          </div>
          <div className="relative flex w-full items-center justify-between md:hidden">
            <Link href="/estudiantes">
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
          <div className="absolute top-full right-0 left-0 z-50 w-full border-b border-gray-700 bg-[#00152B] p-4 md:hidden">
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
                className="text-foreground w-full rounded-2xl border border-[#1f2937] bg-[#1D283A80] py-3 pr-12 pl-4 text-sm transition-all placeholder:text-gray-400 hover:border-[#334155] focus:border-[#3AF4EF] focus:bg-[#1D283A80] focus:ring-2 focus:ring-[#3AF4EF]/50 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                className="absolute top-1/2 right-10 -translate-y-1/2"
                onClick={() => {
                  if (!searchQuery.trim()) return;
                  handleSearch();
                  setShowMobileSearch(false);
                }}
                aria-label="Buscar"
              >
                <Search className="text-primary/70 h-4 w-4" />
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2"
                onClick={() => setShowMobileSearch(false)}
                aria-label="Cerrar búsqueda"
              >
                <X className="text-primary/70 h-4 w-4" />
              </button>
              {showPreview && previewCourses.length > 0 && (
                <div className="mt-3 w-full">
                  <Suspense fallback={null}>
                    <CourseSearchPreview
                      courses={previewCourses}
                      onSelectCourse={(courseId: number) => {
                        window.location.href = `/estudiantes/cursos/${courseId}`;
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
            <div className="relative mt-8 -mb-4 flex w-full items-center justify-center">
              <div className="mx-auto w-fit">
                <Link href="/estudiantes">
                  <div className="relative size-[150px]">
                    <Image
                      src="/artiefy-logo2.svg"
                      alt="Logo Artiefy Mobile"
                      fill
                      unoptimized
                      className="object-contain"
                      sizes="150px"
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
              <nav className="pb-4">
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
                            onClick={handleEspaciosClick}
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
              <div className="div-auth mt-5 flex items-center justify-center">
                <Suspense
                  fallback={
                    <div className="flex min-w-[180px] items-center justify-start">
                      <Icons.spinner className="text-background h-5 w-5" />
                    </div>
                  }
                >
                  {renderAuthButton()}
                </Suspense>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </>
  );
}
