import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function LessonSkeleton() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<div className="flex flex-1 px-4 py-6">
				{/* Left Sidebar Skeleton */}
				<div className="w-80 bg-background p-4 shadow-lg">
					<Skeleton className="mb-4 h-8 w-40" />
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-24 w-full rounded-lg" />
						))}
					</div>
				</div>

				{/* Main Content Skeleton */}
				<div className="flex-1 p-6">
					<div className="navigation-buttons mb-4">
						<div className="flex justify-between">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-24" />
						</div>
					</div>
					<Skeleton className="mb-8 h-[400px] w-full rounded-lg" />
					<div className="space-y-4">
						<Skeleton className="h-12 w-1/3" />
						<Skeleton className="h-24 w-full" />
					</div>
				</div>

				{/* Right Sidebar Skeleton */}
				<div className="w-72 space-y-6">
					<div className="bg-background p-4 shadow-lg">
						<Skeleton className="mb-4 h-8 w-32" />
						<Skeleton className="h-[200px] w-full rounded-lg" />
					</div>
					<div className="bg-background p-4 shadow-lg">
						<Skeleton className="mb-4 h-8 w-32" />
						<Skeleton className="h-[150px] w-full rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
}
