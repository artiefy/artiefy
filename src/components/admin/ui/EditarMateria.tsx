'use client';

import { MateriaForm } from '~/components/admin/ui/Materiaform';

// Import the Materia interface
interface Materia {
	id: number;
	name: string;
	nombre: string;
	codigo: string;
	descripcion: string;
	duracion: string;
	profesor: string;
	estado: 'Activa' | 'Inactiva';
	// ... other properties
}

interface EditarMateriaProps {
	materia: Materia;
	onEditAction: (editedMateria: Materia) => void;
}

export function EditarMateria({ materia, onEditAction }: EditarMateriaProps) {
	const handleSubmit = (editedData: Omit<Materia, 'id' | 'name'>) => {
		onEditAction({ ...materia, ...editedData, id: materia.id });
	};

	return <MateriaForm onSubmitAction={handleSubmit} initialData={materia} />;
}
