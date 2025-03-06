import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Componentes internos reutilizables
const CardSkeleton = () => <Skeleton className="h-24 w-full rounded-lg" />;

const SidebarContentSkeleton = () => (
	<div className="space-y-4">
		<Skeleton className="mb-4 h-8 w-40" />
		{Array.from({ length: 5 }).map((_, i) => (
			<CardSkeleton key={i} />
		))}
	</div>
);

// Nuevo componente para recursos
const ResourcesSkeleton = () => (
	<div className="mt-4 bg-background p-4 shadow-lg">
		<Skeleton className="mb-4 h-8 w-32" />
		<div className="space-y-2">
			{Array.from({ length: 3 }).map((_, i) => (
				<Skeleton key={i} className="h-10 w-full rounded-lg" />
			))}
		</div>
	</div>
);

export function LessonSkeleton() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<div className="flex flex-1 px-4 py-6">
				{/* Left Sidebar */}
				<div className="w-80 bg-background p-4 shadow-lg">
					<SidebarContentSkeleton />
				</div>

				{/* Main Content */}
				<div className="flex-1 p-6">
					<div className="mb-4 flex justify-between">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
					<Skeleton className="mb-8 h-[400px] w-full rounded-lg" />
					<Skeleton className="h-12 w-1/3" />
				</div>

				{/* Right Sidebar */}
				<div className="w-72 space-y-6">
					{/* Activity Skeleton */}
					<div className="bg-background p-4 shadow-lg">
						<Skeleton className="mb-4 h-8 w-32" />
						<Skeleton className="h-[200px] w-full rounded-lg" />
					</div>
					{/* Resources Skeleton */}
					<ResourcesSkeleton />
				</div>
			</div>
		</div>
	);
}
