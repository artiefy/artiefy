import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Componentes internos reutilizables
const CardSkeleton = () => <Skeleton className="h-32 w-full rounded-lg" />;

const SidebarContentSkeleton = () => (
	<div className="space-y-4">
		<Skeleton className="mb-4 h-8 w-40" />
		{Array.from({ length: 4 }).map((_, i) => (
			<CardSkeleton key={i} />
		))}
	</div>
);

const MainContentSkeleton = () => (
	<div className="flex-1 px-6">
		<div className="mb-4 flex justify-between">
			<Skeleton className="h-10 w-24" />
			<Skeleton className="h-10 w-24" />
		</div>
		{/* Single video placeholder */}
		<Skeleton className="mb-4 h-[500px] w-full rounded-lg" />
		{/* Progress and description area */}
		<Skeleton className="h-[200px] w-full rounded-lg" />
	</div>
);

const RightSidebarSkeleton = () => (
	<div className="w-72 space-y-6 px-4">
		{/* Activities Section */}
		<div className="rounded-lg bg-background px-4 shadow-lg">
			<Skeleton className="mb-4 h-8 w-32" />
			<Skeleton className="h-[200px] w-full rounded-lg" />
		</div>

		{/* Grades Section */}
		<div className="rounded-lg bg-background px-4 shadow-lg">
			<Skeleton className="mb-4 h-8 w-32" />
			<Skeleton className="h-[150px] w-full rounded-lg" />
		</div>

		{/* Resources Section */}
		<div className="rounded-lg bg-background px-4 shadow-lg">
			<Skeleton className="mb-4 h-8 w-32" />
			<Skeleton className="h-[100px] w-full rounded-lg" />
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
				<MainContentSkeleton />

				{/* Right Sidebar */}
				<RightSidebarSkeleton />
			</div>
		</div>
	);
}
