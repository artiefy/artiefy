import { FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";
import {
  FiBarChart,
  FiCamera,
  FiCode,
  FiDatabase,
  FiMusic,
  FiPenTool,
} from "react-icons/fi";

const categories = [
  { icon: <FiCode />, name: "Programacion", courses: "150+ cursos" },
  { icon: <FiPenTool />, name: "Diseño", courses: "200+ cursos" },
  { icon: <FiBarChart />, name: "Marketing", courses: "120+ cursos" },
  { icon: <FiCamera />, name: "Fotografia", courses: "80+ cursos" },
  { icon: <FiMusic />, name: "Musica", courses: "90+ cursos" },
  { icon: <FiDatabase />, name: "Ciencia De Datos", courses: "100+ cursos" },
];

interface CourseCategoriesProps {
  onCategorySelect: (category: string | null) => void;
  onSearch: (search: string) => void;
}

const CourseCategories: React.FC<CourseCategoriesProps> = ({
  onCategorySelect,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
            <FunnelIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
            <select
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
              value={selectedCategory ?? ""}
              onChange={(e) => handleCategoryChange(e.target.value || null)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category, index) => (
                <option key={index} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
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
          {categories.map((category, index) => (
            <div
              key={index}
              className="flex transform cursor-pointer flex-col items-center rounded-lg bg-gray-50 p-6 transition-shadow hover:scale-105 hover:shadow-lg"
              onClick={() => onCategorySelect(category.name)}
            >
              <div className="mb-4 text-3xl text-blue-600">{category.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-background">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500">{category.courses}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseCategories;
