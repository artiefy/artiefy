import React, { useEffect, useState } from 'react';

interface Dificultad {
  id: number;
  name: string;
  description: string;
}

interface DificultadDropdownProps {
  dificultad: number;
  setDificultad: (dificultadId: number) => void;
  errors: {
    dificultad: boolean;
  };
}

const DificultadDropdown: React.FC<DificultadDropdownProps> = ({
  dificultad,
  setDificultad,
  errors,
}) => {
  const [dificultades, setDificultades] = useState<Dificultad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/dificultad', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Error al obtener las categorías: ${errorData}`);
        }

        const data: Dificultad[] = (await response.json()) as Dificultad[];
        setDificultades(data);
      } catch (error) {
        console.error('Error detallado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCategories();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="category-select"
        className="text-lg font-medium text-primary"
      >
        Selecciona una Dificultad:
      </label>
      {isLoading ? (
        <p className="text-primary">Cargando categorías...</p>
      ) : (
        <select
          id="category-select"
          value={dificultad || ''}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            setDificultad(selectedId);
          }}
          className={`mb-5 w-60 rounded border p-2 outline-none ${
            errors.dificultad ? 'border-red-500' : 'border-primary'
          }`}
        >
          <option value="">Selecciona una dificultad</option>
          {dificultades.map((dificultad) => (
            <option key={dificultad.id} value={dificultad.id}>
              {dificultad.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default DificultadDropdown;
