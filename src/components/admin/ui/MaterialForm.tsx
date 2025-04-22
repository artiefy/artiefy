import { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import { Input } from '~/components/admin/ui/input';
import { Label } from '~/components/admin/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';

interface MaterialFormProps {
	onSubmit: (material: {
		id?: number;
		nombre: string;
		tipo: string;
		curso: string;
	}) => void;
	material?: {
		id: number;
		nombre: string;
		tipo: string;
		curso: string;
	};
}

export function MaterialForm({ onSubmit, material }: MaterialFormProps) {
	const [formData, setFormData] = useState({
		nombre: material?.nombre ?? '',
		tipo: material?.tipo ?? '',
		curso: material?.curso ?? '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(material ? { ...formData, id: material.id } : formData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor="nombre">Nombre del Material</Label>
				<Input
					id="nombre"
					name="nombre"
					value={formData.nombre}
					onChange={handleChange}
					required
				/>
			</div>
			<div>
				<Label htmlFor="tipo">Tipo de Material</Label>
				<Select
					name="tipo"
					onValueChange={(value: string) => handleSelectChange('tipo', value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="PDF">PDF</SelectItem>
						<SelectItem value="DOC">DOC</SelectItem>
						<SelectItem value="VIDEO">Video</SelectItem>
						<SelectItem value="AUDIO">Audio</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label htmlFor="curso">Curso Asociado</Label>
				<Input
					id="curso"
					name="curso"
					value={formData.curso}
					onChange={handleChange}
					required
				/>
			</div>
			<Button type="submit">
				{material ? 'Actualizar' : 'Agregar'} Material
			</Button>
		</form>
	);
}
