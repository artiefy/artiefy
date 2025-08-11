import { useEffect, useState } from 'react';

// Interfaz para los tipos de actividades
interface TypeAct {
  id: number;
  name: string;
  description: string;
}

// Propiedades del componente para la creacion de un curso en componente padre
interface TypeActDropdownProps {
  typeActi: number;
  setTypeActividad: (categoryId: number) => void;
  selectedColor: string;
}

const TypeActDropdown: React.FC<TypeActDropdownProps> = ({
  typeActi,
  setTypeActividad,
  selectedColor,
}) => {
  const [allTypeAct, setTypeAct] = useState<TypeAct[]>([]); // Estado para los tipos de actividades
  const [isLoading, setIsLoading] = useState(true); // Estado para el estado de carga

  // Función para obtener el contraste de un color
  const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace('#', '');
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  };

  // Fetch de los tipos de actividades
  useEffect(() => {
    const fetchTypeAct = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/educadores/typeAct', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Error al obtener las categorías: ${errorData}`);
        }

        const data = (await response.json()) as TypeAct[];
        setTypeAct(data);
      } catch (error) {
        console.error('Error detallado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Llamamos a la función para obtener las categorías
    fetchTypeAct().catch((error) =>
      console.error('Error fetching categories:', error)
    );
  }, []);

  // Retornamos el componente
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="category-select"
        className={`text-lg font-medium`}
        style={{
          backgroundColor: selectedColor,
          color: getContrastYIQ(selectedColor),
        }}
      >
        Selecciona un tipo de actividad:
      </label>
      {isLoading ? (
        <p
          className={`my-3 ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'} `}
        >
          Cargando los tipos de actividades...
        </p>
      ) : (
        <select
          id="typesAct-select"
          value={typeActi || ''}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            setTypeActividad(selectedId);
          }}
          className={`mb-5 w-8/12 rounded border border-none bg-white p-2 text-black outline-none`}
        >
          <option value="">Selecciona un tipo de actividad</option>
          {allTypeAct.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default TypeActDropdown;
