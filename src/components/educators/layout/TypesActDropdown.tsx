import React, { useEffect, useState } from 'react';

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
	selectedColor: string;
}

const TypeActDropdown: React.FC<TypeActDropdownProps> = ({
	typeActi,
	setTypeActividad,
	errors,
	selectedColor,
}) => {
	const [allTypeAct, setTypeAct] = useState<TypeAct[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const getContrastYIQ = (hexcolor: string) => {
		hexcolor = hexcolor.replace('#', '');
		const r = parseInt(hexcolor.substr(0, 2), 16);
		const g = parseInt(hexcolor.substr(2, 2), 16);
		const b = parseInt(hexcolor.substr(4, 2), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 128 ? 'black' : 'white';
	};
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
				className={`text-lg font-medium`}
				style={{
					backgroundColor: selectedColor,
					color: getContrastYIQ(selectedColor),
				}}
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
					className={`mb-5 w-2/5 rounded border border-none p-2 text-black outline-none`}
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
