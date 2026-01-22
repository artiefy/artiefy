import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import {
  Card,
  CardContent,
  CardHeader,
} from '~/components/estudiantes/ui/card';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function ProgramDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
        <Card className="overflow-hidden p-0">
          <CardHeader className="px-0">
            <AspectRatio ratio={16 / 6}>
              <Skeleton className="h-full w-full" />
            </AspectRatio>
          </CardHeader>

          <CardContent className="mx-6 space-y-4">
            {/* Program metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex items-center space-x-6">
                <Skeleton className="h-6 w-32" />
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={`star-skeleton-${i}`} className="h-5 w-5" />
                  ))}
                </div>
              </div>
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
