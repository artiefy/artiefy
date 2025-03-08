import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function CourseDetailsSkeleton() {
	return (
		<div className="min-h-screen">
			<div className="mx-auto max-w-7xl">
				<main className="flex-1">
					<div className="container mx-auto max-w-7xl">
						{/* Breadcrumb Skeleton */}
						<div className="flex items-center gap-2 py-4">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-32" />
						</div>

						{/* Course Header Card Skeleton */}
						<div className="overflow-hidden rounded-lg bg-white shadow-sm">
							{/* Course Cover Image */}
							<AspectRatio ratio={16 / 6}>
								<Skeleton className="h-full w-full bg-gray-300" />
								<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6" />
							</AspectRatio>

							<div className="space-y-6 p-6">
								{/* Instructor and Stats Row */}
								<div className="flex justify-between">
									<div className="space-y-2">
										<Skeleton className="h-6 w-48 bg-gray-300" />{' '}
										{/* Instructor Name */}
										<Skeleton className="h-4 w-24 bg-gray-300" />{' '}
										{/* "Educador" text */}
									</div>
									<div className="flex items-center space-x-6">
										<div className="flex items-center space-x-2">
											<Skeleton className="h-5 w-5 bg-gray-300" />{' '}
											{/* Student Icon */}
											<Skeleton className="h-4 w-24 bg-gray-300" />{' '}
											{/* Student Count */}
										</div>
										<div className="flex space-x-1">
											{Array.from({ length: 5 }).map((_, i) => (
												<Skeleton
													key={i}
													className="h-5 w-5 bg-gray-300"
												/> /* Rating Stars */
											))}
											<Skeleton className="ml-2 h-4 w-10 bg-gray-300" />{' '}
											{/* Rating Number */}
										</div>
									</div>
								</div>

								{/* Course Metadata Row */}
								<div className="flex items-center justify-between">
									<div className="flex space-x-4">
										<Skeleton className="h-8 w-24 bg-gray-300" />{' '}
										{/* Category Badge */}
										<Skeleton className="h-8 w-32 bg-gray-300" />{' '}
										{/* Creation Date */}
										<Skeleton className="h-8 w-32 bg-gray-300" />{' '}
										{/* Last Update */}
									</div>
									<Skeleton className="h-8 w-24 bg-gray-300" />{' '}
									{/* Modalidad Badge */}
								</div>

								{/* Course Description */}
								<div className="space-y-2">
									<Skeleton className="h-4 w-full bg-gray-300" />
									<Skeleton className="h-4 w-[90%] bg-gray-300" />
									<Skeleton className="h-4 w-[80%] bg-gray-300" />
								</div>

								{/* Course Content Section */}
								<div className="rounded-lg border p-6">
									<Skeleton className="mb-4 h-6 w-48 bg-gray-300" />{' '}
									{/* "Contenido del curso" */}
									<div className="space-y-4">
										{/* 4 Lecciones de ejemplo */}
										{[1, 2, 3, 4].map((i) => (
											<div key={i} className="rounded-lg border bg-gray-50 p-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-2">
														<Skeleton className="h-5 w-5 bg-gray-300" />{' '}
														{/* Lesson Icon */}
														<Skeleton className="h-5 w-64 bg-gray-300" />{' '}
														{/* Lesson Title */}
													</div>
													<Skeleton className="h-5 w-20 bg-gray-300" />{' '}
													{/* Duration */}
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Enrollment Button */}
								<div className="flex justify-center">
									<Skeleton className="h-12 w-64 bg-gray-300" />
								</div>
							</div>
						</div>

						{/* Comments Section */}
						<div className="mt-8 mb-12 space-y-4">
							<Skeleton className="h-8 w-48 bg-gray-300" />{' '}
							{/* "Comentarios" Title */}
							<div className="space-y-6">
								{/* 4 Comment Skeletons */}
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="rounded-lg border bg-gray-50 p-4">
										<div className="mb-2 flex items-center justify-between">
											<div className="flex items-center space-x-1">
												{Array.from({ length: 5 }).map((_, j) => (
													<Skeleton
														key={j}
														className="h-4 w-4 bg-gray-300"
													/> /* Rating Stars */
												))}
												<Skeleton className="ml-2 h-4 w-32 bg-gray-300" />{' '}
												{/* Date */}
											</div>
											<div className="flex space-x-2">
												<Skeleton className="h-6 w-6 bg-gray-300" />{' '}
												{/* Like Icon */}
												<Skeleton className="h-6 w-6 bg-gray-300" />{' '}
												{/* Action Icons */}
											</div>
										</div>
										<Skeleton className="mb-2 h-4 w-full bg-gray-300" />{' '}
										{/* Comment Content */}
										<Skeleton className="h-4 w-32 bg-gray-300" />{' '}
										{/* Username */}
									</div>
								))}
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
