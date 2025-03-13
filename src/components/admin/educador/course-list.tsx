import Image from 'next/image';

import { Button } from '~/components/admin/ui/button';
import { Card } from '~/components/admin/ui/card';
import { cn } from '~/lib/utils';

// Importar el tipo Course desde el archivo correcto
import type { Course } from '~/types/types';

interface CourseListProps {
	courses: Course[] | undefined;
	onViewCourse: (course: Course) => void;
	onClose: () => void;
	className?: string;
}

export function CourseList({
	courses,
	onViewCourse,
	onClose,
	className,
}: CourseListProps) {
	return (
		<div className={cn('space-y-6', className)}>
			<h2 className="text-2xl font-semibold text-white">
				Cursos en los que está inscrito
			</h2>
			{!courses || courses.length === 0 ? (
				<p className="py-8 text-center text-gray-400">
					No hay cursos asignados actualmente.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{courses.map((course) => (
						<Card
							key={course.id}
							className="cursor-pointer overflow-hidden border-none bg-[#1a2234] transition-transform duration-200 hover:translate-y-[-2px]"
							onClick={() => onViewCourse(course)}
						>
							<div className="relative flex aspect-[2/1] items-center justify-center bg-[#e2e8f0]">
								<Image
									src={course.imageUrl ?? '/placeholder.svg'}
									alt={course.title}
									layout="fill"
									objectFit="cover"
								/>
								: (
								<span className="px-4 text-center text-gray-500">
									Imagen no disponible
								</span>
								)
							</div>
							<div className="p-4">
								<h3 className="line-clamp-2 text-lg font-medium text-white">
									{course.title}
								</h3>
								{course.description && (
									<p className="mt-1 line-clamp-2 text-sm text-gray-400">
										{course.description}
									</p>
								)}
								<div className="mt-2 flex items-center justify-between">
									<span className="text-sm text-gray-400">
										{Array.isArray(course.students)
											? course.students.length
											: 0}{' '}
										estudiantes
									</span>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
			<div className="flex justify-center pt-4">
				<Button
					onClick={onClose}
					className="bg-red-500 px-8 text-white transition-colors duration-200 hover:bg-red-600"
				>
					Cerrar
				</Button>
			</div>
		</div>
	);
}
