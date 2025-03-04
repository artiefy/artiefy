import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function QuestionSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-6 w-3/4" />
			<div className="space-y-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex items-center space-x-2">
						<Skeleton className="h-4 w-4 rounded-full" />
						<Skeleton className="h-4 w-full" />
					</div>
				))}
			</div>
		</div>
	);
}
