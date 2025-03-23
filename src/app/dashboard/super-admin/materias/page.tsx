'use client';

import React, { useEffect, useState } from 'react';

import ModalFormMateria from './modalFormCreate';

import type { Materia } from '~/models/super-adminModels/materiaModels';

const MateriasPage: React.FC = () => {
	const [materias, setMaterias] = useState<Materia[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const materiasPerPage = 9;

	const onCreate = (newMateria: Materia) => {
		setMaterias((prevMaterias) => [...prevMaterias, newMateria]);
		console.log('Materia creada:', newMateria);
	};

	const onUpdate = (updatedMateria: Materia) => {
		setMaterias((prevMaterias) =>
			prevMaterias.map((materia) =>
				materia.id === updatedMateria.id ? updatedMateria : materia
			)
		);
		console.log('Materia actualizada:', updatedMateria);
	};

	const filteredMaterias = materias.filter((materia) =>
		materia.title.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const totalPages = Math.ceil(filteredMaterias.length / materiasPerPage);
	const indexOfLastMateria = currentPage * materiasPerPage;
	const indexOfFirstMateria = indexOfLastMateria - materiasPerPage;
	const currentMaterias = filteredMaterias.slice(
		indexOfFirstMateria,
		indexOfLastMateria
	);

	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber);
	};

	const getPageNumbers = (current: number, total: number) => {
		if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);

		if (current <= 2) return [1, 2, 3];
		if (current >= total - 1) return [total - 2, total - 1, total];

		return [current - 1, current, current + 1];
	};

	useEffect(() => {
		const fetchMaterias = async () => {
			try {
				const response = await fetch('/api/super-admin/materias/materiasFull');
				if (!response.ok) {
					throw new Error('Error al obtener las materias');
				}
				const data = (await response.json()) as Materia[];
				setMaterias(data);
			} catch (error) {
				setError(error instanceof Error ? error.message : 'Error desconocido');
			} finally {
				setLoading(false);
			}
		};

		void fetchMaterias();
	}, []);

	const handleOpenModal = (materia: Materia | null = null) => {
		setEditingMateria(materia);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingMateria(null);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<span className="ml-2">Cargando...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
				<p>Error: {error}</p>
			</div>
		);
	}

	return (
		<>
			<header className="flex items-center justify-between rounded-lg bg-secondary p-6 text-3xl font-bold text-[#01142B] shadow-md">
				<h1>Materias</h1>
			</header>
			<div className="p-6">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<input
						type="text"
						placeholder="Buscar materias..."
						value={searchTerm}
						onChange={(e) => {
							setSearchTerm(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full rounded-md border border-gray-300 bg-gray-700 p-2 text-white focus:border-primary focus:outline-none sm:w-64"
					/>
					<button
						onClick={() => handleOpenModal()}
						className="flex items-center rounded-md bg-secondary px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-primary"
					>
						Crear Materia
					</button>
				</div>

				<ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{currentMaterias.map((materia) => (
						<li
							key={materia.id}
							className="rounded-lg border border-primary bg-gray-800 p-4 shadow-md"
						>
							<h2 className="text-xl font-bold">{materia.title}</h2>
							<p>{materia.description}</p>
							<div className="mt-4 flex space-x-2">
								<button
									onClick={() => handleOpenModal(materia)}
									className="flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-blue-600"
								>
									Editar
								</button>
								<button
									onClick={async () => {
										await fetch(`/api/super-admin/materias/${materia.id}`, {
											method: 'DELETE',
										});

										setMaterias(materias.filter((m) => m.id !== materia.id));
									}}
									className="flex items-center rounded-md bg-red-700 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-red-800"
								>
									Eliminar
								</button>
							</div>
						</li>
					))}
				</ul>

				{totalPages > 1 && (
					<div className="mt-6 flex justify-center gap-2">
						<button
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className="rounded-md bg-gray-700 px-3 py-1 text-white transition disabled:opacity-50"
						>
							←
						</button>
						{getPageNumbers(currentPage, totalPages).map((pageNum) => (
							<button
								key={pageNum}
								onClick={() => handlePageChange(pageNum)}
								className={`rounded-md px-3 py-1 ${
									currentPage === pageNum
										? 'bg-primary text-white'
										: 'bg-gray-700 text-white'
								}`}
							>
								{pageNum}
							</button>
						))}
						<button
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className="rounded-md bg-gray-700 px-3 py-1 text-white transition disabled:opacity-50"
						>
							→
						</button>
					</div>
				)}

				{isModalOpen && (
					<div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center">
						<div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
							<button
								onClick={handleCloseModal}
								className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
							>
								&times;
							</button>
							<ModalFormMateria
								isOpen={isModalOpen}
								onClose={handleCloseModal}
								editingMateria={editingMateria}
								onCreate={onCreate}
								onUpdate={onUpdate}
							/>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default MateriasPage;
