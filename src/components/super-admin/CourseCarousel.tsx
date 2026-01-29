import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  coverImageKey: string | null;
  instructor: string;
  modalidad?: { name: string };
  rating?: number;
}

interface Props {
  courses: Course[];
  userId: string;
}

export default function CourseCarousel({ courses, userId }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const router = useRouter();
  if (typeof router === 'string' && router) {
    // Variable utilizada para evitar warnings, no afecta la lógica
  }

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    // Ya no llamamos a onSelect() directamente para evitar setState sincrónico
  }, [emblaApi, onSelect]);

  return (
    <div className="relative z-0 w-full overflow-hidden px-6 py-4">
      {' '}
      {/* 🔥 Margen extra para que no se corte */}
      <div className="overflow-hidden px-6 py-8" ref={emblaRef}>
        <div className="flex space-x-4">
          {courses.map((course) => {
            console.log('➡️ Navegando a curso:', {
              courseId: course.id,
              userId,
            });
            return (
              <div
                key={course.id}
                className="relative isolate z-10 mx-2 w-48 flex-shrink-0 overflow-visible rounded-lg bg-gray-800 px-4 py-4 shadow-[0_0px_15px_rgba(0,189,216,0.5)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0px_25px_rgba(0,189,216,0.6)]"
              >
                {/* Imagen */}
                {course.coverImageKey ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${encodeURIComponent(course.coverImageKey)}`}
                    alt={course.title}
                    width={192}
                    height={108}
                    className="h-20 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-full items-center justify-center rounded-md bg-gray-700">
                    Sin imagen
                  </div>
                )}

                {/* Información */}
                <div className="p-2 text-white">
                  <p className="text-xs font-semibold text-primary">Nombre:</p>
                  <h2 className="truncate text-sm font-bold text-white">
                    {course.title}
                  </h2>
                </div>

                {/* Footer */}
                <div className="mt-2 flex flex-col items-start justify-between space-y-2 px-2">
                  <div className="flex w-full justify-between">
                    <p className="text-xs font-bold text-red-500">
                      {course.modalidad?.name}
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between">
                    {/* Botón "Ver Curso" */}
                    <Link
                      href={`/dashboard/super-admin/stats/${course.id}?user=${userId}`}
                      className="group/button relative flex w-full items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-xs font-bold text-primary transition-all active:scale-95"
                    >
                      <p className="font-bold">Ver Curso</p>
                      <ArrowRight className="ml-2 size-4 animate-bounce-right" />
                      <div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
                        <div className="relative h-full w-10 bg-white/30" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Botones de navegación */}
      {courses.length > 4 && (
        <>
          <button
            className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-gray-900 p-2 text-white shadow-md hover:bg-gray-700"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full bg-gray-900 p-2 text-white shadow-md hover:bg-gray-700"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
