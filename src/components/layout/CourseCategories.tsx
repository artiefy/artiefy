import React from "react";
import { FiCode, FiPenTool, FiBarChart, FiCamera, FiMusic, FiDatabase } from "react-icons/fi";
import { Button } from "~/components/ui/button";

const categories = [
  { icon: <FiCode />, name: "Programacion", courses: "150+ cursos" },
  { icon: <FiPenTool />, name: "Diseño", courses: "200+ cursos" },
  { icon: <FiBarChart />, name: "Marketing", courses: "120+ cursos" },
  { icon: <FiCamera />, name: "Fotografia", courses: "80+ cursos" },
  { icon: <FiMusic />, name: "Musica", courses: "90+ cursos" },
  { icon: <FiDatabase />, name: "Ciencia De Datos", courses: "100+ cursos" }
];

interface CourseCategoriesProps {
  onCategorySelect: (category: string | null) => void;
}

const CourseCategories: React.FC<CourseCategoriesProps> = ({ onCategorySelect }) => {
  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Top Categorías</h2>
          <Button variant="link" onClick={() => onCategorySelect(null)}>
              Ver todos
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow cursor-pointer transform hover:scale-105"
              onClick={() => onCategorySelect(category.name)}
            >
              <div className="text-3xl text-blue-600 mb-4">{category.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-background">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.courses}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseCategories;

