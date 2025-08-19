'use client';

import Link from 'next/link';

import { FaComments, FaHome, FaUserGraduate } from 'react-icons/fa';
import { GrReturn } from 'react-icons/gr';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/estudiantes/ui/breadcrumb';

interface ForumBreadcrumbsProps {
  courseId: number;
  courseTitle: string;
  forumTitle: string;
}

export function ForumBreadcrumbs({
  courseId,
  courseTitle,
  forumTitle,
}: ForumBreadcrumbsProps) {
  return (
    <div className="relative z-20 flex w-full items-center justify-between backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
      <div className="min-w-0 flex-1">
        <Breadcrumb className="w-full overflow-x-auto pt-2 pb-2 md:pt-0">
          <BreadcrumbList className="flex w-full flex-nowrap items-center gap-1 px-4 whitespace-nowrap md:px-0">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <FaHome className="mr-1 inline-block" /> Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/estudiantes">
                <FaUserGraduate className="mr-1 inline-block" /> Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/estudiantes/cursos/${courseId}`}>
                <span
                  className="inline-block max-w-[180px] truncate align-middle md:max-w-none"
                  title={courseTitle}
                >
                  {courseTitle}
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <FaComments className="mr-1 inline-block" />
                <span
                  className="inline-block max-w-[180px] truncate align-middle md:max-w-none"
                  title={forumTitle}
                >
                  {/* Mostrar "Discusiones del curso - {courseTitle}" */}
                  {`Discusiones del curso - ${courseTitle}`}
                </span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex-shrink-0 pr-4">
        <Link
          href={`/estudiantes/cursos/${courseId}`}
          className="text-primary flex items-center gap-1 font-semibold hover:underline"
        >
          Volver al curso <GrReturn className="ml-1 inline-block" />
        </Link>
      </div>
    </div>
  );
}
