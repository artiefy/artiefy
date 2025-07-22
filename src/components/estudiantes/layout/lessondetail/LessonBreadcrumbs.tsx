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
    <nav className="w-full max-w-full overflow-x-auto px-2 sm:mt-12 md:px-8">
      <ol className="flex flex-nowrap items-center space-x-2 pr-2 text-sm whitespace-nowrap text-gray-400">
        <li>
          <Link
            href="/"
            className="hover:text-primary flex items-center hover:underline focus:ring-0 focus:outline-none"
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
            className="hover:text-primary flex items-center hover:underline focus:ring-0 focus:outline-none"
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
            className="hover:text-primary flex items-center break-words whitespace-normal hover:underline focus:ring-0 focus:outline-none"
            title={courseTitle}
          >
            <FaBook className="mr-1" />{' '}
            <span
              className="sm:truncate-none inline-block max-w-none truncate align-middle sm:max-w-[70px]"
              title={courseTitle}
            >
              {courseTitle}
            </span>
          </Link>
        </li>
        <li>
          <ChevronRightIcon className="h-4 w-4" />
        </li>
        <li
          className="text-primary mb-2 flex items-center pr-2 font-bold sm:mb-0"
          title={lessonTitle}
        >
          <SquarePlay className="mr-1 size-5" />{' '}
          <span
            className="sm:truncate-none inline-block max-w-none truncate align-middle sm:max-w-[70px]"
            title={lessonTitle}
          >
            {lessonTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default LessonBreadcrumbs;
