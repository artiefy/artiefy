import React, { useEffect, useState } from 'react';

// Interfaz para las dificultades
interface Dificultad {
	id: number;
	name: string;
	description: string;
}

// Propiedades del componente para la creacion de un curso en componente padre
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
	const [dificultades, setDificultades] = useState<Dificultad[]>([]); // Estado para las dificultades
	const [isLoading, setIsLoading] = useState(true); // Estado para el estado de carga

	// Efecto para obtener las dificultades
	useEffect(() => {
		const fetchCategories = async () => {
			setIsLoading(true);
			try {
				const response = await fetch('/api/educadores/dificultad', {
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

		// Llamada a la función para obtener las dificultades
		void fetchCategories();
	}, []);

	// Retorno la vista del componente
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
					className={`mb-5 w-60 rounded border bg-background p-2 text-white outline-hidden ${
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
