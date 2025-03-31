'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProgress } from '@bprogress/next';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/estudiantes/ui/pagination';

interface PaginationContainerProps {
  totalPages: number;
  currentPage: number;
  totalCourses: number;
  route?: string;
  category?: string;
  searchTerm?: string;
  itemsPerPage?: number;
}

const PaginationContainer = ({
  totalPages,
  currentPage,
  totalCourses,
  route = '/estudiantes',
  category,
  searchTerm,
  itemsPerPage = 9,
}: PaginationContainerProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { start, stop } = useProgress();

  useEffect(() => {
    stop();
  }, [searchParams, stop]);

  const buildUrl = useCallback((page: number): string => {
    const params = new URLSearchParams();

<<<<<<< HEAD
    // Only add page parameter if not page 1
    if (page !== 1) {
      params.append('page', page.toString());
    }
=======
	const handlePageChange = (page: number) => {
		start();
		const params = new URLSearchParams(searchParams?.toString() ?? '');
>>>>>>> dev/miguel

    // Add optional parameters if present
    if (category) params.append('category', category);
    if (searchTerm) params.append('searchTerm', searchTerm);

    const queryString = params.toString();
    return queryString ? `${route}?${queryString}` : route;
  }, [category, route, searchTerm]);

  const handlePageChange = useCallback((page: number) => {
    start();
    const newUrl = buildUrl(page);
    router.push(newUrl, { scroll: false });
  }, [buildUrl, router, start]);

  // Calculate pagination range
  const { startItem, endItem } = useMemo(() => ({
    startItem: (currentPage - 1) * itemsPerPage + 1,
    endItem: Math.min(currentPage * itemsPerPage, totalCourses),
  }), [currentPage, itemsPerPage, totalCourses]);

  if (totalPages <= 1) return null;

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
              className={`cursor-pointer active:scale-95 ${
                currentPage === 1 ? 'pointer-events-none opacity-50' : ''
              }`}
              aria-disabled={currentPage === 1}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const isVisible = 
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

            const showEllipsis = 
              (pageNumber === currentPage - 2 && currentPage > 3) ||
              (pageNumber === currentPage + 2 && currentPage < totalPages - 2);

            if (isVisible) {
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
            }

            if (showEllipsis) {
              return <PaginationEllipsis key={pageNumber} />;
            }

            return null;
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={`cursor-pointer active:scale-95 ${
                currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
              }`}
              aria-disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationContainer;
