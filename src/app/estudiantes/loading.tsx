import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export default function loading() {
	return (
		<div className="flex flex-col space-y-12 sm:space-y-16">
			{/* Skeleton for StudentDashboard */}
			<div className="flex flex-col items-center space-y-4 p-18">
				<Skeleton className="h-10 w-1/2" />
				<Skeleton className="h-10 w-full max-w-lg" />
				<Skeleton className="relative h-[300px] w-full rounded-lg sm:h-[400px] md:h-[500px]" />
			</div>

			{/* Skeleton for Top Courses */}
			<div className="xs:px-4 relative mx-22">
				<Skeleton className="mb-4 ml-4 h-8 w-32" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-48 w-full md:h-64" />
					))}
				</div>
			</div>

			{/* Skeleton for CourseCategories */}
			<section className="mt-16 px-8 sm:px-12 md:px-10 lg:px-20">
				<div className="container mx-auto">
					<div className="mb-8 flex flex-col items-center justify-between lg:flex-row">
						<Skeleton className="h-10 w-full sm:w-3/4 md:w-1/3 lg:w-1/3" />
						<Skeleton className="h-10 w-full lg:ml-auto lg:w-1/3" />
					</div>
					<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton
								key={i}
								className="aspect-square h-36 w-full sm:h-48 lg:h-56"
							/>
						))}
					</div>
				</div>
			</section>

			{/* Skeleton for CourseListStudent */}
			<div className="my-8 grid grid-cols-1 gap-6 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-20">
				{Array.from({ length: 9 }).map((_, i) => (
					<div key={i} className="group relative p-4">
						<Skeleton className="relative h-40 w-full md:h-56" />
						<div className="mt-3 flex flex-col space-y-2">
							<Skeleton className="h-6 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
