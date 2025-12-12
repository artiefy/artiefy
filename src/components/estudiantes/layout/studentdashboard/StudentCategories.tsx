'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import useSWR from 'swr';

import StudentGradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { Icons } from '~/components/estudiantes/ui/icons';
import {
  restoreScrollPosition as _restoreScrollPosition,
  saveScrollPosition,
} from '~/utils/scrollPosition';

import type { Category } from '~/types';

import './search-input.css';
import './searchbar-purple.css';

interface CourseCategoriesProps {
  allCategories: Category[];
  featuredCategories: Category[];
}

interface CategoriesData {
  allCategories: Category[];
  featuredCategories: Category[];
}

export default function StudentCategories({
  allCategories,
  featuredCategories,
}: CourseCategoriesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { start, stop } = useProgress();
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get('query') ?? ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams?.get('category') ?? null
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Usar SWR para el fetching y caching de datos
  const { data: categoriesData } = useSWR<CategoriesData>('/api/categories', {
    fallbackData: { allCategories, featuredCategories },
    revalidateOnFocus: false, // Solo revalidar cuando sea necesario
    revalidateOnReconnect: false,
  });

  // Check if arrows should be shown
  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, categoriesData]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const handleCategorySelect = (category: string | null) => {
    saveScrollPosition();
    start();
    setLoadingCategory(category ?? 'all');
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (category) {
      params.set('category', category);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = useCallback(() => {
    saveScrollPosition();
    start();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      const params = new URLSearchParams();
      params.set('query', trimmed);
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(pathname);
    }
  }, [searchQuery, pathname, router, start]);

  useEffect(() => {
    setLoadingCategory(null);
    // setIsSearching(false); // Eliminado: ya no se usa
    stop();
    // Behavior:
    // - If it's a search (`query`), scroll to the results section.
    // - If it's a category filter (no `query`), restore previously saved scroll
    //   position so the viewport remains where the user was (no jump to top).
    if (searchParams?.has('query')) {
      // Use setTimeout to ensure the DOM has been updated with results first
      setTimeout(() => {
        const resultsSection = document.getElementById('courses-list-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } else if (
      searchParams?.has('category') ||
      (!searchParams?.has('query') &&
        !searchParams?.has('category') &&
        typeof window !== 'undefined' &&
        sessionStorage.getItem('scrollPosition'))
    ) {
      // Restore previous scroll position saved before navigating to the category
      // This covers both: specific category filters and the "Todos" case
      // where the query string is cleared.
      setTimeout(() => {
        try {
          _restoreScrollPosition();
        } catch (_err) {
          // ignore
        }
      }, 100);
    }
  }, [searchParams, stop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <section
      id="student-categories-section"
      className="div-filters px-8 sm:px-12 md:px-10 lg:px-20"
    >
      <div className="container mx-auto">
        {/* Title and Search Bar */}
        <div className="mt-4 mb-2 ml-0 flex flex-col gap-2 sm:mt-0 sm:pl-3 lg:flex-row lg:items-center lg:justify-start lg:gap-2">
          {/* Title */}
          <div className="flex w-full items-center justify-start gap-1 sm:gap-1.5 lg:w-auto">
            <StudentGradientText className="mt-2 mr-10 text-lg whitespace-nowrap sm:mt-1 sm:mr-0 sm:text-xl lg:mt-3 lg:text-2xl">
              Areas de conocimiento
            </StudentGradientText>
          </div>

          {/* Search bar stacked below on mobile, right aligned */}
          <div className="flex w-full justify-center lg:w-auto lg:justify-start">
            <div className="student-searchbar w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[260px]">
              <button
                type="button"
                className="student-searchbar__icon absolute top-[60%] right-6 -translate-y-1/2 text-white"
                tabIndex={-1}
                aria-label="Buscar cursos"
                onClick={() => {
                  if (!searchQuery.trim()) {
                    searchInputRef.current?.focus();
                    return;
                  }
                  handleSearch();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  height="20px"
                  width="20px"
                >
                  <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
                  />
                  <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    d="M22 22L20 20"
                  />
                </svg>
              </button>
              <input
                placeholder="Buscar Cursos..."
                className="student-searchbar__input"
                name="text"
                type="text"
                value={searchQuery}
                ref={searchInputRef}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>

        {/* Categories - Horizontal Scroll */}
        <div className="group/categories relative -mb-6 -ml-4 pt-3 sm:-mb-0 sm:-ml-0 sm:pt-0">
          {/* Left Arrow - Visible on hover */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="category-arrow absolute top-[35%] left-0 z-10 flex h-10 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent opacity-0 transition-transform duration-300 group-focus-within/categories:opacity-95 group-hover/categories:opacity-95 hover:scale-110"
              aria-label="Scroll left"
            >
              <IoIosArrowBack className="h-5 w-5 text-white" />
            </button>
          )}

          {/* Right Arrow - Visible on hover */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="category-arrow absolute top-[35%] right-0 z-10 flex h-10 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent opacity-0 transition-transform duration-300 group-focus-within/categories:opacity-95 group-hover/categories:opacity-95 hover:scale-110"
              aria-label="Scroll right"
            >
              <IoIosArrowForward className="h-5 w-5 text-white" />
            </button>
          )}

          {/* Categories Container */}
          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex justify-start gap-3 overflow-x-auto pr-4 pb-4 pl-4 sm:pr-3 sm:pl-3"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollPaddingLeft: '12px',
            }}
          >
            {/* "Todos" Button */}
            <button
              onClick={() => handleCategorySelect(null)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 sm:px-5 sm:py-2 sm:text-sm ${
                !selectedCategory
                  ? 'bg-foreground text-background'
                  : 'border-foreground/30 hover:border-foreground hover:text-foreground border bg-transparent font-medium text-[#94A3B8]'
              }`}
              aria-label="Mostrar todos los cursos"
            >
              {loadingCategory === 'all' ? (
                <div className="flex items-center gap-2">
                  <Icons.spinner className="size-4" aria-hidden="true" />
                  <span>Cargando...</span>
                </div>
              ) : (
                'Todos'
              )}
            </button>

            {/* Category Buttons */}
            {categoriesData?.allCategories?.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id.toString())}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 sm:px-5 sm:py-2 sm:text-sm ${
                  selectedCategory === category.id.toString()
                    ? 'bg-foreground text-background'
                    : 'border-foreground/30 hover:border-foreground hover:text-foreground border bg-transparent font-medium text-[#94A3B8]'
                }`}
                aria-label={`Mostrar cursos de ${category.name}`}
              >
                {loadingCategory === category.id.toString() ? (
                  <div className="flex items-center gap-2">
                    <Icons.spinner className="size-4" aria-hidden="true" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  category.name
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .category-arrow {
          border: none;
          outline: none;
          box-shadow: none;
          isolation: isolate;
        }

        .category-arrow::after {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(167, 139, 250, 0.4),
            rgba(17, 24, 39, 0)
          );
          filter: blur(10px);
          opacity: 0.85;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
          z-index: 0;
        }

        .category-arrow:hover::after {
          opacity: 1;
          transform: scale(1.08);
        }

        .category-arrow svg {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </section>
  );
}
