'use client'; // Esto asegura que el código se ejecute en el cliente

import { useEffect } from 'react';
import { useProgress } from '@bprogress/next';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '~/components/estudiantes/ui/pagination';
import usePageTimeTracker from '~/hooks/usePageTimeTracker'; // Asegúrate de que la ruta sea correcta

interface Props {
	totalPages: number;
	currentPage: number;
	totalCourses: number;
	route?: string;
	category?: string;
	searchTerm?: string;
	userId: string | null | undefined; // Añadimos userId como prop
}

const PaginationContainer = ({
	totalPages,
	currentPage,
	totalCourses,
	route = '/estudiantes',
	category,
	searchTerm,
	userId, // Recibimos userId como prop
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { start, stop } = useProgress();

  useEffect(() => {
    stop();
  }, [searchParams, stop]);

	useEffect(() => {
		NProgress.done();
	}, [searchParams]);

  const handlePageChange = (page: number) => {
    start();
    const params = new URLSearchParams(searchParams.toString());

		NProgress.start();
		const params = new URLSearchParams(searchParams?.toString());

			params.set('page', page.toString());
		}

		if (category) params.set('category', category);
		if (searchTerm) params.set('searchTerm', searchTerm);

		const queryString = params.toString();
		const newUrl =
			page === 1 && !category && !searchTerm
				? route
				: `${route}?${queryString}`;

		router.push(newUrl, { scroll: false });
	};

	const startItem = (currentPage - 1) * 9 + 1;
	const endItem = Math.min(currentPage * 9, totalCourses);

	return (
		<div className="flex flex-col items-center justify-between space-y-4 py-8">
			<p className="text-sm text-gray-600">
				Mostrando {startItem}-{endItem} de {totalCourses} cursos
			</p>
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							onClick={() => handlePageChange(currentPage - 1)}
							className={`cursor-pointer active:scale-95 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
						/>
					</PaginationItem>
					{Array.from({ length: totalPages }).map((_, index) => {
						const pageNumber = index + 1;
						if (
							pageNumber === 1 ||
							pageNumber === totalPages ||
							(pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
						) {
							return (
								<PaginationItem key={pageNumber}>
									<PaginationLink
										onClick={() => handlePageChange(pageNumber)}
										isActive={currentPage === pageNumber}
										className="cursor-pointer active:scale-95"
									>
										{pageNumber}
									</PaginationLink>
								</PaginationItem>
							);
						} else if (
							(pageNumber === currentPage - 2 && currentPage > 3) ||
							(pageNumber === currentPage + 2 && currentPage < totalPages - 2)
						) {
							return <PaginationEllipsis key={pageNumber} />;
						}
						return null;
					})}
					<PaginationItem>
						<PaginationNext
							onClick={() => handlePageChange(currentPage + 1)}
							className={`cursor-pointer active:scale-95 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
};

export default PaginationContainer;