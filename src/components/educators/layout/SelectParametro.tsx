import React, { useEffect, useState } from 'react';

export interface Parametros {
	id: number;
	name: string;
	description: string;
	entrega: number;
	porcentaje: number;
	courseId: number;
	isUsed?: boolean;
}

interface SelectParametroProps {
	courseId: number | null;
	parametro: number;
	onParametroChange: (parametroId: number) => void;
	errors: {
		parametro: boolean;
	};
	selectedColor: string;
}

const SelectParametro: React.FC<SelectParametroProps> = ({
	courseId,
	parametro,
	onParametroChange,
	errors,
	selectedColor,
}) => {
	const [parametros, setParametros] = useState<Parametros[]>([]);
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
		const fetchParametros = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(
					`/api/educadores/parametros?courseId=${courseId}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);

				if (!response.ok) {
					const errorData = await response.text();
					throw new Error(`Error al obtener los parámetros: ${errorData}`);
				}

				const data = (await response.json()) as Parametros[];
				setParametros(data);
			} catch (error) {
				console.error('Error detallado:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchParametros().catch((error) =>
			console.error('Error fetching parametros:', error)
		);
	}, [courseId]);

	return (
		<div className="flex flex-col gap-2">
			<label
				htmlFor="parametro-select"
				className={`text-lg font-medium`}
				style={{
					backgroundColor: selectedColor,
					color: getContrastYIQ(selectedColor),
				}}
			>
				Selecciona un parametro:
			</label>
			{isLoading ? (
				<p className="text-black">Cargando parametro...</p>
			) : (
				<select
					id="parametro-select"
					value={parametro.toString()}
					onChange={(e) => {
						const selectedId = Number(e.target.value);
						onParametroChange(selectedId);
					}}
					className={`mb-5 w-60 rounded border border-none p-2 text-black outline-none`}
				>
					<option value="">Selecciona un parametro:</option>
					{parametros.map((parametro) => (
						<option key={parametro.id} value={parametro.id}>
							Parametro: {parametro.name}
						</option>
					))}
				</select>
			)}
		</div>
	);
};

export default SelectParametro;
