'use client';

import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';

export default function LoadingTestPage() {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<div className="flex-1">
				<CourseDetailsSkeleton />
			</div>
			<Footer />
		</div>
	);
}
