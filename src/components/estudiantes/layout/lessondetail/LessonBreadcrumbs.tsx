'use client';

import Link from 'next/link';

import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { SquarePlay } from 'lucide-react';
import { FaBook,FaHome, FaUserGraduate } from 'react-icons/fa';

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
		<nav className="ml-8">
			{' '}
			{/* Add left margin */}
			<ol className="flex items-center space-x-2 text-sm text-gray-400">
				{' '}
				{/* Lighten gray color */}
				<li>
					<Link href="/" className="flex items-center hover:underline">
						<FaHome className="mr-1" /> Inicio
					</Link>
				</li>
				<li>
					<ChevronRightIcon className="h-4 w-4" />
				</li>
				<li>
					<Link
						href="/estudiantes"
						className="flex items-center hover:underline"
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
						className="flex items-center hover:underline"
					>
						<FaBook className="mr-1" /> {courseTitle}
					</Link>
				</li>
				<li>
					<ChevronRightIcon className="h-4 w-4" />
				</li>
				<li className="flex items-center font-bold text-primary">
					<SquarePlay className="mr-1 size-5" /> {lessonTitle}
				</li>
			</ol>
		</nav>
	);
};

export default LessonBreadcrumbs;
