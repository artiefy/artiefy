import { useEffect, useState } from 'react';

// Interfaz para las categorías
interface Category {
  id: number;
  name: string;
  description: string;
}

// Propiedades del componente para la creacion de un curso en componente padre
interface CategoryDropdownProps {
  category: number;
  setCategory: (categoryId: number) => void;
  errors: {
    category: boolean;
  };
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  category,
  setCategory,
  errors,
}) => {
  const [categories, setCategories] = useState<Category[]>([]); // Estado para las categorías
  const [isLoading, setIsLoading] = useState(true); // Estado para el estado de carga

  // Efecto para obtener las categorías
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/educadores/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Error al obtener las categorías: ${errorData}`);
        }

        const data = (await response.json()) as Category[];
        setCategories(data);
      } catch (error) {
        console.error('Error detallado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Llamada a la función para obtener las categorías
    fetchCategories().catch((error) =>
      console.error('Error fetching categories:', error)
    );
  }, []);

  // Retorno la vista del componente
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="category-select"
        className="text-primary text-lg font-medium"
      >
        Selecciona una categoría:
      </label>
      {isLoading ? (
        <p className="text-primary">Cargando categorías...</p>
      ) : (
        <select
          id="category-select"
          value={category || ''}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            setCategory(selectedId);
          }}
          className={`bg-background mb-5 w-60 rounded border p-2 text-white outline-hidden ${
            errors.category ? 'border-red-500' : 'border-primary'
          }`}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default CategoryDropdown;
