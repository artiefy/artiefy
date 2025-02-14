'use client';

import { useEffect, useState } from 'react';
import { Loader2, X, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import SuperAdminLayout from './../../super-admin/super-admin-layout';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{ id: number; name: string; description: string }[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  // 🔹 Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/categories');
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();
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
        body: JSON.stringify({ name, description }),
      });
      setName('');
      setDescription('');
      fetchCategories();
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
        body: JSON.stringify({ id: editingCategory.id, name, description }),
      });
      setEditingCategory(null);
      setName('');
      setDescription('');
      fetchCategories();
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
      fetchCategories();
      setShowConfirmDelete(null);
    } catch {
      setError('Error al eliminar categoría.');
    }
  }

  // 🔹 Lógica de paginación
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const paginatedCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <header className="flex items-center justify-between rounded-lg bg-[#00BDD8] p-6 text-3xl font-bold text-[#01142B] shadow-md">
          <h1>Gestión de Categorías</h1>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setName('');
              setDescription('');
            }}
            className="flex items-center rounded-md bg-secondary px-4 py-2 font-semibold text-white shadow-md hover:bg-[#00A5C0]"
          >
            <Plus className="mr-2 size-5" /> Crear
          </button>
        </header>

        {showCreateForm && (
          <ModalForm
            title="Nueva Categoría"
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreate}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
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
          />
        )}

        {showConfirmDelete && (
          <ConfirmDeleteModal item={showConfirmDelete} onClose={() => setShowConfirmDelete(null)} onConfirm={() => handleDelete(showConfirmDelete.id)} />
        )}

        {loading ? (
          <LoaderComponent />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            <TableComponent
              data={paginatedCategories}
              onEdit={(item) => {
                setEditingCategory(item);
                setName(item.name);
                setDescription(item.description);
                setShowEditForm(true);
              }}
              onDelete={setShowConfirmDelete}
            />

            {/* 🔹 Controles de paginación */}
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}

const ModalForm = ({ title, onClose, onSubmit, name, setName, description, setDescription }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-b from-[#01142B] to-[#01142B] opacity-80"></div>
    <div className="relative z-10 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button onClick={onClose}>
          <X className="size-6 text-gray-300 hover:text-white" />
        </button>
      </div>
      <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-4 rounded-md bg-gray-700 px-3 py-2 text-white" />
      <input type="text" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-2 rounded-md bg-gray-700 px-3 py-2 text-white" />
      <button onClick={onSubmit} className="mt-4 w-full bg-primary px-4 py-2 font-bold text-white rounded-md hover:bg-secondary">Guardar</button>
    </div>
  </div>
);

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center mt-4 space-x-4">
    <button
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
      className="px-4 py-2 rounded-md bg-gray-700 text-white disabled:opacity-50"
    >
      <ChevronLeft size={20} />
    </button>
    <span className="text-white">{currentPage} de {totalPages}</span>
    <button
      disabled={currentPage === totalPages}
      onClick={() => onPageChange(currentPage + 1)}
      className="px-4 py-2 rounded-md bg-gray-700 text-white disabled:opacity-50"
    >
      <ChevronRight size={20} />
    </button>
  </div>
);

const LoaderComponent = () => <div className="flex justify-center mt-6"><Loader2 className="size-6 animate-spin text-primary" /></div>;

const ErrorMessage = ({ message }) => <div className="text-red-500 mt-6">{message}</div>;

const TableComponent = ({ data, onEdit, onDelete }) => (
  <table className="w-full mt-6 border-collapse bg-gray-800 text-white rounded-lg shadow-lg">
    <thead className="bg-[#00BDD8] text-[#01142B]">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold">Nombre</th>
        <th className="px-4 py-3 text-left text-xs font-semibold">Descripción</th>
        <th className="px-4 py-3 text-left text-xs font-semibold">Acciones</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-700">
      {data.map((item) => (
        <tr key={item.id} className="hover:bg-gray-700">
          <td className="px-4 py-3">{item.name}</td>
          <td className="px-4 py-3">{item.description}</td>
          <td className="px-4 py-3 flex space-x-2">
            <button onClick={() => onEdit(item)} className="text-yellow-500"><Edit size={14} /></button>
            <button onClick={() => onDelete(item)} className="text-red-500"><Trash2 size={14} /></button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ✅ Modal Confirmación de Eliminación
const ConfirmDeleteModal = ({ item, onClose, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-80"></div>
      <div className="relative z-10 w-full max-w-sm rounded-lg bg-gray-800 p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">¿Eliminar "{item.name}"?</h2>
        <p className="mt-2 text-gray-300">Esta acción no se puede deshacer.</p>
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-white hover:bg-gray-500">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-500">Eliminar</button>
        </div>
      </div>
    </div>
  );
  