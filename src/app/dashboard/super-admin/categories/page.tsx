'use client';

import { useEffect, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Trash2,
  X,
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
        {/* Action buttons with consistent styling */}
        <div className="my-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setName('');
              setDescription('');
              setIsFeatured(false);
            }}
            className="
              group/button relative inline-flex items-center justify-center
              gap-1 overflow-hidden rounded-md border border-white/20
              bg-background px-2 py-1.5 text-xs text-primary transition-all
              hover:bg-primary/10
              sm:gap-2 sm:px-4 sm:py-2 sm:text-sm
            "
          >
            <span className="relative z-10 font-medium">Crear Categoría</span>
            <Plus
              className="
                relative z-10 size-3.5
                sm:size-4
              "
            />
            <div
              className="
                absolute inset-0 z-0 bg-gradient-to-r from-transparent
                via-white/10 to-transparent opacity-0 transition-all
                duration-500
                group-hover/button:[transform:translateX(100%)]
                group-hover/button:opacity-100
              "
            />
          </button>
        </div>

        {/* View toggle with card styling */}
        <div
          className="
            rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm
          "
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveView('featured')}
              className={`
                rounded-md px-4 py-2 text-sm font-semibold
                transition-colors
                ${
                  activeView === 'featured'
                    ? 'border border-[#00BDD8]/40 bg-[#00BDD8]/10 text-[#00BDD8]'
                    : `
                      border border-white/10 bg-gray-900/50 text-gray-400
                      hover:text-white
                    `
                }
              `}
            >
              Categorías Destacadas
            </button>
            <button
              onClick={() => setActiveView('other')}
              className={`
                rounded-md px-4 py-2 text-sm font-semibold
                transition-colors
                ${
                  activeView === 'other'
                    ? 'border border-[#00BDD8]/40 bg-[#00BDD8]/10 text-[#00BDD8]'
                    : `
                      border border-white/10 bg-gray-900/50 text-gray-400
                      hover:text-white
                    `
                }
              `}
            >
              Otras Categorías
            </button>
          </div>
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
  <div
    className="
      fixed inset-0 z-[9999] flex items-center justify-center bg-black/50
    "
  >
    <div
      className="
        relative m-4 w-full max-w-lg rounded-xl bg-[#01142B] p-4 text-white
        shadow-2xl
        md:p-8
      "
    >
      <div
        className="
          mb-6 flex items-center justify-between border-b border-white/10
          pb-4
        "
      >
        <h2 className="text-2xl font-bold text-[#3AF4EF]">{title}</h2>
        <button
          onClick={onClose}
          className="
            rounded-lg bg-white/5 p-2
            hover:bg-white/10
          "
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Nombre
          </label>
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
              w-full rounded-md border border-gray-700 bg-gray-900/50 px-4
              py-2 text-white
              placeholder:text-gray-400
            "
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Descripción
          </label>
          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="
              w-full rounded-md border border-gray-700 bg-gray-900/50 px-4
              py-2 text-white
              placeholder:text-gray-400
            "
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_featured"
            checked={is_featured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="rounded border-white/20 accent-cyan-400"
          />
          <label htmlFor="is_featured" className="text-sm text-gray-300">
            Categoría destacada
          </label>
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="
          group/button relative mt-6 inline-flex w-full items-center
          justify-center gap-2 overflow-hidden rounded-md border
          border-white/20 bg-background px-4 py-2 text-sm text-primary
          transition-all
          hover:bg-primary/10
        "
      >
        <span className="relative z-10 font-medium">Guardar</span>
        <div
          className="
            absolute inset-0 z-0 bg-gradient-to-r from-transparent
            via-white/10 to-transparent opacity-0 transition-all duration-500
            group-hover/button:[transform:translateX(100%)]
            group-hover/button:opacity-100
          "
        />
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
  <div className="mt-6 flex items-center justify-center gap-4">
    <button
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
      className="
        group/button relative inline-flex items-center justify-center
        gap-1 overflow-hidden rounded-md border border-white/20
        bg-background px-2 py-1.5 text-xs text-primary transition-all
        hover:bg-primary/10
        disabled:cursor-not-allowed disabled:opacity-40
        sm:gap-2 sm:px-4 sm:py-2 sm:text-sm
      "
    >
      <ChevronLeft
        className="
          relative z-10 size-3.5
          sm:size-4
        "
      />
    </button>
    <span className="text-sm text-gray-300">
      {currentPage} de {totalPages || 1}
    </span>
    <button
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => onPageChange(currentPage + 1)}
      className="
        group/button relative inline-flex items-center justify-center
        gap-1 overflow-hidden rounded-md border border-white/20
        bg-background px-2 py-1.5 text-xs text-primary transition-all
        hover:bg-primary/10
        disabled:cursor-not-allowed disabled:opacity-40
        sm:gap-2 sm:px-4 sm:py-2 sm:text-sm
      "
    >
      <ChevronRight
        className="
          relative z-10 size-3.5
          sm:size-4
        "
      />
    </button>
  </div>
);

