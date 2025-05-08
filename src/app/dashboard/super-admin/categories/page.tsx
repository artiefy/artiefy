'use client';

import { useEffect, useState } from 'react';

import {
	Loader2,
	X,
	Edit,
	Trash2,
	Plus,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';

interface Category {
	id: number;
	name: string;
	description: string;
	is_featured: boolean;
}

export default function CategoriesPage() {
	const [categories, setCategories] = useState<
		{ id: number; name: string; description: string; is_featured: boolean }[]
	>([]);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [is_featured, setIsFeatured] = useState(false);
	const [editingCategory, setEditingCategory] = useState<{
		id: number;
		name: string;
		description: string;
		is_featured: boolean;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);
	const [showConfirmDelete, setShowConfirmDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);

	// 🔹 Estados para paginación
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Add new state for view toggle
	const [activeView, setActiveView] = useState<'featured' | 'other'>(
		'featured'
	);

	useEffect(() => {
		const fetchData = async () => {
			await fetchCategories();
		};
		void fetchData();
	}, []);

	async function fetchCategories() {
		try {
			setLoading(true);
			const res = await fetch('/api/super-admin/categories');
			if (!res.ok) throw new Error('Error al cargar categorías');
			const data = (await res.json()) as Category[];
			setCategories(data);
		} catch {
			setError('Error al obtener categorías.');
		} finally {
			setLoading(false);
		}
	}

	async function handleCreate() {
		try {
			await fetch('/api/super-admin/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, description, is_featured }),
			});
			setName('');
			setDescription('');
			setIsFeatured(false);
			await fetchCategories();
			setShowCreateForm(false);
		} catch {
			setError('Error al guardar categoría.');
		}
	}

	async function handleEdit() {
		if (!editingCategory) return;
		try {
			await fetch('/api/super-admin/categories', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: editingCategory.id,
					name,
					description,
					is_featured,
				}),
			});
			setEditingCategory(null);
			setName('');
			setDescription('');
			setIsFeatured(false);
			await fetchCategories();
			setShowEditForm(false);
		} catch {
			setError('Error al actualizar categoría.');
		}
	}

	async function handleDelete(id: number) {
		try {
			await fetch('/api/super-admin/categories', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			});
			await fetchCategories();
			setShowConfirmDelete(null);
		} catch {
			setError('Error al eliminar categoría.');
		}
	}

	// 🔹 Lógica de paginación
	const currentCategories =
		activeView === 'featured'
			? categories.filter((cat) => cat.is_featured)
			: categories.filter((cat) => !cat.is_featured);

	const totalPages = Math.ceil(currentCategories.length / itemsPerPage);
	const paginatedCategories = currentCategories.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset page when switching views
	useEffect(() => {
		setCurrentPage(1);
	}, [activeView]);

	return (
		<>
			<div className="p-6">
				<header className="flex items-center justify-between rounded-lg bg-[#00BDD8] p-6 text-3xl font-bold text-[#01142B] shadow-md">
					<h1>Gestión de Categorías</h1>
					<button
						onClick={() => {
							setShowCreateForm(true);
							setName('');
							setDescription('');
							setIsFeatured(false);
						}}
						className="hover:bg-opacity-90 flex items-center rounded-md bg-[#01142B] px-4 py-2 font-semibold text-white shadow-md"
					>
						<Plus className="mr-2 size-5" /> Crear
					</button>
				</header>

				{/* Add view toggle buttons */}
				<div className="mt-6 flex space-x-4">
					<button
						onClick={() => setActiveView('featured')}
						className={`rounded-md px-4 py-2 font-semibold ${
							activeView === 'featured'
								? 'bg-[#3AF4EF] text-[#01142B]'
								: 'bg-gray-700 text-white'
						}`}
					>
						Categorías Destacadas
					</button>
					<button
						onClick={() => setActiveView('other')}
						className={`rounded-md px-4 py-2 font-semibold ${
							activeView === 'other'
								? 'bg-[#3AF4EF] text-[#01142B]'
								: 'bg-gray-700 text-white'
						}`}
					>
						Otras Categorías
					</button>
				</div>

				{showCreateForm && (
					<ModalForm
						title="Nueva Categoría"
						onClose={() => setShowCreateForm(false)}
						onSubmit={handleCreate}
						name={name}
						setName={setName}
						description={description}
						setDescription={setDescription}
						is_featured={is_featured}
						setIsFeatured={setIsFeatured}
					/>
				)}

				{showEditForm && editingCategory && (
					<ModalForm
						title="Editar Categoría"
						onClose={() => setShowEditForm(false)}
						onSubmit={handleEdit}
						name={name}
						setName={setName}
						description={description}
						setDescription={setDescription}
						is_featured={is_featured}
						setIsFeatured={setIsFeatured}
					/>
				)}

				{showConfirmDelete && (
					<ConfirmDeleteModal
						item={showConfirmDelete}
						onClose={() => setShowConfirmDelete(null)}
						onConfirm={() => handleDelete(showConfirmDelete.id)}
					/>
				)}

				{loading ? (
					<LoaderComponent />
				) : error ? (
					<ErrorMessage message={error} />
				) : (
					<>
						{activeView === 'featured' ? (
							<div className="mt-6">
								<TableComponent
									data={paginatedCategories}
									onEdit={(item: Category) => {
										setEditingCategory(item);
										setName(item.name);
										setDescription(item.description);
										setIsFeatured(item.is_featured);
										setShowEditForm(true);
									}}
									onDelete={setShowConfirmDelete}
								/>
							</div>
						) : (
							<div className="mt-6">
								<TableComponent
									data={paginatedCategories}
									onEdit={(item: Category) => {
										setEditingCategory(item);
										setName(item.name);
										setDescription(item.description);
										setIsFeatured(item.is_featured);
										setShowEditForm(true);
									}}
									onDelete={setShowConfirmDelete}
								/>
							</div>
						)}

						<PaginationControls
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={setCurrentPage}
						/>
					</>
				)}
			</div>
		</>
	);
}

