import { Suspense } from 'react';

import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import MyCoursesStudent, {
	CourseCardSkeleton,
} from '~/components/estudiantes/layout/MyCoursesStudent';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MisCoursesPage() {
	const courses = await getEnrolledCourses();
	const completedCourses = courses.filter((course) => course.progress === 100);
	const inProgressCourses = courses.filter((course) => course.progress < 100);

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
									<div className="mb-8">
										<Skeleton className="mb-8 h-10 w-72" />
										<div className="mb-8 rounded-lg bg-gray-800 p-6">
											<div className="flex items-center gap-4">
												<Skeleton className="h-16 w-16 rounded-full" />
												<div className="space-y-2">
													<Skeleton className="h-6 w-48" />
													<Skeleton className="h-4 w-64" />
												</div>
											</div>
										</div>
									</div>

									{/* My Learning Progress Section Skeleton */}
									<section className="mb-12">
										<Skeleton className="mb-6 h-8 w-64" />
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											{inProgressCourses.map((_, i) => (
												<CourseCardSkeleton key={`progress-${i}`} />
											))}
										</div>
									</section>

									{/* Completed Courses Section Skeleton */}
									<section>
										<Skeleton className="mb-6 h-8 w-64" />
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											{completedCourses.map((_, i) => (
												<CourseCardSkeleton key={`completed-${i}`} />
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
