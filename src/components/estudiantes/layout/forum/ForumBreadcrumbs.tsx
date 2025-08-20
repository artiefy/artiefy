'use client';

import Link from 'next/link';

import { FaComments, FaHome, FaUserGraduate } from 'react-icons/fa';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/estudiantes/ui/breadcrumb';

import '~/styles/volverCursoBtn.css';

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
    <div className="relative z-20 flex w-full flex-col items-start backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
      <div className="w-full min-w-0">
        <Breadcrumb className="-px-0 w-full overflow-x-auto pt-2 pb-2 sm:px-6 md:pt-0">
          <BreadcrumbList className="flex w-full flex-nowrap items-center gap-1 whitespace-nowrap md:px-0">
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
      <div className="-mb-7 flex-shrink-0 pt-1 pl-0 sm:-mb-0 md:pl-4">
        <Link
          href={`/estudiantes/cursos/${courseId}`}
          className="Btn-Container"
        >
          <span className="icon-Container">
            {/* Flecha SVG apuntando a la izquierda */}
            <svg
              width="16"
              height="19"
              viewBox="0 0 16 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: 'scaleX(-1)' }}
            >
              <circle cx="1.61321" cy="1.61321" r="1.5" fill="black" />
              <circle cx="5.73583" cy="1.61321" r="1.5" fill="black" />
              <circle cx="5.73583" cy="5.5566" r="1.5" fill="black" />
              <circle cx="9.85851" cy="5.5566" r="1.5" fill="black" />
              <circle cx="9.85851" cy="9.5" r="1.5" fill="black" />
              <circle cx="13.9811" cy="9.5" r="1.5" fill="black" />
              <circle cx="5.73583" cy="13.4434" r="1.5" fill="black" />
              <circle cx="9.85851" cy="13.4434" r="1.5" fill="black" />
              <circle cx="1.61321" cy="17.3868" r="1.5" fill="black" />
              <circle cx="5.73583" cy="17.3868" r="1.5" fill="black" />
            </svg>
          </span>
          <span className="text">Volver al Curso</span>
        </Link>
      </div>
    </div>
  );
}
