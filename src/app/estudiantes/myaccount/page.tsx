import { Suspense } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import MyCoursesStudent, {
	CourseCardSkeleton,
} from '~/components/estudiantes/layout/MyCoursesStudent';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MisCoursesPage() {
	return (
		<>
			<SignedIn>
				<div className="flex min-h-screen flex-col">
					<Header />
					<main className="flex-1">
						<Suspense
							fallback={
								<div className="container mx-auto px-4">
									{/* Profile Skeleton */}
									<div className="mb-8 rounded-lg bg-gray-800 p-6">
										<div className="flex items-center gap-4">
											<Skeleton className="h-16 w-16 rounded-full" />
											<div className="space-y-2">
												<Skeleton className="h-6 w-48" />
												<Skeleton className="h-4 w-64" />
											</div>
										</div>
									</div>

									{/* Courses List Skeleton */}
									<section>
										<Skeleton className="mb-6 h-8 w-64" />
										<div className="space-y-4">
											{[1, 2, 3].map((i) => (
												<CourseCardSkeleton key={i} />
											))}
										</div>
									</section>
								</div>
							}
						>
							<MyCoursesStudent />
						</Suspense>
					</main>
					<Footer />
				</div>
			</SignedIn>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
		</>
	);
}
