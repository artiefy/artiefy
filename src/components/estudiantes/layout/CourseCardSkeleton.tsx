import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function CourseCardSkeleton() {
	return (
		<Card className="overflow-hidden bg-gray-800 py-0 text-white">
			<div className="flex h-32">
				<div className="w-48">
					<Skeleton className="h-full w-full" />
				</div>
				<CardContent className="flex w-full flex-col justify-between px-4 py-3">
					<div>
						<Skeleton className="h-6 w-3/4" />
						<Skeleton className="mt-2 h-4 w-1/2" />
					</div>
					<div className="flex items-center gap-4">
						<div className="flex-1">
							<div className="mb-1 flex items-center justify-between">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-4 w-16" />
							</div>
							<Skeleton className="h-2 w-full" />
						</div>
						<Skeleton className="h-9 w-28" />
					</div>
				</CardContent>
			</div>
		</Card>
	);
}
