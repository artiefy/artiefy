import { useEffect, useState } from 'react';

interface TypeAct {
	id: number;
	name: string;
	description: string;
}

interface TypeActDropdownProps {
	typeActi: number;
	setTypeActividad: (categoryId: number) => void;
	errors: {
		type: boolean;
	};
}

const TypeActDropdown: React.FC<TypeActDropdownProps> = ({
	typeActi,
	setTypeActividad,
	errors,
}) => {
	const [allTypeAct, setTypeAct] = useState<TypeAct[]>([]);
	const [isLoading, setIsLoading] = useState(true);

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

		fetchTypeAct().catch((error) =>
			console.error('Error fetching categories:', error)
		);
	}, []);

	return (
		<div className="flex flex-col gap-2">
			<label
				htmlFor="category-select"
				className="text-lg font-medium text-black"
			>
				Selecciona un tipo de actividad:
			</label>
			{isLoading ? (
				<p className="text-black">Cargando los tipos de actividades...</p>
			) : (
				<select
					id="typesAct-select"
					value={typeActi || ''}
					onChange={(e) => {
						const selectedId = Number(e.target.value);
						setTypeActividad(selectedId);
					}}
					className={`mb-5 w-80 rounded border p-2 text-black outline-hidden ${
						errors.type ? 'border-red-500' : 'border-slate-200'
					}`}
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
