import { useEffect, useState } from 'react';

// Interfaz para las modalidades
interface Modalidad {
  id: number;
  name: string;
  description: string;
}

// Propiedades del componente para la creacion de un curso en componente padre
interface ModalidadDropdownProps {
  modalidad: number;
  setModalidad: (modalidadId: number) => void;
  errors: {
    modalidad: boolean;
  };
}

const ModalidadDropdown: React.FC<ModalidadDropdownProps> = ({
  modalidad,
  setModalidad,
  errors,
}) => {
  const [modalidades, setModalidades] = useState<Modalidad[]>([]); // Estado para las modalidades
  const [isLoading, setIsLoading] = useState(true); // Estado para el estado de carga

  // Efecto para obtener las modalidades
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/educadores/modalidades', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Error al obtener las categorías: ${errorData}`);
        }

        const data: Modalidad[] = (await response.json()) as Modalidad[];
        setModalidades(data);
      } catch (error) {
        console.error('Error detallado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Llamada a la función para obtener las modalidades
    void fetchCategories();
  }, []);

  // Retorno la vista del componente
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="category-select"
        className="text-primary text-lg font-medium"
      >
        Selecciona una Modalidad:
      </label>
      {isLoading ? (
        <p className="text-primary">Cargando categorías...</p>
      ) : (
        <select
          id="category-select"
          value={modalidad || ''}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            setModalidad(selectedId);
          }}
          className={`bg-background mb-5 w-60 rounded border p-2 text-white outline-hidden ${
            errors.modalidad ? 'border-red-500' : 'border-primary'
          }`}
        >
          <option value="">Selecciona una modalidad</option>
          {modalidades.map((modalidad) => (
            <option key={modalidad.id} value={modalidad.id}>
              {modalidad.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default ModalidadDropdown;