const ModalForm = ({
	title,
	onClose,
	onSubmit,
	name,
	setName,
	description,
	setDescription,
	is_featured,
	setIsFeatured,
}: {
	title: string;
	onClose: () => void;
	onSubmit: () => void;
	name: string;
	setName: (name: string) => void;
	description: string;
	setDescription: (description: string) => void;
	is_featured: boolean;
	setIsFeatured: (featured: boolean) => void;
}) => (
	<div className="fixed inset-0 z-50 flex items-center justify-center">
		<div className="absolute inset-0 bg-gradient-to-b from-[#01142B] to-[#01142B] opacity-80" />
		<div className="relative z-10 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-lg">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold text-white">{title}</h2>
				<button onClick={onClose}>
					<X className="size-6 text-gray-300 hover:text-white" />
				</button>
			</div>
			<input
				type="text"
				placeholder="Nombre"
				value={name}
				onChange={(e) => setName(e.target.value)}
				className="mt-4 w-full rounded-md bg-gray-700 px-3 py-2 text-white"
			/>
			<input
				type="text"
				placeholder="Descripción"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				className="mt-2 w-full rounded-md bg-gray-700 px-3 py-2 text-white"
			/>
			<div className="mt-4 flex items-center">
				<input
					type="checkbox"
					id="is_featured"
					checked={is_featured}
					onChange={(e) => setIsFeatured(e.target.checked)}
					className="mr-2"
				/>
				<label htmlFor="is_featured" className="text-white">
					Categoría destacada
				</label>
			</div>
			<button
				onClick={onSubmit}
				className="mt-4 w-full rounded-md bg-[#3AF4EF] px-4 py-2 font-bold text-white hover:bg-[#00BDD8]"
			>
				Guardar
			</button>
		</div>
	</div>
);

const PaginationControls = ({
	currentPage,
	totalPages,
	onPageChange,
}: {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}) => (
	<div className="mt-4 flex justify-center space-x-4">
		<button
			disabled={currentPage === 1}
			onClick={() => onPageChange(currentPage - 1)}
			className="rounded-md bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
		>
			<ChevronLeft size={20} />
		</button>
		<span className="text-white">
			{currentPage} de {totalPages}
		</span>
		<button
			disabled={currentPage === totalPages}
			onClick={() => onPageChange(currentPage + 1)}
			className="rounded-md bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
		>
			<ChevronRight size={20} />
		</button>
	</div>
);

const LoaderComponent = () => (
	<div className="mt-6 flex justify-center">
		<Loader2 className="text-primary size-6" />
	</div>
);

const ErrorMessage = ({ message }: { message: string }) => (
	<div className="mt-6 text-red-500">{message}</div>
);

const TableComponent = ({
	data,
	onEdit,
	onDelete,
}: {
	data: Category[];
	onEdit: (item: Category) => void;
	onDelete: (item: Category) => void;
}) => (
	<table className="mt-6 w-full border-collapse rounded-lg bg-gray-800 text-white shadow-lg">
		<thead className="bg-[#00BDD8] text-[#01142B]">
			<tr>
				<th className="px-4 py-3 text-left text-xs font-semibold">Nombre</th>
				<th className="px-4 py-3 text-left text-xs font-semibold">
					Descripción
				</th>
				<th className="px-4 py-3 text-left text-xs font-semibold">Acciones</th>
			</tr>
		</thead>
		<tbody className="divide-y divide-gray-700">
			{data.map((item) => (
				<tr key={item.id} className="hover:bg-gray-700">
					<td className="px-4 py-3">{item.name}</td>
					<td className="px-4 py-3">{item.description}</td>
					<td className="flex space-x-2 px-4 py-3">
						<button onClick={() => onEdit(item)} className="text-yellow-500">
							<Edit size={14} />
						</button>
						<button onClick={() => onDelete(item)} className="text-red-500">
							<Trash2 size={14} />
						</button>
					</td>
				</tr>
			))}
		</tbody>
	</table>
);

// ✅ Modal Confirmación de Eliminación
const ConfirmDeleteModal = ({
	item,
	onClose,
	onConfirm,
}: {
	item: { id: number; name: string };
	onClose: () => void;
	onConfirm: () => void;
}) => (
	<div className="fixed inset-0 z-50 flex items-center justify-center">
		<div className="absolute inset-0 bg-black opacity-80" />
		<div className="relative z-10 w-full max-w-sm rounded-lg bg-gray-800 p-6 shadow-lg">
			<h2 className="text-lg font-bold text-white">
				¿Eliminar &quot;{item.name}&quot;?
			</h2>
			<p className="mt-2 text-gray-300">Esta acción no se puede deshacer.</p>
			<div className="mt-4 flex justify-end space-x-2">
				<button
					onClick={onClose}
					className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-500"
				>
					Cancelar
				</button>
				<button
					onClick={onConfirm}
					className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-500"
				>
					Eliminar
				</button>
			</div>
		</div>
	</div>
);
