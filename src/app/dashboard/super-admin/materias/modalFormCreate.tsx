'use client';

import { useState, useEffect } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';

import type { Materia } from '~/models/super-adminModels/materiaModels';

interface ModalFormMateriaProps {
	isOpen: boolean;
	onClose: () => void;
	editingMateria: Materia | null;
	onCreate: () => void;
	onUpdate: () => void;
}

const ModalFormMateria: React.FC<ModalFormMateriaProps> = ({
	isOpen,
	onClose,
	editingMateria,
	onCreate,
	onUpdate,
}) => {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [errors, setErrors] = useState({
		title: false,
		description: false,
	});

	useEffect(() => {
		if (editingMateria) {
			setTitle(editingMateria.title);
			setDescription(editingMateria.description);
		}
	}, [editingMateria]);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors = {
			title: !title,
			description: !description,
		};

		setErrors(newErrors);

		if (Object.values(newErrors).some((error) => error)) {
			toast.error('Error', {
				description: 'Todos los campos son obligatorios',
			});
			return;
		}

		const materiaData = { title, description };

		try {
			const response = await fetch('/api/super-admin/materias', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(materiaData),
			});

			if (!response.ok) {
				throw new Error('Error al guardar la materia');
			}

			await response.json();
			onCreate();
			onClose();
			toast.success('Materia creada exitosamente');
		} catch (error) {
			toast.error('Error', {
				description: 'Error al guardar la materia: ' + (error as Error).message,
			});
			console.error('Error:', error);
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		const newErrors = {
			title: !title,
			description: !description,
		};

		setErrors(newErrors);

		if (Object.values(newErrors).some((error) => error)) {
			toast.error('Error', {
				description: 'Todos los campos son obligatorios',
			});
			return;
		}

		const materiaData = { title, description };

		try {
			const response = await fetch(
				`/api/super-admin/materias?id=${editingMateria?.id}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(materiaData),
				}
			);

			if (!response.ok) {
				throw new Error('Error al actualizar la materia');
			}

			await response.json();
			onUpdate();
			onClose();
			toast.success('Materia actualizada exitosamente');
		} catch (error) {
			toast.error('Error', {
				description:
					'Error al actualizar la materia: ' + (error as Error).message,
			});
			console.error('Error:', error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[90vh] max-w-full overflow-y-auto">
				<DialogHeader className="mt-4">
					<DialogTitle className="text-4xl">
						{editingMateria ? 'Editar Materia' : 'Crear Materia'}
					</DialogTitle>
					<DialogDescription className="text-xl text-white">
						{editingMateria
							? 'Edita los detalles de la materia'
							: 'Llena los detalles para crear una nueva materia'}
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-lg bg-background px-6 text-black shadow-md">
					<label htmlFor="title" className="text-lg font-medium text-primary">
						Título
					</label>
					<Input
						type="text"
						placeholder="Título"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className={`mb-4 w-full rounded border p-2 text-white outline-none ${errors.title ? 'border-red-500' : 'border-primary'}`}
					/>
					{errors.title && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
					<label
						htmlFor="description"
						className="text-lg font-medium text-primary"
					>
						Descripción
					</label>
					<textarea
						placeholder="Descripción"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className={`mb-3 h-auto w-full rounded border p-2 text-white outline-none ${errors.description ? 'border-red-500' : 'border-primary'}`}
					/>
					{errors.description && (
						<p className="text-sm text-red-500">Este campo es obligatorio.</p>
					)}
				</div>
				<DialogFooter className="mt-4 grid grid-cols-2 gap-4">
					<Button
						onClick={onClose}
						className="mr-2 w-full border-transparent bg-gray-600 p-3 text-white hover:bg-gray-700"
					>
						Cancelar
					</Button>
					<Button
						onClick={editingMateria ? handleUpdate : handleCreate}
						className="bg-green-400 text-white hover:bg-green-400/70"
					>
						{editingMateria ? 'Actualizar' : 'Crear'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ModalFormMateria;
