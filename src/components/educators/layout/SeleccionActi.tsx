// props de SeleccionActi
// - selectedColor
interface TypeActDropdownProps {
	selectedColor: string;
	onSelectChange: (value: string) => void;
}

const SeleccionActi: React.FC<TypeActDropdownProps> = ({
	selectedColor,
	onSelectChange,
}) => {
	// Función para obtener el contraste de un color
	const getContrastYIQ = (hexcolor: string) => {
		hexcolor = hexcolor.replace('#', '');
		const r = parseInt(hexcolor.substr(0, 2), 16);
		const g = parseInt(hexcolor.substr(2, 2), 16);
		const b = parseInt(hexcolor.substr(4, 2), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 128 ? 'black' : 'white';
	};

	// Retorno la vista del componente
	return (
		<div className="mt-3 flex flex-col items-center justify-center gap-2">
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
			<select
				id="typesAct-select"
				className={`mb-5 w-80 rounded border border-slate-300 bg-white p-2 text-black outline-none`}
				onChange={(e) => onSelectChange(e.target.value)}
			>
				<option value="">Selecciona un tipo de actividad</option>
				<option value="OM">Pregunta de seleccion multiple</option>
				<option value="FOV">Pregunta falso o verdadero</option>
				<option value="COMPLETADO">Pregunta de completado</option>
			</select>
		</div>
	);
};

export default SeleccionActi;
