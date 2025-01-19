"use client"
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { Icons } from '~/components/estudiantes/ui/icons';
import {
  FiBarChart,
  FiCamera,
  FiCode,
  FiDatabase,
  FiMusic,
  FiPenTool,
} from 'react-icons/fi';
import { type Category } from '~/types';

interface CourseCategoriesProps {
  allCategories: Category[];
  featuredCategories: Category[];
}

const categoryIcons: Record<string, JSX.Element> = {
  Programacion: <FiCode />,
  Diseño: <FiPenTool />,
  Marketing: <FiBarChart />,
  Fotografia: <FiCamera />,
  Musica: <FiMusic />,
  'Ciencia De Datos': <FiDatabase />,
};

export default function CourseCategories({ allCategories, featuredCategories }: CourseCategoriesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  useEffect(() => {
    const currentSearchTerm = searchParams.get('searchTerm');
    if (currentSearchTerm) {
      setSearchTerm(currentSearchTerm);
    }
  }, [searchParams]);

  const handleCategorySelect = (category: string | null) => {
    setLoadingCategory(category ?? 'all');
    if (category) {
      router.push(`${pathname}?category=${encodeURIComponent(category)}`, { scroll: false });
    } else {
      router.push(pathname, { scroll: false });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCategory('search');
    if (searchTerm) {
      router.push(`${pathname}?searchTerm=${encodeURIComponent(searchTerm)}`, { scroll: false });
    } else {
      router.push(pathname, { scroll: false });
    }
  };

  useEffect(() => {
    setLoadingCategory(null);
  }, [searchParams]);

  return (
    <section className="py-4">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="relative w-full sm:w-3/4 md:w-1/3 lg:w-1/3">
            <FunnelIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
            <select
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-2 px-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
              onChange={(e) => handleCategorySelect(e.target.value || null)}
            >
              <option value="">Todas las categorías</option>
              {allCategories?.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <form className="relative flex w-full max-w-xs items-center space-x-2" onSubmit={handleSearch}>
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="size-4 text-gray-500" />
              </div>
              <input
                required
                placeholder="Busca Tu CURSO..."
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-background hover:bg-primary/90 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/50 active:scale-95 transition-transform"
              disabled={loadingCategory === 'search'}
            >
              {loadingCategory === 'search' ? (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="mr-2 size-4" />
              )}
              Buscar
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-center transition-transform hover:scale-105 hover:shadow-lg active:scale-95 aspect-square"
            onClick={() => handleCategorySelect(null)}
          >
            {loadingCategory === 'all' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Icons.spinner className="size-8 animate-spin text-background" />
                <p className="mt-2 text-sm text-background">Buscando Cursos...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-3xl text-blue-600">
                  <FiCode />
                </div>
                <h3 className="text-lg font-semibold text-background">
                  Todos los cursos
                </h3>
              </>
            )}
          </div>
          {featuredCategories?.map((category) => (
            <div
              key={category.id}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-center transition-transform hover:scale-105 hover:shadow-lg active:scale-95 aspect-square"
              onClick={() => handleCategorySelect(category.name)}
            >
              {loadingCategory === category.name ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Icons.spinner className="size-8 animate-spin text-background" />
                  <p className="mt-2 text-sm text-background">Buscando Cursos...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-3xl text-blue-600">
                    {categoryIcons[category.name] ?? <FiCode />}
                  </div>
                  <h3 className="text-lg font-semibold text-background">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {`${category.courses?.length ?? 0} curso${category.courses?.length !== 1 ? 's' : ''}`}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

