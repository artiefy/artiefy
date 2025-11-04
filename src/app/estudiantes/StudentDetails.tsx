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

import { StarIcon } from '@heroicons/react/24/solid';

import CourseSearchPreview from '~/components/estudiantes/layout/studentdashboard/CourseSearchPreview';
import MyCoursesPreview from '~/components/estudiantes/layout/studentdashboard/MyCoursesPreview';
import { StudentArtieIa } from '~/components/estudiantes/layout/studentdashboard/StudentArtieIa';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import StudentGradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { StudentProgram } from '~/components/estudiantes/layout/studentdashboard/StudentProgram';
import { Badge } from '~/components/estudiantes/ui/badge';
import {
  Carousel,
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
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [chatbotKey, setChatbotKey] = useState<number>(0);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
  const [searchBarDisabled, setSearchBarDisabled] = useState<boolean>(false);
  const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  // Debounce para evitar demasiadas llamadas
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setPreviewCourses([]);
      setShowPreview(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { searchCoursesPreview } = await import(
          '~/server/actions/estudiantes/courses/searchCoursesPreview'
        );
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

    return () => {
      window.removeEventListener(
        'artiefy-search',
        handleGlobalSearch as EventListener
      );
      window.removeEventListener('force-open-chatbot', handleForceOpenChatbot);
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

  const truncateDescription = (description: string, maxLength: number) => {
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
    <div className="-mb-8 flex min-h-screen flex-col sm:mb-0">
      <main className="grow">
        <div className="container mx-auto">
          <div className="flex flex-col space-y-12 sm:space-y-16">
            <div className="animate-zoom-in mt-8 flex flex-col items-center space-y-4">
              <div className="flex items-center">
                <Image
                  src="/artiefy-icon.png"
                  alt="Artiefy Icon"
                  width={62}
                  height={62}
                  className="size-[62px] sm:size-14"
                  style={{ width: 'auto', height: 'auto' }}
                  priority
                />
                <div className="ml-2">
                  <StudentArtieIa />
                </div>
              </div>

              <form
                onSubmit={handleSearch}
                className="relative flex w-full flex-col items-center space-y-2"
              >
                <div className="header-search-container relative">
                  <input
                    required
                    className={`header-input border-primary ${
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
              </form>
            </div>

            {/* Sección: cursos en los que estoy inscrito - vista previa */}
            <MyCoursesPreview />

            <div className="animation-delay-100 animate-zoom-in couses-section relative h-[300px] overflow-hidden px-8 sm:h-[400px] md:h-[500px]">
              {/* Carousel grande - Featured Courses */}
              {latestFiveCourses.length > 0 ? (
                latestFiveCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className={`absolute inset-0 transform transition-all duration-500 ${
                      index === currentSlide
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
                        quality={100} // <-- quality 100 is now allowed in config
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
                        {/* Mobile view (sm:hidden) */}
                        <div className="flex flex-col space-y-2 sm:hidden">
                          <h2
                            className="line-clamp-2 text-xl font-semibold"
                            title={course.title}
                          >
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
                                  <span className="text-white">
                                    Ir al Curso
                                  </span>
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

                        {/* Desktop view (hidden sm:block) */}
                        <div className="hidden sm:block">
                          <h2
                            className="mb-2 line-clamp-3 text-3xl font-semibold sm:mb-4 sm:text-4xl"
                            title={course.title}
                          >
                            {course.title}
                          </h2>
                          <Badge
                            variant="outline"
                            className="border-primary text-primary mb-2"
                          >
                            {course.category?.name ?? 'Sin categoría'}
                          </Badge>
                          <p
                            className="mb-2 line-clamp-2 text-sm sm:text-base"
                            title={course.description ?? ''}
                          >
                            {truncateDescription(course.description ?? '', 150)}
                          </p>
                          <p className="mb-1 text-sm font-bold sm:text-base">
                            Educador: {course.instructorName}
                          </p>
                          <p className="mb-1 text-sm font-bold text-red-500 sm:text-base">
                            {course.modalidad?.name ??
                              'Modalidad no especificada'}
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
                    className={`size-3 rounded-full ${
                      index === currentSlide ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>

            {/* Top Cursos section */}
            <div className="animation-delay-200 animate-zoom-in relative px-12 sm:px-24">
              <div className="flex justify-center">
                <StudentGradientText className="mb-6 text-3xl sm:text-5xl">
                  Top Cursos
                </StudentGradientText>
              </div>
              <div>
                <Carousel className="w-full">
                  {/* Agrega gap-x-4 para más espacio entre los cursos */}
                  <CarouselContent className="gap-x-4">
                    {latestTenCourses.length > 0 ? (
                      latestTenCourses.map((course) => (
                        <CarouselItem
                          key={course.id}
                          // Show 3 cards + small peek of the 4th on large screens
                          className="basis-full px-2 sm:max-w-[400px] sm:basis-1/2 lg:max-w-[430px] lg:basis-[30%]"
                        >
                          <div className="relative aspect-[4/3] w-full">
                            <Image
                              src={
                                course.coverImageKey &&
                                course.coverImageKey !== 'NULL'
                                  ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
                                  : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
                              }
                              alt={course.title}
                              fill
                              className="rounded-lg object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              quality={85}
                              placeholder="blur"
                              blurDataURL={blurDataURL}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 p-4 text-white">
                              <Link href={`/estudiantes/cursos/${course.id}`}>
                                <h3
                                  className="line-clamp-3 text-sm font-bold text-white hover:underline active:scale-95 sm:text-lg"
                                  title={course.title}
                                >
                                  {course.title}
                                </h3>
                              </Link>
                              <div className="mt-1 -mb-1 flex items-center justify-between gap-x-2 sm:mt-2 sm:mb-3">
                                <Badge
                                  variant="outline"
                                  className="border-primary bg-background text-primary line-clamp-1 max-w-[60%] text-[8px] sm:text-sm"
                                >
                                  {course.category?.name}
                                </Badge>
                                <span className="text-right text-[8px] font-bold whitespace-pre-line text-red-500 sm:text-base sm:whitespace-normal">
                                  {course.modalidad?.name}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <p className="text-primary text-xs font-semibold italic sm:text-base">
                                  Educador: <span>{course.instructorName}</span>
                                </p>
                                <div className="flex items-center">
                                  <StarIcon className="size-4 text-yellow-500 sm:size-5" />
                                  <span className="ml-1 text-sm font-bold text-yellow-500 sm:text-base">
                                    {(course.rating ?? 0).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem className="flex h-40 items-center justify-center">
                        <p className="text-lg text-gray-500">
                          No hay cursos top disponibles
                        </p>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {latestTenCourses.length > 0 && (
                    <>
                      <CarouselPrevious className="-left-9 size-8 bg-black/50 text-white sm:-left-20 sm:size-12" />
                      <CarouselNext className="-right-9 size-8 bg-black/50 text-white sm:-right-20 sm:size-12" />
                    </>
                  )}
                </Carousel>
              </div>
            </div>

            {/* Programas section */}
            <div className="animation-delay-300 animate-zoom-in relative px-12 sm:px-24">
              <div className="flex justify-center">
                <StudentGradientText className="text-3xl sm:text-5xl">
                  Programas
                </StudentGradientText>
              </div>
              <div>
                <Carousel className="w-full">
                  <CarouselContent className="my-6">
                    {sortedPrograms.map((program) => (
                      <CarouselItem
                        key={program.id}
                        // Show 3 cards + small peek of the 4th on large screens
                        className="basis-full sm:basis-1/2 lg:basis-[30%]"
                      >
                        <StudentProgram program={program} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-9 size-8 bg-black/50 text-white sm:-left-20 sm:size-12" />
                  <CarouselNext className="-right-9 size-8 bg-black/50 text-white sm:-right-20 sm:size-12" />
                </Carousel>
              </div>
            </div>
          </div>
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
    </div>
  );
}
