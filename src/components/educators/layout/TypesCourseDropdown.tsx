import { useEffect, useState } from 'react';

import Select from 'react-select';

// Interfaz para los tipos de curso
interface CourseType {
	id: number;
	name: string;
	description: string;
}

// Props que recibe el componente
interface TypesCourseDropdownProps {
	courseTypeId: number[]; // Now expects an array of numbers
	setCourseTypeId: (typeIds: number[]) => void; // Now expects an array of numbers
	errors?: {
		type?: boolean;
	};
}

const TypesCourseDropdown: React.FC<TypesCourseDropdownProps> = ({
	courseTypeId,
	setCourseTypeId,
}) => {
	const [types, setTypes] = useState<CourseType[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchTypes = async () => {
			setIsLoading(true);
			try {
				const response = await fetch('/api/educadores/typesCourse', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					const errorData = await response.text();
					throw new Error(`Error al obtener tipos de curso: ${errorData}`);
				}

				const data = (await response.json()) as CourseType[];
				setTypes(data);
			} catch (error) {
				console.error('Error al obtener tipos de curso:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchTypes().catch((error) =>
			console.error('Error fetching course types:', error)
		);
	}, []);

	return (
		<div className="flex flex-col gap-2">
			{isLoading ? (
				<p className="text-primary">Cargando tipos de curso...</p>
			) : (
				<Select
	isMulti
	options={types.map((type) => ({
		value: type.id,
		label: type.name,
	}))}
	value={courseTypeId.map((id) => {
		const found = types.find((t) => t.id === id);
		return found ? { value: found.id, label: found.name } : null;
	}).filter(Boolean)}
	onChange={(selectedOptions) => {
		const selectedIds = (selectedOptions as { value: number; label: string }[])
			.filter((option) => option !== null)
			.map((option) => option.value);
		setCourseTypeId(selectedIds);
	}}
	classNamePrefix="react-select"
	className="mt-2 w-full"
/>

			)}
		</div>
	);
};

export default TypesCourseDropdown;
