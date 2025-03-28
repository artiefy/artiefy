import { useEffect, useState } from 'react';

import Select from 'react-select';

// Interfaz para las modalidades
interface Modalidad {
	id: number;
	name: string;
	description: string;
}

// Propiedades del componente para la creacion de un curso en componente padre
interface ModalidadDropdownProps {
	modalidad: number[];
	setModalidad: (modalidadIds: number[]) => void;
	errors: {
		modalidad: boolean;
	};
}

const ModalidadDropdown: React.FC<ModalidadDropdownProps> = ({
	modalidad,
	setModalidad,
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
		  <label htmlFor="category-select" className="text-lg font-medium text-primary">
			Selecciona una Modalidad:
		  </label>
		  {isLoading ? (
			<p className="text-primary">Cargando categorías...</p>
		  ) : (
			<Select
			  isMulti
			  options={modalidades.map((modalidad) => ({
				value: modalidad.id,
				label: modalidad.name,
			  }))}
			  value={modalidad
				.map((id) => {
				  const modalidad = modalidades.find((m) => m.id === id);
				  return modalidad
					? { value: modalidad.id, label: modalidad.name }
					: null;
				})
				.filter(Boolean)}
				onChange={(selectedOptions) => {
					const selectedIds = selectedOptions
						.filter((option) => option !== null)
						.map((option) => option.value);
					setModalidad(selectedIds);
				}}
			  classNamePrefix="react-select"
			  className="mt-2 w-full"
			/>
		  )}
		</div>
	  );
};

export default ModalidadDropdown;
