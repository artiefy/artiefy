import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function CourseDetailsSkeleton() {
	return (
		<div className="min-h-screen">
			<main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
				{/* Breadcrumb Skeleton */}
				<div className="mb-4 flex items-center gap-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-4" />
					<Skeleton className="h-4 w-32" />
				</div>

				{/* Course Header Skeleton */}
				<div className="overflow-hidden rounded-lg shadow-sm">
					<AspectRatio ratio={16 / 6}>
						<Skeleton className="h-full w-full" />
						<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
							<Skeleton className="h-8 w-2/3" />
						</div>
					</AspectRatio>
					<div className="space-y-6 p-6">
						{/* Instructor and Stats */}
						<div className="flex justify-between">
							<div className="space-y-2">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="flex items-center space-x-4">
								<Skeleton className="h-6 w-32" />
								<div className="flex space-x-1">
									{Array.from({ length: 5 }).map((_, i) => (
										<Skeleton key={i} className="h-5 w-5" />
									))}
								</div>
							</div>
						</div>

						{/* Course Metadata */}
						<div className="flex items-center justify-between">
							<div className="flex space-x-4">
								<Skeleton className="h-6 w-24" />
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-6 w-32" />
							</div>
							<Skeleton className="h-6 w-24" />
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-[90%]" />
							<Skeleton className="h-4 w-[80%]" />
						</div>
					</div>
				</div>

				{/* Course Content Skeleton */}
				<div className="mt-8 space-y-4">
					<Skeleton className="h-8 w-48" />
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="rounded-lg p-4 shadow-sm">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Skeleton className="h-6 w-6" />
									<Skeleton className="h-6 w-48" />
								</div>
								<Skeleton className="h-6 w-24" />
							</div>
						</div>
					))}
				</div>

				{/* Comments Section Skeleton */}
				<div className="mt-8 space-y-4">
					<Skeleton className="h-8 w-40" />
					{Array.from({ length: 2 }).map((_, i) => (
						<div key={i} className="rounded-lg p-4 shadow-sm">
							<div className="flex gap-4">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-full" />
								</div>
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
