'use client';

import { useState, useEffect } from 'react';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import NProgress from 'nprogress';
import {
	FiBarChart,
	FiCamera,
	FiCode,
	FiDatabase,
	FiMusic,
	FiPenTool,
} from 'react-icons/fi';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import type { Category } from '~/types';
import {
	saveScrollPosition,
	restoreScrollPosition,
} from '~/utils/scrollPosition';
import 'nprogress/nprogress.css';

interface CourseCategoriesProps {
	allCategories: Category[];
	featuredCategories: Category[];
}

const categoryIcons: Record<string, React.ReactNode> = {
	Programacion: <FiCode />,
	Diseño: <FiPenTool />,
	Marketing: <FiBarChart />,
	Fotografia: <FiCamera />,
	Musica: <FiMusic />,
	'Ciencia De Datos': <FiDatabase />,
};

export default function CourseCategories({
	allCategories,
	featuredCategories,
}: CourseCategoriesProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const handleCategorySelect = (category: string | null) => {
		saveScrollPosition();
		NProgress.start();
		setLoadingCategory(category ?? 'all');
		const params = new URLSearchParams();
		if (category) {
			params.set('category', category);
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000);

		setLoadingCategory(null);
		NProgress.done();
		restoreScrollPosition();

		return () => clearTimeout(timer);
	}, [searchParams]);

	return (
		<section className="py-4 px-20">
			<div className="container mx-auto">
				<div className="mb-8 flex items-center justify-between">
					<div className="relative w-full sm:w-3/4 md:w-1/3 lg:w-1/3">
						<FunnelIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
						<select
							className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-2 px-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
							onChange={(e) => handleCategorySelect(e.target.value || null)}
							value={searchParams.get('category') ?? ''}
							aria-label="Seleccionar categoría"
						>
							<option value="">Todas las categorías</option>
							{allCategories?.map((category) => (
								<option key={category.id} value={category.id.toString()}>
									{category.name}
								</option>
							))}
						</select>
					</div>
				</div>
				{isLoading ? (
					<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="aspect-square h-36 w-full" />
						))}
					</div>
				) : (
					<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
						<div
							className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-center transition-transform hover:scale-105 hover:shadow-lg active:scale-95"
							onClick={() => handleCategorySelect(null)}
							role="button"
							tabIndex={0}
							aria-label="Mostrar todos los cursos"
						>
							{loadingCategory === 'all' ? (
								<div className="flex h-full flex-col items-center justify-center">
									<Icons.spinner
										className="size-10 text-background"
										aria-hidden="true"
									/>
									<p className="mt-2 text-sm text-background">
										Buscando Cursos...
									</p>
								</div>
							) : (
								<>
									<div className="mb-4 text-3xl text-blue-600">
										<FiCode aria-hidden="true" />
									</div>
									<h3 className="text-lg font-semibold text-background sm:text-base md:text-lg lg:text-xl">
										Todos los cursos
									</h3>
								</>
							)}
						</div>
						{featuredCategories?.map((category: Category) => (
							<div
								key={category.id}
								className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-center transition-transform hover:scale-105 hover:shadow-lg active:scale-95"
								onClick={() => handleCategorySelect(category.id.toString())}
								role="button"
								tabIndex={0}
								aria-label={`Mostrar cursos de ${category.name}`}
							>
								{loadingCategory === category.id.toString() ? (
									<div className="flex h-full flex-col items-center justify-center">
										<Icons.spinner
											className="size-10 text-background"
											aria-hidden="true"
										/>
										<p className="mt-2 text-sm text-background">
											Buscando Cursos...
										</p>
									</div>
								) : (
									<>
										<div
											className="mb-4 text-3xl text-blue-600"
											aria-hidden="true"
										>
											{categoryIcons[category.name] ?? <FiCode />}
										</div>
										<h3 className="text-lg font-semibold text-background sm:text-base md:text-lg lg:text-xl">
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
						))}
					</div>
				)}
			</div>
		</section>
	);
}
