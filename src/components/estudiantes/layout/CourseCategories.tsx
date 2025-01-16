import React, { useState, useEffect } from 'react';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import {
  FiBarChart,
  FiCamera,
  FiCode,
  FiDatabase,
  FiMusic,
  FiPenTool,
} from 'react-icons/fi';
import {
  getAllCategories,
  getFeaturedCategories,
} from '~/server/actions/studentActions';
import { type Category } from '~/types';

interface CourseCategoriesProps {
  onCategorySelect: (category: string | null) => void;
  onSearch: (search: string) => void;
}

const categoryIcons: Record<string, JSX.Element> = {
  Programacion: <FiCode />,
  Diseño: <FiPenTool />,
  Marketing: <FiBarChart />,
  Fotografia: <FiCamera />,
  Musica: <FiMusic />,
  'Ciencia De Datos': <FiDatabase />,
};

const CourseCategories: React.FC<CourseCategoriesProps> = ({
  onCategorySelect,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const featured = await getFeaturedCategories(6);
        const all = await getAllCategories();
        setFeaturedCategories(featured);
        setAllCategories(all);
      } catch (error) {
        console.error('Error al obtener las categorías:', error);
      }
    };

    void fetchCategories();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    onCategorySelect(category);
  };

  return (
    <section className="py-4">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="relative w-full sm:w-3/4 md:w-1/3 lg:w-1/3">
            <FunnelIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500" />
            <select
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-2 px-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
              value={selectedCategory ?? ''}
              onChange={(e) => handleCategoryChange(e.target.value || null)}
            >
              <option value="">Todas las categorías</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="size-4 text-gray-500" />
            </div>
            <input
              required
              placeholder="Buscar..."
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
              type="search"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {featuredCategories.map((category) => (
            <div
              key={category.id}
              className="flex cursor-pointer flex-col items-center rounded-lg bg-gray-50 p-6 transition-shadow hover:scale-105 hover:shadow-lg"
              onClick={() => onCategorySelect(category.name)}
            >
              <div className="mb-4 text-3xl text-blue-600">
                {categoryIcons[category.name] ?? <FiCode />}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-background">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500">
                {`${category.courses?.length ?? 0} curso${category.courses?.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseCategories;
