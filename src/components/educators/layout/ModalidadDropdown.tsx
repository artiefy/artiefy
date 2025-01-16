import React, { useEffect, useState } from 'react';

interface Modalidad {
  id: number;
  name: string;
  description: string;
}

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
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/modalidades', {
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
        console.log('Datos de la respuesta:', data);
        setModalidades(data);
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
            console.log('Categoría seleccionada:', selectedId);
          }}
          className={`mb-5 w-60 rounded border p-2 outline-none ${
            errors.modalidad ? 'border-red-500' : 'border-primary'
          }`}
        >
          <option value="">Selecciona una categoría</option>
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
