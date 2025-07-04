'use client';

import Link from 'next/link';

import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { SquarePlay } from 'lucide-react';
import { FaBook, FaHome, FaUserGraduate } from 'react-icons/fa';

interface LessonBreadcrumbsProps {
  courseTitle: string;
  courseId: number;
  lessonTitle: string;
}

const LessonBreadcrumbs = ({
  courseTitle,
  courseId,
  lessonTitle,
}: LessonBreadcrumbsProps) => {
  return (
    <nav className="w-full max-w-full overflow-x-auto px-2 md:px-8">
      <ol className="flex items-center space-x-2 pr-2 text-sm whitespace-nowrap text-gray-400">
        <li>
          <Link
            href="/"
            className="flex items-center hover:underline focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <FaHome className="mr-1" /> Inicio
          </Link>
        </li>
        <li>
          <ChevronRightIcon className="h-4 w-4" />
        </li>
        <li>
          <Link
            href="/estudiantes"
            className="flex items-center hover:underline focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <FaUserGraduate className="mr-1" /> Cursos
          </Link>
        </li>
        <li>
          <ChevronRightIcon className="h-4 w-4" />
        </li>
        <li>
          <Link
            href={`/estudiantes/cursos/${courseId}`}
            className="flex max-w-[120px] items-center truncate hover:underline focus:ring-2 focus:ring-blue-500 focus:outline-none md:max-w-xs"
            title={courseTitle}
          >
            <FaBook className="mr-1" /> {courseTitle}
          </Link>
        </li>
        <li>
          <ChevronRightIcon className="h-4 w-4" />
        </li>
        <li
          className="text-primary flex max-w-[120px] items-center truncate pr-2 font-bold md:max-w-xs"
          title={lessonTitle}
        >
          <SquarePlay className="mr-1 size-5" /> {lessonTitle}
        </li>
      </ol>
    </nav>
  );
};

export default LessonBreadcrumbs;
