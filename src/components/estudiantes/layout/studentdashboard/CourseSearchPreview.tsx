'use client';

import Image from 'next/image';

import type { Course } from '~/types';

interface CourseSearchPreviewProps {
  courses: Course[];
  onSelectCourse?: (courseId: number) => void;
}

function getImageUrl(coverImageKey: string | null | undefined) {
  if (!coverImageKey || coverImageKey === 'NULL') {
    return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
  }
  const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`;
  return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
}

export default function CourseSearchPreview({
  courses,
  onSelectCourse,
}: CourseSearchPreviewProps) {
  if (!courses || courses.length === 0) return null;
  return (
    <div className="bg-background/95 absolute inset-x-4 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-white/10 text-white shadow-lg sm:inset-x-0">
      {courses.map((course) => (
        <div
          key={course.id}
          className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-white/5"
          onClick={() => onSelectCourse?.(course.id)}
        >
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-gray-800">
            {course.coverImageKey ? (
              <Image
                src={getImageUrl(course.coverImageKey)}
                alt={course.title}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                Sin imagen
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {course.title}
            </span>
            <span className="text-xs text-gray-300">
              {course.category?.name ?? 'Sin categoría'} |{' '}
              {course.modalidad?.name ?? 'Sin modalidad'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