const LoaderComponent = () => (
  <div
    className="
      mt-6 flex items-center justify-center rounded-xl border
      border-[#1a2a35] bg-[#0a0f14] p-12 text-gray-400
    "
  >
    <Loader2 className="size-6 animate-spin text-primary" />
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div
    className="
      mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm
      text-red-400
    "
  >
    {message}
  </div>
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
  <div
    className="
      overflow-hidden rounded-lg bg-gray-800/50 shadow-xl backdrop-blur-sm
    "
  >
    <div className="overflow-x-auto">
      <table
        className="
          min-w-full table-auto border-collapse overflow-hidden rounded-xl
          border border-[#1a2a35] bg-[#0a0f14]
        "
      >
        <thead>
          <tr className="border-b border-[#00BDD8] bg-[#0d1a22]">
            <th
              className="
                p-3 text-left text-[10px] font-semibold tracking-[0.12em]
                text-[#00BDD8] uppercase
                sm:px-4
              "
            >
              Nombre
            </th>
            <th
              className="
                p-3 text-left text-[10px] font-semibold tracking-[0.12em]
                text-[#00BDD8] uppercase
                sm:px-4
              "
            >
              Descripción
            </th>
            <th
              className="
                p-3 text-left text-[10px] font-semibold tracking-[0.12em]
                text-[#00BDD8] uppercase
                sm:px-4
              "
            >
              Destacada
            </th>
            <th
              className="
                p-3 text-right text-[10px] font-semibold tracking-[0.12em]
                text-[#00BDD8] uppercase
                sm:px-4
              "
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="
                border-b border-[#111c24] transition-colors
                last:border-0
                hover:bg-[#0d1e28]
              "
            >
              <td
                className="
                  p-3 text-xs font-medium text-[#e8f4f8]
                  sm:p-4 sm:text-sm
                "
              >
                {item.name}
              </td>
              <td
                className="
                  p-3 text-xs text-[#7ab8cc]
                  sm:p-4 sm:text-sm
                "
              >
                {item.description}
              </td>
              <td className="p-3 sm:p-4">
                <span
                  className={`
                    inline-flex items-center gap-1.5 rounded px-2.5 py-1
                    text-[10px] font-semibold tracking-[0.08em] uppercase
                    ${
                      item.is_featured
                        ? 'border border-[#00e676]/20 bg-[#0a2a1a] text-[#00e676]'
                        : 'border border-[#ff5252]/20 bg-[#2a0a0a] text-[#ff5252]'
                    }
                  `}
                >
                  {item.is_featured ? 'Sí' : 'No'}
                </span>
              </td>
              <td className="p-3 sm:p-4">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onEdit(item)}
                    className="
                      rounded-md p-1.5 text-gray-400 transition-colors
                      hover:bg-white/5 hover:text-primary
                    "
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="
                      rounded-md p-1.5 text-gray-400 transition-colors
                      hover:bg-white/5 hover:text-red-400
                    "
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
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
  <div
    className="
      fixed inset-0 z-[9999] flex items-center justify-center bg-black/50
    "
  >
    <div
      className="
        relative m-4 w-full max-w-md rounded-xl bg-[#01142B] p-4 text-white
        shadow-2xl
        md:p-8
      "
    >
      <div
        className="
          mb-6 flex items-center justify-between border-b border-white/10
          pb-4
        "
      >
        <h2 className="text-2xl font-bold text-[#3AF4EF]">
          ¿Eliminar &quot;{item.name}&quot;?
        </h2>
        <button
          onClick={onClose}
          className="
            rounded-lg bg-white/5 p-2
            hover:bg-white/10
          "
        >
          <X className="size-5" />
        </button>
      </div>
      <p className="text-sm text-gray-300">Esta acción no se puede deshacer.</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="
            group/button relative inline-flex items-center justify-center
            gap-2 overflow-hidden rounded-md border border-white/20
            bg-background px-4 py-2 text-sm text-primary transition-all
            hover:bg-primary/10
          "
        >
          <span className="relative z-10 font-medium">Cancelar</span>
          <div
            className="
              absolute inset-0 z-0 bg-gradient-to-r from-transparent
              via-white/10 to-transparent opacity-0 transition-all
              duration-500
              group-hover/button:[transform:translateX(100%)]
              group-hover/button:opacity-100
            "
          />
        </button>
        <button
          onClick={onConfirm}
          className="
            rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2
            text-sm text-red-400
            hover:bg-red-500/20
          "
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
);
