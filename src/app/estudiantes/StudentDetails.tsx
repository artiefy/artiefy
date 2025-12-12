'use client';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { FaCrown, FaStar } from 'react-icons/fa';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { HiLibrary } from 'react-icons/hi';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { IoGiftOutline } from 'react-icons/io5';
import { IoLibrarySharp } from 'react-icons/io5';
import { MdFilterAlt } from 'react-icons/md';

import CourseSearchPreview from '~/components/estudiantes/layout/studentdashboard/CourseSearchPreview';
import MyCoursesPreview from '~/components/estudiantes/layout/studentdashboard/MyCoursesPreview';
import { StudentArtieIa } from '~/components/estudiantes/layout/studentdashboard/StudentArtieIa';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import StudentGradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { StudentProgram } from '~/components/estudiantes/layout/studentdashboard/StudentProgram';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Card } from '~/components/estudiantes/ui/card';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';
import { blurDataURL } from '~/lib/blurDataUrl';

import type { Course, Program } from '~/types';

import '~/styles/ia.css';
import '~/styles/searchBar.css';
import '~/styles/uiverse-button.css';
import '~/styles/headerSearchBar.css';
import '~/styles/filter-loader.css';
import '~/styles/filter-button-loader.css';

export default function StudentDetails({
  initialCourses,
  initialPrograms,
}: {
  initialCourses: Course[];
  initialPrograms: Program[];
}) {
  const [courses] = useState<Course[]>(initialCourses);
  const [sortedPrograms] = useState<Program[]>(() => {
    if (!Array.isArray(initialPrograms)) {
      console.warn('initialPrograms is not an array:', initialPrograms);
      return [];
    }
    return [...initialPrograms].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  });
  const [_currentSlide, setCurrentSlide] = useState<number>(0);
  const [chatbotKey, setChatbotKey] = useState<number>(0);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
  const [searchBarDisabled, setSearchBarDisabled] = useState<boolean>(false);
  const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [topCoursesApi, setTopCoursesApi] = useState<CarouselApi>();
  const [programsApi, setProgramsApi] = useState<CarouselApi>();
  const [canScrollPrevTop, setCanScrollPrevTop] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'todos' | 'cursos' | 'programas'
  >('todos');
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<
    'todos' | 'cursos' | 'programas' | null
  >(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [canScrollPrevPrograms, setCanScrollPrevPrograms] = useState(false);
  const routerRef = React.useRef(router);
  const pathnameRef = React.useRef(pathname);

  React.useEffect(() => {
    routerRef.current = router;
  }, [router]);

  React.useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const spString = React.useMemo(
    () => searchParams?.toString?.() ?? '',
    [searchParams]
  );

  // Sincronizar estado local con query param `view` (permite que la página padre o `page.tsx` reaccione)
  useEffect(() => {
    const params = new URLSearchParams(spString);
    const rawView = params.get('view');

    // No hacer un replace automático para 'todos' — dejamos que la navegación del botón maneje la URL.
    const view = (rawView as 'todos' | 'cursos' | 'programas') || 'todos';
    setActiveFilter(view);
    setPendingFilter(null);
    setIsNavigating(false);
    // Depend only on the serialized searchParams string so the deps array size is stable
  }, [spString]);

  // Hide server-rendered sections (categorías/lista) instantly when leaving "todos"
  useEffect(() => {
    const body = document?.body;
    const shouldHideServerSections = activeFilter !== 'todos' || isNavigating;

    if (!body) return undefined;

    if (shouldHideServerSections) {
      body.setAttribute('data-hide-server-sections', 'true');
    } else {
      body.removeAttribute('data-hide-server-sections');
    }

    return () => {
      body.removeAttribute('data-hide-server-sections');
    };
  }, [activeFilter, isNavigating]);

  // Trigger re-entry animation for server sections when returning to "todos"
  useEffect(() => {
    if (isNavigating) return;
    if (activeFilter !== 'todos') return;

    const body = document?.body;
    if (!body) return;

    body.setAttribute('data-animate-server-sections', 'true');
    const timeout = setTimeout(() => {
      body.removeAttribute('data-animate-server-sections');
    }, 650);

    return () => {
      clearTimeout(timeout);
      body.removeAttribute('data-animate-server-sections');
    };
  }, [activeFilter, isNavigating]);

  // Scroll to the relevant section once navigation finishes
  useEffect(() => {
    if (isNavigating) return;

    const targetId =
      activeFilter === 'cursos' || activeFilter === 'programas'
        ? 'filters-anchor'
        : null;

    if (!targetId) return;

    const timeout = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const y = window.scrollY + rect.top - 160; // subir un poco más para que quede más arriba
        window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
      }
    }, 80);

    return () => clearTimeout(timeout);
  }, [activeFilter, isNavigating]);

  const handleFilterClick = (filter: 'todos' | 'cursos' | 'programas') => {
    // Actualizar el estado local inmediatamente para ocultar/mostrar secciones sin demora
    setActiveFilter(filter);
    setPendingFilter(filter);
    setIsNavigating(true);

    const params = new URLSearchParams(searchParams?.toString() || '');
    if (filter === 'todos') {
      params.delete('view');
    } else {
      params.set('view', filter);
    }
    const query = params.toString();
    // Actualizar la URL después para mantener sincronización con page.tsx
    router.push(`${pathname}${query ? `?${query}` : ''}`);
  };

  // Monitorear estado del carousel de Top Cursos
  useEffect(() => {
    if (!topCoursesApi) return;

    const updateScrollState = () => {
      setCanScrollPrevTop(topCoursesApi.canScrollPrev());
    };

    updateScrollState();
    topCoursesApi.on('scroll', updateScrollState);
    topCoursesApi.on('select', updateScrollState);

    return () => {
      topCoursesApi.off('scroll', updateScrollState);
      topCoursesApi.off('select', updateScrollState);
    };
  }, [topCoursesApi]);

  // Monitorear estado del carousel de Programas
  useEffect(() => {
    if (!programsApi) return;

    const updateScrollState = () => {
      setCanScrollPrevPrograms(programsApi.canScrollPrev());
    };

    updateScrollState();
    programsApi.on('scroll', updateScrollState);
    programsApi.on('select', updateScrollState);

    return () => {
      programsApi.off('scroll', updateScrollState);
      programsApi.off('select', updateScrollState);
    };
  }, [programsApi]);

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
  const [_text, setText] = useState(''); // índice del mensaje
  const [index, setIndex] = useState(0); // índice del mensaje
  const [subIndex, setSubIndex] = useState(0); // índice de la letra
  const [reverse, setReverse] = useState(false); // si está borrando
  const [delay, _setDelay] = useState(40); // velocidad de escritura
  const placeHolderText = useMemo(
    () => [
      '¿Que Deseas Crear? Escribe Tu Idea...',
      '¿Qué quieres crear?',
      'Desarrollemos esa idea que tienes en mente...',
      'Estoy para ayudarte, Artiefy impulsa tus sueños',
      '¿Tienes una idea? ¡Vamos a hacerla realidad!',
    ],
    []
  );

  // Memoized values to prevent re-renders
  // Puedes eliminar _sortedCourses si no lo usas en el JSX
  // const _sortedCourses = useMemo(() => {
  //   return [...courses].sort(
  //     (a, b) =>
  //       new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //   );
  // }, [courses]);

  // Get ONLY featured courses (is_featured = true), no fallbacks
  const featuredCourses = useMemo(() => {
    return courses.filter((course) => course.is_featured === true).slice(0, 5);
  }, [courses]);

  // Get ONLY top courses (is_top = true), no fallbacks
  const topCourses = useMemo(() => {
    return courses.filter((course) => course.is_top === true).slice(0, 10);
  }, [courses]);

  // Replace previous memoized arrays with our new filtered arrays
  const latestFiveCourses = useMemo(() => featuredCourses, [featuredCourses]);
  const latestTenCourses = useMemo(() => topCourses, [topCourses]);

  const handleSearchComplete = useCallback(() => {
    // No cerrar el chatbot automáticamente - dejar que el usuario lo controle
    console.log('🔚 Búsqueda completada - manteniendo chatbot abierto');
    // setShowChatbot(false); // Comentado para evitar cierre automático
  }, []);

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!searchQuery.trim() || searchInProgress) return;

      console.log('🔍 Iniciando búsqueda:', searchQuery.trim());

      setSearchInProgress(true);
      setSearchBarDisabled(true);

      // Emit global search event
      const searchEvent = new CustomEvent('artiefy-search', {
        detail: { query: searchQuery.trim() },
      });
      console.log('📤 Disparando evento artiefy-search');
      window.dispatchEvent(searchEvent);

      // Also open chatbot with the search query so the n8n agent continues the flow
      // Nota: no disparar aquí el evento 'create-new-chat-with-search' para evitar duplicados.
      // El componente `StudentChatbot` ya reaccionará a `artiefy-search` y gestionará el flujo.

      // Clear the search input
      setSearchQuery('');
      setSearchInProgress(false);
      setSearchBarDisabled(false);
    },
    [searchQuery, searchInProgress]
  );

  // Add event listener in useEffect
  useEffect(() => {
    const handleGlobalSearch = (event: CustomEvent<{ query: string }>) => {
      const query = event.detail.query;
      if (!query) return;

      console.log('📥 Evento artiefy-search recibido:', query);

      setLastSearchQuery(query);
      setShowChatbot(true); // Asegurar que esté abierto
      setChatbotKey((prev) => prev + 1);
    };

    window.addEventListener(
      'artiefy-search',
      handleGlobalSearch as EventListener
    );

    // Listener para forzar apertura del chatbot
    const handleForceOpenChatbot = () => {
      console.log('🔓 Forzando apertura del chatbot');
      setShowChatbot(true);
    };

    window.addEventListener('force-open-chatbot', handleForceOpenChatbot);

    // Listener para cierre completo del chatbot
    const handleCloseChatbot = () => {
      setShowChatbot(false);
    };
    window.addEventListener('close-chatbot', handleCloseChatbot);

    return () => {
      window.removeEventListener(
        'artiefy-search',
        handleGlobalSearch as EventListener
      );
      window.removeEventListener('force-open-chatbot', handleForceOpenChatbot);
      window.removeEventListener('close-chatbot', handleCloseChatbot);
    };
  }, []);

  // Slide interval effect with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentSlide((prevSlide) => {
          const nextSlide = (prevSlide + 1) % latestFiveCourses.length;
          return nextSlide;
        });
        // Reset transitioning state after animation completes
        setTimeout(() => {
          setIsTransitioning(false);
        }, 500);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [latestFiveCourses.length, isTransitioning]);

  useEffect(() => {
    if (index >= placeHolderText.length) return;

    const current = placeHolderText[index];

    setText(current.substring(0, subIndex));

    if (!reverse && subIndex === current.length) {
      // Espera antes de borrar
      setTimeout(() => setReverse(true), 1500);
      return;
    }

    if (reverse && subIndex === 0) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % placeHolderText.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        setSubIndex((prev) => prev + (reverse ? -1 : 1));
      },
      reverse ? 40 : delay
    );

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, delay, placeHolderText]);

  const _truncateDescription = (description: string, maxLength: number) => {
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
  };

  const getImageUrl = (imageKey: string | null | undefined) => {
    if (!imageKey || imageKey === 'NULL') {
      return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
    }
    const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${imageKey}`;
    return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
  };

  // Rename to _getCourseTypeIcon to mark as unused

  return (
    <div
      className={`-mb-8 flex min-h-screen flex-col sm:mb-0 ${activeFilter === 'cursos' || activeFilter === 'programas' ? 'pb-28 sm:pb-40' : ''}`}
    >
      <main className="grow">
        <div className="flex flex-col space-y-12 sm:space-y-16">
          <div className="animate-zoom-in mt-8 flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center">
              <StudentArtieIa />
            </div>

            <form
              onSubmit={handleSearch}
              className="relative flex w-full flex-col items-center space-y-2"
            >
              <div className="header-search-container relative">
                <input
                  required
                  className={`header-input pl-6 ${
                    searchBarDisabled ? 'cursor-not-allowed opacity-70' : ''
                  }`}
                  name="search"
                  placeholder={
                    searchBarDisabled ? 'Procesando consulta...' : _text
                  }
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={searchBarDisabled}
                  autoComplete="off"
                />
                <svg
                  viewBox="0 0 24 24"
                  className="header-search__icon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!searchQuery.trim()) return;
                    handleSearch();
                  }}
                  role="button"
                  aria-label="Buscar"
                >
                  <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
                </svg>
                {/* Preview de cursos debajo del input */}
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

              {/* Text with sparkles icon below search bar */}
              <p className="text-muted-foreground mt-3 flex items-center justify-center gap-2 text-center text-sm">
                <span className="text-gray-400">
                  Aprende con{' '}
                  <span className="text-primary font-medium">IA</span> y
                  construye proyectos reales
                </span>
              </p>
            </form>
          </div>

          {/* Filter buttons above Seguir viendo */}
          <div
            id="filters-anchor"
            className="animation-delay-200 animate-zoom-in relative pr-0 pl-4 sm:px-24"
          >
            <div className="-mt-6 mb-4 flex w-full flex-wrap justify-center gap-2 pr-4 sm:-mt-8 sm:mb-0 sm:justify-start">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2 md:gap-3">
                <button
                  onClick={() => handleFilterClick('todos')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 sm:px-5 sm:py-2 sm:text-sm ${
                    activeFilter === 'todos'
                      ? 'bg-foreground text-background'
                      : 'border-foreground/30 hover:border-foreground hover:text-foreground border bg-transparent font-medium text-[#94A3B8]'
                  }`}
                  disabled={isNavigating && pendingFilter === 'todos'}
                >
                  <span className="inline-flex items-center gap-2">
                    Todos
                    {isNavigating && pendingFilter === 'todos' && (
                      <span
                        className="filter-button-loader"
                        aria-label="Cargando"
                      />
                    )}
                  </span>
                </button>
                <button
                  onClick={() => handleFilterClick('cursos')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 sm:px-5 sm:py-2 sm:text-sm ${
                    activeFilter === 'cursos'
                      ? 'bg-foreground text-background'
                      : 'border-foreground/30 hover:border-foreground hover:text-foreground border bg-transparent font-medium text-[#94A3B8]'
                  }`}
                  disabled={isNavigating && pendingFilter === 'cursos'}
                >
                  <span className="inline-flex items-center gap-2">
                    Cursos
                    {isNavigating && pendingFilter === 'cursos' && (
                      <span
                        className="filter-button-loader"
                        aria-label="Cargando"
                      />
                    )}
                  </span>
                </button>
                <button
                  onClick={() => handleFilterClick('programas')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 sm:px-5 sm:py-2 sm:text-sm ${
                    activeFilter === 'programas'
                      ? 'bg-foreground text-background'
                      : 'border-foreground/30 hover:border-foreground hover:text-foreground border bg-transparent font-medium text-[#94A3B8]'
                  }`}
                  disabled={isNavigating && pendingFilter === 'programas'}
                >
                  <span className="inline-flex items-center gap-2">
                    Programas
                    {isNavigating && pendingFilter === 'programas' && (
                      <span
                        className="filter-button-loader"
                        aria-label="Cargando"
                      />
                    )}
                  </span>
                </button>
                <MdFilterAlt
                  className="text-2xl text-white"
                  aria-label="Filtro"
                />
              </div>
            </div>
            {isNavigating && (
              <div
                className="mt-16 flex w-full justify-center"
                aria-label="Cargando filtros"
              >
                <span className="artiefy-filter-loader" />
              </div>
            )}
          </div>

          {/* Sección: cursos en los que estoy inscritos - vista previa */}
          {activeFilter === 'todos' && !isNavigating && <MyCoursesPreview />}

          {/* Carousel grande - Featured Courses - TEMPORALMENTE OCULTO 
          <div className="animation-delay-100 animate-zoom-in couses-section relative h-[300px] overflow-hidden px-8 sm:h-[400px] md:h-[500px]">
            {latestFiveCourses.length > 0 ? (
              latestFiveCourses.map((course, index) => (
                <div
                  key={course.id}
                  className={`absolute inset-0 transform transition-all duration-500 ${index === currentSlide
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
                    }`}
                >
                  <div className="relative size-full">
                    <Image
                      src={getImageUrl(course.coverImageKey)}
                      alt={course.title}
                      fill
                      className="object-cover"
                      priority={index === currentSlide}
                      sizes="100vw"
                      quality={100}
                    />
                  </div>
                  <div className="text-primary absolute inset-0 flex items-center justify-start p-4">
                    <div
                      className="ml-2 w-[350px] max-w-[90%] rounded-xl bg-white/10 p-4 backdrop-blur-md sm:ml-8 sm:w-[400px] sm:p-6"
                      style={{
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                      }}
                    >
                      <div className="flex flex-col space-y-2 sm:hidden">
                        <h2 className="line-clamp-2 text-xl font-semibold" title={course.title}>
                          {course.title}
                        </h2>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <StarIcon className="size-4 text-yellow-500" />
                            <span className="ml-1 text-sm text-yellow-500">
                              {(course.rating ?? 0).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-red-500">
                            {course.modalidad?.name}
                          </span>
                        </div>
                        <div className="flex justify-center pt-2">
                          <Link href={`/estudiantes/cursos/${course.id}`}>
                            <button className="uiverse">
                              <div className="wrapper">
                                <span className="text-white">Ir al Curso</span>
                                <div className="circle circle-12" />
                                <div className="circle circle-11" />
                                <div className="circle circle-10" />
                                <div className="circle circle-9" />
                                <div className="circle circle-8" />
                                <div className="circle circle-7" />
                                <div className="circle circle-6" />
                                <div className="circle circle-5" />
                                <div className="circle circle-4" />
                                <div className="circle circle-3" />
                                <div className="circle circle-2" />
                                <div className="circle circle-1" />
                              </div>
                            </button>
                          </Link>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <h2 className="mb-2 line-clamp-3 text-3xl font-semibold sm:mb-4 sm:text-4xl" title={course.title}>
                          {course.title}
                        </h2>
                        <Badge variant="outline" className="border-primary text-primary mb-2">
                          {course.category?.name ?? 'Sin categoría'}
                        </Badge>
                        <p className="mb-2 line-clamp-2 text-sm sm:text-base" title={course.description ?? ''}>
                          {truncateDescription(course.description ?? '', 150)}
                        </p>
                        <p className="mb-1 text-sm font-bold sm:text-base">
                          Educador: {course.instructorName}
                        </p>
                        <p className="mb-1 text-sm font-bold text-red-500 sm:text-base">
                          {course.modalidad?.name ?? 'Modalidad no especificada'}
                        </p>
                        <div className="mb-4 flex items-center">
                          <StarIcon className="size-4 text-yellow-500 sm:size-5" />
                          <span className="ml-1 text-sm text-yellow-500 sm:text-base">
                            {(course.rating ?? 0).toFixed(1)}
                          </span>
                        </div>
                        <Link href={`/estudiantes/cursos/${course.id}`}>
                          <button className="uiverse">
                            <div className="wrapper">
                              <span className="text-white">Ir al Curso</span>
                              <div className="circle circle-12" />
                              <div className="circle circle-11" />
                              <div className="circle circle-10" />
                              <div className="circle circle-9" />
                              <div className="circle circle-8" />
                              <div className="circle circle-7" />
                              <div className="circle circle-6" />
                              <div className="circle circle-5" />
                              <div className="circle circle-4" />
                              <div className="circle circle-3" />
                              <div className="circle circle-2" />
                              <div className="circle circle-1" />
                            </div>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-lg text-gray-500">
                  No hay cursos destacados disponibles
                </p>
              </div>
            )}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
              {latestFiveCourses.map((_, index) => (
                <button
                  key={index}
                  className={`size-3 rounded-full ${index === currentSlide ? 'bg-primary' : 'bg-gray-300'}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
          FIN Carousel grande - TEMPORALMENTE OCULTO */}

          {/* Top Cursos section */}
          {activeFilter === 'todos' && !isNavigating && (
            <div className="animation-delay-200 animate-zoom-in relative pr-0 pl-4 sm:px-24">
              <div className="mb-4 flex justify-start pr-4 sm:pr-0">
                <div className="flex items-center gap-2">
                  <FaArrowTrendUp className="text-xl text-white" />
                  <StudentGradientText className="text-2xl sm:text-3xl">
                    Top Cursos
                  </StudentGradientText>
                </div>
              </div>
              <div className="group/carousel relative">
                <Carousel className="w-full" setApi={setTopCoursesApi}>
                  {/* Agrega gap-x-4 para más espacio entre los cursos */}
                  <CarouselContent className="gap-x-2">
                    {latestTenCourses.length > 0 ? (
                      latestTenCourses.map((course, idx) => {
                        const titleText = course.title ?? '';
                        const titleLength = titleText.length;
                        const titleWordCount = titleText
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length;
                        const isShortTitle =
                          titleLength <= 50 && titleWordCount <= 6;
                        const titleSpacingClass = isShortTitle
                          ? 'min-h-[1.8rem]'
                          : 'min-h-[2.4rem]';
                        const titleLineHeightClass = isShortTitle
                          ? 'leading-snug'
                          : 'leading-[1.70]';
                        const instructorSpacingClass = isShortTitle
                          ? 'mb-5'
                          : 'mt-0.5';

                        return (
                          <CarouselItem
                            key={course.id}
                            className="basis-[85%] sm:basis-[60%] md:basis-1/3 lg:basis-[28%]"
                          >
                            <Link
                              href={`/estudiantes/cursos/${course.id}`}
                              className="group/card focus-visible:outline-primary relative block overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-offset-2"
                            >
                              <div className="relative h-56 w-full">
                                <Image
                                  src={getImageUrl(course.coverImageKey)}
                                  alt={course.title}
                                  fill
                                  className="h-full w-full rounded-2xl object-cover transition-transform duration-300 group-hover/card:scale-105"
                                  sizes="(max-width: 768px) 100vw, 420px"
                                  quality={85}
                                  placeholder="blur"
                                  blurDataURL={blurDataURL}
                                />
                                {/* Number badge top-left */}
                                <div className="bg-primary absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full">
                                  <span className="text-xs font-bold text-black">
                                    {idx + 1}
                                  </span>
                                </div>

                                {/* Bottom gradient overlay: subtle fade from bottom to top */}
                                <div className="absolute right-0 bottom-0 left-0 h-28 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />

                                {/* Bottom overlay: full-width content area */}
                                <div className="absolute right-0 bottom-0 left-0 pb-0">
                                  <div className="relative z-10 w-full rounded-b-2xl px-4 py-3">
                                    <h3
                                      className={`text-foreground line-clamp-2 text-[13px] font-semibold sm:text-[15px] ${titleSpacingClass} ${titleLineHeightClass}`}
                                      title={course.title}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                      }}
                                    >
                                      {course.title}
                                    </h3>
                                    <p
                                      className={`${instructorSpacingClass} text-[13px] text-gray-200 sm:text-[13px]`}
                                    >
                                      {course.instructorName}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </CarouselItem>
                        );
                      })
                    ) : (
                      <CarouselItem className="flex h-56 items-center justify-center">
                        <p className="text-lg text-gray-500">
                          No hay cursos top disponibles
                        </p>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {latestTenCourses.length > 0 && (
                    <>
                      <CarouselPrevious />
                      <CarouselNext />
                    </>
                  )}
                </Carousel>

                {/* Flechas funcionales solo en móvil */}
                {latestTenCourses.length > 0 && (
                  <>
                    {canScrollPrevTop && (
                      <button
                        onClick={() => topCoursesApi?.scrollPrev()}
                        className="pointer-events-auto absolute top-1/2 left-2 -translate-y-1/2 sm:hidden"
                        aria-label="Anterior"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                          <IoIosArrowBack className="text-2xl text-white" />
                        </div>
                      </button>
                    )}
                    <button
                      onClick={() => topCoursesApi?.scrollNext()}
                      className="pointer-events-auto absolute top-1/2 right-2 -translate-y-1/2 sm:hidden"
                      aria-label="Siguiente"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                        <IoIosArrowForward className="text-2xl text-white" />
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Lista completa de cursos - Solo cuando el filtro es 'cursos' */}
          {activeFilter === 'cursos' && !isNavigating && (
            <div
              id="courses-filter-section"
              className="animation-delay-250 animate-zoom-in relative -mt-4 px-4 sm:-mt-6 sm:px-8 lg:px-20"
            >
              <div className="mb-4 flex justify-start sm:mb-8">
                <div className="flex items-center gap-2">
                  <HiLibrary className="text-xl text-white" />
                  <StudentGradientText className="text-2xl sm:text-3xl">
                    Cursos Artie
                  </StudentGradientText>
                </div>
              </div>

              <div className="relative z-0 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.length > 0 ? (
                  courses.map((course) => {
                    const imageUrl =
                      course.coverImageKey && course.coverImageKey !== 'NULL'
                        ? `/api/image-proxy?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`)}`
                        : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';

                    const getCourseTypeLabel = () => {
                      if (course.courseTypes && course.courseTypes.length > 0) {
                        const hasPurchasable = course.courseTypes.some(
                          (type) => type.isPurchasableIndividually
                        );
                        const hasPremium = course.courseTypes.some(
                          (type) => type.requiredSubscriptionLevel === 'premium'
                        );
                        const hasPro = course.courseTypes.some(
                          (type) => type.requiredSubscriptionLevel === 'pro'
                        );
                        const hasFree = course.courseTypes.some(
                          (type) =>
                            type.requiredSubscriptionLevel === 'none' &&
                            !type.isPurchasableIndividually
                        );

                        if (hasPurchasable) {
                          return (
                            <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                              <FaStar className="h-3 w-3" />${' '}
                              {course.individualPrice
                                ? course.individualPrice.toLocaleString('es-CO')
                                : 'Comprar'}
                            </div>
                          );
                        }
                        if (hasPremium) {
                          return (
                            <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                              <FaCrown className="h-3 w-3" />
                              Premium
                            </div>
                          );
                        }
                        if (hasPro) {
                          return (
                            <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                              <FaStar className="h-3 w-3" />
                              Pro
                            </div>
                          );
                        }
                        if (hasFree) {
                          return (
                            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                              <IoGiftOutline className="h-3 w-3" />
                              Gratuito
                            </div>
                          );
                        }
                      }
                      return null;
                    };

                    return (
                      <div key={course.id} className="relative">
                        {course.isActive ? (
                          <Link
                            href={`/estudiantes/cursos/${course.id}`}
                            aria-label={`Ver detalles del curso ${course.title}`}
                            className="group focus-visible:ring-primary/70 block h-full rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            <Card className="artiefy-course-card zoom-in text-foreground hover:border-primary relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border-0 bg-[#061C37] p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:cursor-pointer hover:shadow-xl">
                              <div className="relative -mx-4 -mt-4 overflow-hidden">
                                <AspectRatio ratio={16 / 9}>
                                  <div className="relative h-full w-full">
                                    <Image
                                      src={imageUrl}
                                      alt={course.title || 'Imagen del curso'}
                                      className="object-cover"
                                      fill
                                      placeholder="blur"
                                      blurDataURL={blurDataURL}
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      quality={75}
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061C37] via-[#061C37]/60 to-transparent" />
                                  </div>
                                </AspectRatio>
                              </div>

                              <div className="flex h-full flex-1 flex-col gap-3">
                                <h3 className="line-clamp-2 text-base leading-snug font-semibold text-white md:text-lg">
                                  {course.title}
                                </h3>

                                <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-row">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs text-[#94A3B8]">
                                      Por:{' '}
                                      <span className="text-primary font-medium">
                                        {course.instructorName ?? 'Educador'}
                                      </span>
                                    </p>
                                  </div>

                                  <div className="flex items-center text-sm">
                                    {getCourseTypeLabel()}
                                  </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="chip chip-modalidad">
                                    {course.modalidad?.name ??
                                      'Asistida Virtual'}
                                  </span>
                                  {course.horario && (
                                    <span className="chip chip-horario">
                                      {course.horario}
                                    </span>
                                  )}
                                  {course.espacios && (
                                    <span className="chip chip-espacios">
                                      {course.espacios}
                                    </span>
                                  )}
                                  <span className="chip chip-categoria">
                                    {course.category?.name ?? 'Sin categoría'}
                                  </span>
                                </div>

                                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#94A3B8]">
                                  Empieza:{' '}
                                  {course.modalidad &&
                                  String(course.modalidad?.name)
                                    .toLowerCase()
                                    .includes('presencial') ? (
                                    <span className="text-gray-100">
                                      Clases Presenciales
                                    </span>
                                  ) : (
                                    <span className="text-gray-100">
                                      Clases Virtuales
                                    </span>
                                  )}
                                </p>
                              </div>
                            </Card>
                          </Link>
                        ) : (
                          <div className="group relative h-full rounded-2xl opacity-80">
                            <Card className="artiefy-course-card zoom-in text-foreground relative flex h-full cursor-not-allowed flex-col gap-4 overflow-hidden rounded-2xl border-0 bg-[#061C37] p-4 shadow-md transition-all duration-300">
                              <div className="relative -mx-4 -mt-4 overflow-hidden">
                                <AspectRatio ratio={16 / 9}>
                                  <div className="relative h-full w-full">
                                    <Image
                                      src={imageUrl}
                                      alt={course.title || 'Imagen del curso'}
                                      className="object-cover"
                                      fill
                                      placeholder="blur"
                                      blurDataURL={blurDataURL}
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      quality={75}
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061C37] via-[#061C37]/60 to-transparent" />
                                  </div>
                                </AspectRatio>
                              </div>
                              <div className="flex h-full flex-1 flex-col gap-3">
                                <h3 className="line-clamp-2 text-base leading-snug font-semibold text-white md:text-lg">
                                  {course.title}
                                </h3>
                              </div>
                            </Card>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-lg font-semibold">
                              Muy pronto
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full flex h-56 items-center justify-center">
                    <p className="text-lg text-gray-500">
                      No hay cursos disponibles
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Programas section */}
          {!isNavigating &&
            (activeFilter === 'todos' || activeFilter === 'programas') && (
              <div
                id="programas-section"
                className={`animation-delay-300 animate-zoom-in relative ${activeFilter === 'programas' ? '-mt-2 sm:-mt-4' : '-mt-8 sm:-mt-10'} pr-0 pl-4 sm:px-24`}
              >
                <div className="flex justify-start pr-4 sm:pr-0">
                  <div className="-mb-5 flex items-center gap-2">
                    <IoLibrarySharp className="text-xl text-white" />
                    <StudentGradientText className="text-2xl sm:text-3xl">
                      Programas
                    </StudentGradientText>
                  </div>
                </div>
                {activeFilter === 'todos' ? (
                  // Carousel para vista 'todos'
                  <div className="group/carousel relative">
                    <Carousel className="w-full" setApi={setProgramsApi}>
                      <CarouselContent className="my-6 gap-x-2">
                        {sortedPrograms.map((program) => (
                          <CarouselItem
                            key={program.id}
                            className="basis-[85%] sm:basis-1/2 lg:basis-[30%]"
                          >
                            <StudentProgram program={program} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>

                    {/* Flechas funcionales solo en móvil */}
                    {sortedPrograms.length > 0 && (
                      <>
                        {canScrollPrevPrograms && (
                          <button
                            onClick={() => programsApi?.scrollPrev()}
                            className="pointer-events-auto absolute top-1/2 left-2 -translate-y-1/2 sm:hidden"
                            aria-label="Anterior"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                              <IoIosArrowBack className="text-2xl text-white" />
                            </div>
                          </button>
                        )}
                        <button
                          onClick={() => programsApi?.scrollNext()}
                          className="pointer-events-auto absolute top-1/2 right-2 -translate-y-1/2 sm:hidden"
                          aria-label="Siguiente"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                            <IoIosArrowForward className="text-2xl text-white" />
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  // Grid para vista 'programas' (sin carousel)
                  <div className="my-6 grid gap-4 pr-4 sm:grid-cols-2 sm:pr-0 lg:grid-cols-3">
                    {sortedPrograms.map((program) => (
                      <div key={program.id}>
                        <StudentProgram program={program} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* Categorías de cursos */}
          {/* <StudentCategories allCategories={allCategories} featuredCategories={featuredCategories} /> */}
        </div>
      </main>
      <StudentChatbot
        isAlwaysVisible={true}
        showChat={showChatbot}
        key={chatbotKey}
        className="animation-delay-400 animate-zoom-in"
        initialSearchQuery={lastSearchQuery}
        onSearchComplete={handleSearchComplete}
      />
      <style jsx global>{`
        body[data-hide-server-sections='true'] #student-categories-section,
        body[data-hide-server-sections='true'] #courses-list-section {
          display: none !important;
        }
        body[data-animate-server-sections='true'] #student-categories-section,
        body[data-animate-server-sections='true'] #courses-list-section {
          animation: artiefy-fade-in-up 0.35s ease;
        }
        @keyframes artiefy-fade-in-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
