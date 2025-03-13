import React, { useEffect, useState } from 'react';

interface Nivel {
	id: number;
	name: string;
	description: string;
}

interface NivelDropdownProps {
	nivel: number;
	setNivel: (nivelId: number) => void;
	errors: {
		nivel: boolean;
	};
}

const NivelDropdown: React.FC<NivelDropdownProps> = ({
	nivel,
	setNivel,
	errors,
}) => {
	const [niveles, setNiveles] = useState<Nivel[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchCategories = async () => {
			setIsLoading(true);
			try {
				const response = await fetch('/api/educadores/nivel', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					const errorData = await response.text();
					throw new Error(`Error al obtener las categorías: ${errorData}`);
				}

				const data: Nivel[] = (await response.json()) as Nivel[];
				setNiveles(data);
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
				className="text-primary text-lg font-medium"
			>
				Selecciona un Nivel:
			</label>
			{isLoading ? (
				<p className="text-primary">Cargando categorías...</p>
			) : (
				<select
					id="category-select"
					value={nivel || ''}
					onChange={(e) => {
						const selectedId = Number(e.target.value);
						setNivel(selectedId);
					}}
					className={`mb-5 w-60 rounded border p-2 outline-hidden ${
						errors.nivel ? 'border-red-500' : 'border-primary'
					}`}
				>
					<option value="">Selecciona un nivel</option>
					{niveles.map((nivel) => (
						<option key={nivel.id} value={nivel.id}>
							{nivel.name}
						</option>
					))}
				</select>
			)}
		</div>
	);
};

export default NivelDropdown;
