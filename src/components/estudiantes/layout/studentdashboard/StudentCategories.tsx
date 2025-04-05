'use client';

import { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { FiCode } from 'react-icons/fi';
import useSWR from 'swr';

import { Icons } from '~/components/estudiantes/ui/icons';
import { Input } from '~/components/estudiantes/ui/input';
import {
	saveScrollPosition,
	restoreScrollPosition,
} from '~/utils/scrollPosition';

import type { Category } from '~/types';

interface CourseCategoriesProps {
	allCategories: Category[];
	featuredCategories: Category[];
}

interface CategoriesData {
	allCategories: Category[];
	featuredCategories: Category[];
}

export default function StudentCategories({
	allCategories,
	featuredCategories,
}: CourseCategoriesProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { start, stop } = useProgress();
	const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [searchQuery, setSearchQuery] = useState(
		searchParams?.get('query') ?? ''
	);

	// Usar SWR para el fetching y caching de datos
	const { data: categoriesData } = useSWR<CategoriesData>('/api/categories', {
		fallbackData: { allCategories, featuredCategories },
		revalidateOnFocus: false, // Solo revalidar cuando sea necesario
		revalidateOnReconnect: false,
	});

	const handleCategorySelect = (category: string | null) => {
		saveScrollPosition();
		start();
		setLoadingCategory(category ?? 'all');
		const params = new URLSearchParams();
		if (category) {
			params.set('category', category);
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	const handleSearch = useCallback(() => {
		saveScrollPosition();
		const params = new URLSearchParams();
		if (searchQuery) {
			params.set('query', searchQuery);
		}
		start();
		setIsSearching(true);
		router.push(`${pathname}?${params.toString()}`);
	}, [searchQuery, pathname, router, start]);

	useEffect(() => {
		setLoadingCategory(null);
		setIsSearching(false);
		stop();
		restoreScrollPosition();
	}, [searchParams, stop]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSearch();
		}
	};

	return (
		<section className="mt-16 px-8 sm:px-12 md:px-10 lg:px-20">
			<div className="container mx-auto">
				<div className="mb-8 flex flex-col items-center justify-between lg:flex-row">
					<div className="relative mb-4 w-full sm:w-3/4 md:w-1/3 lg:mb-0 lg:w-1/3">
						<FunnelIcon className="absolute top-1/2 left-3 size-5 -translate-y-1/2 fill-gray-500" />
						<select
							className="focus:border-primary focus:ring-primary block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900"
							onChange={(e) => handleCategorySelect(e.target.value || null)}
							value={searchParams?.get('category') ?? ''}
							aria-label="Seleccionar categoría"
						>
							<option value="">Todas las categorías</option>
							{categoriesData?.allCategories?.map((category) => (
								<option key={category.id} value={category.id.toString()}>
									{category.name}
								</option>
							))}
						</select>
					</div>
					<div className="w-full lg:ml-auto lg:w-1/3">
						<div className="relative w-full max-w-lg">
							<Input
								type="search"
								placeholder="Buscar cursos..."
								value={searchQuery}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setSearchQuery(e.target.value)
								}
								onKeyDown={handleKeyDown}
								className="text-background w-full bg-white pr-10"
								aria-label="Buscar cursos"
							/>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								{isSearching ? (
									<Icons.spinner
										className="text-background size-4"
										aria-hidden="true"
									/>
								) : (
									<MagnifyingGlassIcon
										className="size-4 fill-gray-400"
										aria-hidden="true"
									/>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
					<div
						className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-center transition-transform hover:scale-105 hover:shadow-lg active:scale-95 ${
							loadingCategory === 'all' ? 'pr-6' : ''
						}`}
						onClick={() => handleCategorySelect(null)}
						role="button"
						tabIndex={0}
						aria-label="Mostrar todos los cursos"
					>
						<div className="flex h-full flex-col items-center justify-center">
							{loadingCategory === 'all' ? (
								<>
									<Icons.spinner
										className="text-background size-10"
										aria-hidden="true"
									/>
									<p className="text-background mt-2 text-sm">
										Buscando Cursos...
									</p>
								</>
							) : (
								<>
									<div className="mb-4 text-3xl text-blue-600">
										<FiCode className="size-8" aria-hidden="true" />
									</div>
									<h3 className="text-background text-lg font-semibold sm:text-base md:text-lg lg:text-xl">
										Todos los cursos
									</h3>
								</>
							)}
						</div>
					</div>
					{/* Solo mostrar categorías que tengan is_featured en true */}
					{categoriesData?.featuredCategories
						?.filter((category) => category.is_featured)
						.map((category: Category, index: number) => (
							<div
								key={category.id}
								className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-center transition-transform hover:scale-105 hover:shadow-lg active:scale-95"
								onClick={() => handleCategorySelect(category.id.toString())}
								role="button"
								tabIndex={0}
								aria-label={`Mostrar cursos de ${category.name}`}
							>
								<div className="flex h-full flex-col items-center justify-center">
									{loadingCategory === category.id.toString() ? (
										<>
											<Icons.spinner
												className="text-background size-10"
												aria-hidden="true"
											/>
											<p className="text-background mt-2 text-sm">
												Buscando Cursos...
											</p>
										</>
									) : (
										<>
											<div className="mb-4 text-3xl text-blue-600">
												<Image
													src={`/icons/${
														index === 0
															? 'circuit'
															: index === 1
																? 'list'
																: index === 2
																	? 'brush'
																	: index === 3
																		? 'web-dev'
																		: index === 4
																			? 'database'
																			: 'code'
													}.png`}
													alt={category.name}
													width={48}
													height={48}
													className="size-12"
												/>
											</div>
											<h3 className="text-background text-lg font-semibold sm:text-base md:text-lg lg:text-xl">
												{category.name}
											</h3>
											<p className="mt-2 text-sm text-gray-500">
												{`${category.courses?.length ?? 0} curso${
													category.courses?.length !== 1 ? 's' : ''
												}`}
											</p>
										</>
									)}
								</div>
							</div>
						))}
				</div>
			</div>
		</section>
	);
}
