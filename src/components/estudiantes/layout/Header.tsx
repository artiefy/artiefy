'use client';
import React, { Suspense, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs';
import { Search } from 'lucide-react';

import CourseSearchPreview from '~/components/estudiantes/layout/studentdashboard/CourseSearchPreview';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

import { UserButtonWrapper } from '../auth/UserButtonWrapper';

import type { Course } from '~/types';

export function Header({
  onEspaciosClickAction: _onEspaciosClickAction,
}: {
  onEspaciosClickAction?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [searchInProgress, setSearchInProgress] = useState(false);

  const { isLoaded: isAuthLoaded } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/estudiantes', label: 'Cursos' },
    { href: '/proyectos', label: 'Proyectos' },
    { href: '/comunidad', label: 'Espacios' },
    { href: '/planes', label: 'Planes' },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce para preview de cursos
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
          <Icons.spinner className="text-primary h-5 w-5" />
        </div>
      );
    }

    return (
      <>
        {!isAuthLoaded ? (
          <div className="flex items-center">
            <Icons.spinner className="text-primary h-5 w-5" />
          </div>
        ) : (
          <>
            <SignedOut>
              <SignInButton>
                <Button className="bg-primary hover:bg-primary/90 ml-2 inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap text-black transition-colors">
                  Acceder
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2">
                <Suspense
                  fallback={
                    <div className="flex items-center">
                      <Icons.spinner className="text-primary h-5 w-5" />
                    </div>
                  }
                >
                  <UserButtonWrapper />
                </Suspense>
              </div>
            </SignedIn>
          </>
        )}
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-700 bg-[#00152B] backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-12">
        {/* Logo */}
        <Link href="/" className="-ml-8 flex shrink-0 items-center gap-2">
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
              placeholder="¿Qué quieres aprender?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-foreground w-full rounded-2xl border border-[#1f2937] bg-[#1D283A80] py-3 pr-10 pl-4 text-sm transition-all placeholder:text-[hsl(210,40%,98%)] hover:border-[#334155] focus:border-[#3AF4EF] focus:bg-[#1D283A80] focus:ring-2 focus:ring-[#3AF4EF]/50 focus:outline-none"
              autoComplete="off"
            />
            <Search
              className="text-primary/70 hover:text-primary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 cursor-pointer transition-colors"
              onClick={(e) => {
                e.preventDefault();
                if (!searchQuery.trim()) return;
                handleSearch();
              }}
            />
            {/* Preview de cursos debajo del input */}
            {showPreview && previewCourses.length > 0 && (
              <div className="absolute z-50 w-full">
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

        {/* Navigation & Auth */}
        <div className="-mr-8 flex items-center gap-4">
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
                    className={`rounded-lg px-3 py-2 text-sm font-medium text-[#94A3B8] transition-colors focus:text-white ${
                      isActive
                        ? 'bg-[#1D283A80] hover:bg-[#1D283A80] focus:bg-[#1D283A80]'
                        : 'hover:bg-[#1D283A80] focus:bg-[#1D283A80]'
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
    </nav>
  );
}
