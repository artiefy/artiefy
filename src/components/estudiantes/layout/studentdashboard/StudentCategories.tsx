'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams?.get('query') ?? ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams?.get('category') ?? null
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [_isScrolling, setIsScrolling] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const _scrollTimeoutRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const DRAG_THRESHOLD_PX = 8;

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    };
  }, []);

  const { data: categoriesData } = useSWR<CategoriesData>('/api/categories', {
    fallbackData: { allCategories, featuredCategories },
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const atLeft = scrollLeft <= 1;
    const atRight = scrollLeft >= scrollWidth - clientWidth - 1;
    setShowLeftArrow(!atLeft);
    setShowRightArrow(!atRight);
    // Si el usuario está scrolleando y no está en los bordes, marcar scrolling
    setIsScrolling(!atLeft && !atRight);
    // Si volvemos al inicio (posición base), ocultar el estado de pressing
    if (atLeft) {
      setIsPressing(false);
      if (pressTimerRef.current) {
        window.clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      if (container) container.removeEventListener('scroll', checkScroll);
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
    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  const handleCategorySelect = (category: string | null) => {
    saveScrollPosition();
    start();
    setLoadingCategory(category ?? 'all');
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
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
    const t = setTimeout(() => {
      setLoadingCategory(null);
      stop();

      if (searchParams?.has('query')) {
        const s = setTimeout(() => {
          const resultsSection = document.getElementById(
            'courses-list-section'
          );
          if (resultsSection)
            resultsSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
        }, 300);
        return () => clearTimeout(s);
      } else if (
        searchParams?.has('category') ||
        (!searchParams?.has('query') &&
          !searchParams?.has('category') &&
          typeof window !== 'undefined' &&
          sessionStorage.getItem('scrollPosition'))
      ) {
        const s = setTimeout(() => {
          try {
            _restoreScrollPosition();
          } catch (_err) {
            /* ignore */
          }
        }, 100);
        return () => clearTimeout(s);
      }
    }, 0);

    return () => clearTimeout(t);
  }, [searchParams, stop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        <div className="mt-4 mb-2 ml-0 w-full lg:flex lg:flex-row lg:items-center lg:justify-start lg:gap-2">
          <div className="relative flex w-full flex-row items-center justify-start lg:w-auto lg:justify-start">
            <div className="min-w-0 flex-1">
              <StudentGradientText className="mx-0 justify-start text-left text-2xl whitespace-nowrap sm:text-xl lg:mt-3 lg:text-2xl">
                Áreas de Conocimiento
              </StudentGradientText>
            </div>

            {/* Mobile: search icon to the right */}
            <div className="ml-0 flex items-center lg:hidden">
              <button
                type="button"
                className="mt-2 mr-2 h-4 w-4 -translate-y-2 transform text-white"
                aria-label="Mostrar búsqueda"
                onClick={() => setShowMobileSearch((v) => !v)}
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
            </div>

            {/* Desktop: keep original searchbar */}
            <div className="hidden lg:ml-6 lg:block">
              <div className="student-searchbar w-full max-w-[260px]">
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

          {showMobileSearch && (
            <div className="mt-3 block w-full lg:hidden">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                  setShowMobileSearch(false);
                }}
                className="student-searchbar w-full"
              >
                <input
                  placeholder="Buscar Cursos..."
                  className="student-searchbar__input"
                  name="text"
                  type="text"
                  value={searchQuery}
                  ref={searchInputRef}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </form>
            </div>
          )}
        </div>

        <div
          ref={wrapperRef}
          onTouchStart={(e) => {
            // start tracking drag but don't show arrows until threshold
            const touch = e.touches?.[0];
            draggingRef.current = false;
            if (touch && scrollContainerRef.current) {
              const container = scrollContainerRef.current;
              // store previous styles to restore later
              try {
                container.dataset.prevOverflow = container.style.overflow || '';
                container.dataset.prevScrollBehavior =
                  container.style.scrollBehavior || '';
              } catch (_err) {
                /* ignore */
              }
              container.dataset.dragStartX = String(touch.clientX);
              container.dataset.dragScrollLeft = String(container.scrollLeft);
            }
          }}
          onTouchMove={(e) => {
            // Drag horizontal with threshold to avoid accidental triggers
            const touch = e.touches?.[0];
            const container = scrollContainerRef.current;
            if (touch && container && container.dataset.dragStartX) {
              const startX = Number(container.dataset.dragStartX);
              const startScroll = Number(container.dataset.dragScrollLeft);
              const dx = startX - touch.clientX;
              // if user moved more than threshold, consider it a drag
              if (!draggingRef.current && Math.abs(dx) > DRAG_THRESHOLD_PX) {
                draggingRef.current = true;
                setIsPressing(true);
                // disable smooth scrolling and native overflow while dragging to avoid snap-back
                try {
                  container.style.scrollBehavior = 'auto';
                  container.style.overflow = 'hidden';
                  // disable momentum scrolling on iOS
                  (container.style as unknown as Record<string, string>)[
                    '-webkit-overflow-scrolling'
                  ] = 'auto';
                } catch (_err) {
                  /* ignore */
                }
              }
              if (draggingRef.current) {
                // prevent native scrolling to avoid snap-back effect
                if (typeof e.preventDefault === 'function') e.preventDefault();
                container.scrollLeft = startScroll + dx;
                // update arrows visibility while dragging
                checkScroll();
              }
            }
          }}
          onTouchEnd={() => {
            // end drag tracking; DO NOT hide arrows here — keep them visible until checkScroll
            if (scrollContainerRef.current) {
              const container = scrollContainerRef.current;
              delete container.dataset.dragStartX;
              delete container.dataset.dragScrollLeft;
              // restore overflow and scrollBehavior if we modified them
              try {
                if (container.dataset.prevOverflow !== undefined) {
                  container.style.overflow =
                    container.dataset.prevOverflow || '';
                  delete container.dataset.prevOverflow;
                }
                if (container.dataset.prevScrollBehavior !== undefined) {
                  container.style.scrollBehavior =
                    container.dataset.prevScrollBehavior || '';
                  delete container.dataset.prevScrollBehavior;
                }
                // restore webkit momentum
                (container.style as unknown as Record<string, string>)[
                  '-webkit-overflow-scrolling'
                ] = '';
              } catch (_err) {
                /* ignore */
              }
            }
            if (draggingRef.current) {
              draggingRef.current = false;
              // ensure arrows reflect final position; checkScroll will clear isPressing only when atLeft
              checkScroll();
            }
          }}
          onTouchCancel={() => {
            if (scrollContainerRef.current) {
              delete scrollContainerRef.current.dataset.dragStartX;
              delete scrollContainerRef.current.dataset.dragScrollLeft;
            }
            if (draggingRef.current) {
              draggingRef.current = false;
              checkScroll();
            }
          }}
          className="group/categories relative -mb-6 -ml-4 pt-3 sm:-mb-0 sm:-ml-0 sm:pt-0"
        >
          {(isPressing || showLeftArrow) && (
            <button
              onClick={() => scroll('left')}
              className={`category-arrow absolute top-[35%] left-0 z-10 flex h-10 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent opacity-0 transition-transform duration-300 group-focus-within/categories:opacity-95 group-hover/categories:opacity-95 hover:scale-110 ${isPressing ? 'scale-110 opacity-95' : ''}`}
              aria-label="Scroll left"
            >
              <IoIosArrowBack className="h-5 w-5 text-white" />
            </button>
          )}

          {(isPressing || showRightArrow) && (
            <button
              onClick={() => scroll('right')}
              className={`category-arrow absolute top-[35%] right-0 z-10 flex h-10 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent opacity-0 transition-transform duration-300 group-focus-within/categories:opacity-95 group-hover/categories:opacity-95 hover:scale-110 ${isPressing ? 'scale-110 opacity-95' : ''}`}
              aria-label="Scroll right"
            >
              <IoIosArrowForward className="h-5 w-5 text-white" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex justify-start gap-3 overflow-x-auto pr-4 pb-4 pl-4 sm:pr-3 sm:pl-3"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollPaddingLeft: '12px',
            }}
          >
            <button
              onClick={() => {
                if (!selectedCategory) return;
                handleCategorySelect(null);
              }}
              disabled={!selectedCategory}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 sm:px-5 sm:py-2 sm:text-sm ${
                !selectedCategory
                  ? 'bg-foreground text-background cursor-not-allowed opacity-60'
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
        @media (max-width: 768px) {
          .category-arrow {
            top: 45% !important;
          }
        }
      `}</style>
    </section>
  );
}
