import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Course {
	id: string;
	title: string;
	coverImageKey: string | null;
}

interface Props {
	courses: Course[];
	userId: string;
}

export default function CourseCarousel({ courses, userId }: Props) {
	const [emblaRef, emblaApi] = useEmblaCarousel({
		loop: false,
		align: 'start',
	});
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);
	const router = useRouter();

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;
		emblaApi.on('select', onSelect);
		onSelect();
	}, [emblaApi, onSelect]);

	return (
		<div className="relative w-full">
			<div className="overflow-hidden" ref={emblaRef}>
				<div className="flex space-x-4">
					{courses.map((course) => (
						<div
							key={course.id}
							className="relative w-64 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800 shadow-md"
						>
							{/* Imagen */}
							{course.coverImageKey ? (
								<Image
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
									alt={course.title}
									width={256}
									height={144}
									className="h-28 w-full object-cover"
								/>
							) : (
								<div className="flex h-28 w-full items-center justify-center bg-gray-700">
									Sin imagen
								</div>
							)}
							{/* Información */}
							<div className="p-3 text-white">
								<h2 className="text-sm font-semibold">{course.title}</h2>
								<button
									onClick={() =>
										router.push(
											`/dashboard/super-admin/stats/${course.id}?user=${userId}`
										)
									}
									className="mt-2 w-full rounded bg-blue-500 px-3 py-2 text-sm font-bold text-white hover:bg-blue-600"
								>
									Ver
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Botones de navegación */}
			{courses.length > 3 && (
				<>
					<button
						className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-gray-900 p-2 text-white shadow-md hover:bg-gray-700"
						onClick={() => emblaApi?.scrollPrev()}
						disabled={!canScrollPrev}
					>
						<ChevronLeft size={24} />
					</button>

					<button
						className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full bg-gray-900 p-2 text-white shadow-md hover:bg-gray-700"
						onClick={() => emblaApi?.scrollNext()}
						disabled={!canScrollNext}
					>
						<ChevronRight size={24} />
					</button>
				</>
			)}
		</div>
	);
}
