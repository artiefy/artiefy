import { Suspense } from 'react';

import Script from 'next/script';

import StudentDetails from '~/app/estudiantes/StudentDetails';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import StudentCategories from '~/components/estudiantes/layout/studentdashboard/StudentCategories';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import StudentListCourses from '~/components/estudiantes/layout/studentdashboard/StudentListCourses';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { getAllCategories } from '~/server/actions/estudiantes/categories/getAllCategories';
import { getFeaturedCategories } from '~/server/actions/estudiantes/categories/getFeaturedCategories';
import { getAllCourses } from '~/server/actions/estudiantes/courses/getAllCourses';
import { getAllPrograms } from '~/server/actions/estudiantes/programs/getAllPrograms';

import type { Metadata } from 'next';
import type { Category, Course, Program } from '~/types';

export const metadata: Metadata = {
	title: 'Artiefy - Plataforma Educativa Digital Líder',
	description: 'Accede a tus cursos y contenido educativo en Artiefy',
};

interface SearchParams {
	category?: string;
	query?: string;
	page?: string;
}

interface APIResponse {
	courses: Course[];
	programs: Program[];
	categories: Category[];
	featuredCategories: Category[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
	categoryId?: number;
	searchTerm?: string;
}

const ITEMS_PER_PAGE = 9;

// Add this helper function before the fetchData function
function removeAccents(str: string): string {
	return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function fetchData(
	params: SearchParams | undefined
): Promise<APIResponse> {
	const [allCourses, allCategories, featuredCategories, allPrograms] =
		await Promise.all([
			getAllCourses(),
			getAllCategories(),
			getFeaturedCategories(6),
			getAllPrograms(),
		]);

	let filteredCourses = allCourses;

	if (params?.category) {
		const categoryId = Number(params.category);
		filteredCourses = filteredCourses.filter(
			(course) => course.categoryid === categoryId
		);
	}

	if (params?.query) {
		const normalizedQuery = removeAccents(params.query.toLowerCase());
		filteredCourses = filteredCourses.filter((course) => {
			const normalizedTitle = removeAccents(course.title.toLowerCase());
			const normalizedCategory = course.category?.name
				? removeAccents(course.category.name.toLowerCase())
				: '';
			const normalizedModalidad = course.modalidad?.name
				? removeAccents(course.modalidad.name.toLowerCase())
				: '';

			// Solo buscar en título, categoría y modalidad
			return (
				normalizedTitle.includes(normalizedQuery) ||
				normalizedCategory.includes(normalizedQuery) ||
				normalizedModalidad.includes(normalizedQuery)
			);
		});
	}

	const totalFilteredCourses = filteredCourses.length;
	const totalPages = Math.ceil(totalFilteredCourses / ITEMS_PER_PAGE);
	const page = Number(params?.page ?? '1');
	const paginatedCourses = filteredCourses.slice(
		(page - 1) * ITEMS_PER_PAGE,
		page * ITEMS_PER_PAGE
	);

	return {
		courses: paginatedCourses,
		programs: allPrograms, // Ensure programs are included
		categories: allCategories,
		featuredCategories,
		total: totalFilteredCourses,
		page,
		pageSize: ITEMS_PER_PAGE,
		totalPages,
		categoryId: params?.category ? Number(params.category) : undefined,
		searchTerm: params?.query,
	};
}

async function fetchAllCourses(): Promise<Course[]> {
	return await getAllCourses();
}

interface PageProps {
	searchParams: SearchParams; // Cambiado de Promise<SearchParams> a SearchParams
}

export default async function Page({ searchParams }: PageProps) {
	try {
		const parsedParams: SearchParams = {
			category: searchParams?.category,
			query: searchParams?.query,
			page: searchParams?.page,
		};

		const data = await fetchData(parsedParams);
		const allCourses = await fetchAllCourses();

		return (
			<>
				<Script id="learning-platform-schema" type="application/ld+json">
					{JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'WebPage',
						name: 'Artiefy - Plataforma Educativa Digital Líder',
						description: 'Accede a tus cursos y contenido educativo en Artiefy',
						url: 'https://artiefy.com/estudiantes',
						isPartOf: {
							'@type': 'WebSite',
							'@id': 'https://artiefy.com/#website',
						},
					})}
				</Script>

				<div
					className="flex min-h-screen flex-col"
					style={{ isolation: 'isolate', zIndex: 1 }}
				>
					<Header />
					<StudentDetails
						initialCourses={allCourses}
						initialPrograms={data.programs}
					/>
					<StudentCategories
						allCategories={data.categories}
						featuredCategories={data.featuredCategories}
					/>
					<Suspense
						fallback={
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
						}
					>
						<StudentListCourses
							courses={data.courses}
							currentPage={data.page}
							totalPages={data.totalPages}
							totalCourses={data.total}
							category={data.categoryId?.toString()}
							searchTerm={data.searchTerm}
						/>
					</Suspense>
					<Footer />
				</div>
				{/* Chat container con z-index más alto */}
				<div className="chat-container-wrapper">
					<StudentChatbot
						isAlwaysVisible={true}
						showChat={false} // Set default value to false
						className="animation-delay-400 animate-zoom-in"
						initialSearchQuery=""
					/>
				</div>
			</>
		);
	} catch (error) {
		console.error('Error al cargar los cursos:', error);
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 text-xl font-bold">Error al cargar los Cursos</h2>
					<p>Por favor, intenta de nuevo más tarde.</p>
				</div>
			</div>
		);
	}
}
