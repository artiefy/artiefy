import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function LoadingCourses() {
	return (
		<div className="space-y-12 p-16 sm:space-y-16">
			{/* Skeleton para el buscador IA */}
			<div className="flex justify-center">
				<Skeleton className="h-10 w-full max-w-lg" />
			</div>

			{/* Skeleton para el carousel grande */}
			<div className="relative h-[300px] sm:h-[400px] md:h-[500px]">
				<Skeleton className="size-full" />
				<div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
					{Array.from({ length: 5 }).map((_, index) => (
						<Skeleton key={index} className="size-3 rounded-full" />
					))}
				</div>
			</div>

			{/* Skeleton para el carousel de top cursos */}
			<div className="space-y-4">
				<Skeleton className="ml-4 h-8 w-32" />
				<div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-48 w-full md:h-64" />
					))}
				</div>
			</div>

			{/* Skeleton para las categorías */}
			<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="aspect-square h-36 w-full" />
				))}
			</div>

			{/* Skeleton para la lista de cursos */}
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 9 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-48 w-full" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					))}
				</div>
			</div>

			{/* Skeleton para la paginación */}
			<div className="flex justify-center pb-12">
				<Skeleton className="h-10 w-64" />
			</div>
		</div>
	);
}
